use crate::actix::handler::ActixGitHttp;
use actix_files::NamedFile;
use actix_web::http::header;
use actix_web::http::header::HeaderValue;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use std::collections::HashMap;

pub async fn get_text_file(request: HttpRequest, service: web::Data<ActixGitHttp>) -> impl Responder{
    let uri = request.uri();
    let path = uri.path().to_string();
    let path = service.rewrite(path);
    let mut resp = HashMap::new();
    resp.insert("Pragma".to_string(),"no-cache".to_string());
    resp.insert("Cache-Control".to_string(),"no-cache, max-age=0, must-revalidate".to_string());
    resp.insert("Expires".to_string(),"Fri, 01 Jan 1980 00:00:00 GMT".to_string());
    if !path.exists() {
        return HttpResponse::NotFound().body("File not found");
    }
    match NamedFile::open(path) {
        Ok(mut named_file) => {
            named_file = named_file.use_last_modified(true);
            let mut response = named_file.into_response(&request);
            for (k, v) in resp.iter() {
                response.headers_mut().insert(
                    k.to_string().parse().unwrap(),
                    HeaderValue::from_str(v).unwrap(),
                );
            }

            response.headers_mut().insert(
                header::CONTENT_TYPE,
                HeaderValue::from_str("text/plain").unwrap(),
            );
            response
        }
        Err(_) => HttpResponse::InternalServerError().body("Failed to open file"),
    }
}