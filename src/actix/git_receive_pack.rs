use crate::GitConfig;
use actix_web::http::{header, StatusCode};
use actix_web::web::Payload;
use actix_web::{web, HttpRequest, HttpResponse, HttpResponseBuilder, Responder};
use flate2::read::GzDecoder;
use futures_util::StreamExt;
use serde::Serialize;
use std::io;
use std::io::{Cursor, Read, Write};
use std::process::{Command, Stdio};
use tracing::info;

pub async fn git_receive_pack(
    request: HttpRequest,
    mut payload: Payload,
    service: web::Data<impl GitConfig>,
) -> impl Responder {
    let uri = request.uri();
    let path = uri.path().to_string().replace("/git-receive-pack", "");
    info!("Received push request for {:#?}", path);

    // Extract the repository parts from the path
    let parts: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();
    let namespace = if parts.len() > 0 { parts[0] } else { "" };
    let repo_name = if parts.len() > 1 { parts[1] } else { "" };
    info!("Repository namespace: {}, name: {}", namespace, repo_name);

    #[derive(Serialize)]
    struct AuthData {
        namespace: String,
        repo_name: String,
    }

    info!("Sending authentication request");
    // forward request to web app for authentication
    let client = reqwest::Client::new();
    let response = client
        .post("http://localhost:3000/git-auth")
        .header("Content-Type", "application/json")
        .json(&AuthData {
            namespace: namespace.to_string(),
            repo_name: repo_name.to_string(),
        })
        .send()
        .await;
    info!("Status: {:#?}", response);

    let path = service.rewrite(path).await;
    if !path.join("HEAD").exists() || !path.join("config").exists() {
        return HttpResponse::BadRequest().body("Repository not found or invalid.");
    }

    let is_bare_repo = match std::fs::read_to_string(path.join("config")) {
        Ok(config) => config.contains("bare = true"),
        Err(_) => false,
    };
    if !is_bare_repo {
        return HttpResponse::BadRequest().body("Push operation requires a bare repository.");
    }

    let version = request
        .headers()
        .get("Git-Protocol")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();

    let mut resp = HttpResponseBuilder::new(StatusCode::OK);
    resp.append_header(("Content-Type", "application/x-git-receive-pack-advertise"));
    resp.append_header(("Connection", "Keep-Alive"));
    resp.append_header(("Transfer-Encoding", "chunked"));
    resp.append_header(("X-Content-Type-Options", "nosniff"));

    let mut cmd = Command::new("git");
    cmd.arg("receive-pack");
    cmd.arg("--stateless-rpc");
    cmd.arg(".");
    if !version.is_empty() {
        cmd.env("GIT_PROTOCOL", version);
    }
    cmd.stderr(Stdio::piped());
    cmd.stdin(Stdio::piped());
    cmd.stdout(Stdio::piped());
    cmd.current_dir(&path);

    let mut git_process = match cmd.spawn() {
        Ok(process) => process,
        Err(e) => {
            info!("Error running git command: {}", e);
            return HttpResponse::InternalServerError().body("Error running git command");
        }
    };

    let mut stdin = git_process.stdin.take().unwrap();
    let mut stdout = git_process.stdout.take().unwrap();

    let mut bytes = web::BytesMut::new();
    while let Some(chunk) = payload.next().await {
        match chunk {
            Ok(data) => bytes.extend_from_slice(&data),
            Err(e) => {
                return HttpResponse::InternalServerError()
                    .body(format!("Failed to read request body: {}", e))
            }
        }
    }

    let body_data = match request
        .headers()
        .get(header::CONTENT_ENCODING)
        .and_then(|v| v.to_str().ok())
    {
        Some(encoding) if encoding.contains("gzip") => {
            let mut decoder = GzDecoder::new(Cursor::new(bytes));
            let mut decoded_data = Vec::new();
            if let Err(e) = io::copy(&mut decoder, &mut decoded_data) {
                return HttpResponse::InternalServerError()
                    .body(format!("Failed to decode gzip body: {}", e));
            }
            decoded_data
        }
        _ => bytes.to_vec(),
    };

    if let Err(e) = stdin.write_all(&body_data) {
        return HttpResponse::InternalServerError()
            .body(format!("Failed to write to git process: {}", e));
    }
    drop(stdin);

    let body_stream = actix_web::body::BodyStream::new(async_stream::stream! {
        let mut buffer = [0; 8192];
        loop {
            match stdout.read(&mut buffer) {
                Ok(0) => break, // EOF
                Ok(n) => yield Ok::<_, io::Error>(web::Bytes::copy_from_slice(&buffer[..n])),
                Err(e) => {
                    eprintln!("Error reading stdout: {}", e);
                    break;
                }
            }
        }
    });
    resp.body(body_stream)
}
