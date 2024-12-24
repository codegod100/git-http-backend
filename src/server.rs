use actix_web::{web, App, HttpServer};
use clap::Parser;
use git_http_backend::actix::handler::ActixGitHttp;
use git_http_backend::actix_git_router;
use git_http_backend::config::GitHttpConfig;
use std::io;
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
pub struct ActixServerArgs {
    #[arg(short, long, default_value = "e:")]
    pub root: String,
    #[arg(short, long, default_value = "80")]
    pub port: u16,
    #[arg(short, long, default_value = "0.0.0.0")]
    pub addr: String,
}

#[tokio::main]
pub async fn main() -> io::Result<()> {
    tracing_subscriber::fmt().init();
    let args = ActixServerArgs::parse();
    let root = PathBuf::from(args.root);
    if !root.exists() {
        panic!("root path not exists");
    }
    let config = ActixGitHttp {
        config: GitHttpConfig {
            root,
            port: args.port,
            addr: args.addr,
        },
    };
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(config.clone()))
            .wrap(actix_web::middleware::Logger::default())
            .configure(|x| actix_git_router::<ActixGitHttp>(x))
    })
    .bind("0.0.0.0:80")?
    .run()
    .await?;
    Ok(())
}
