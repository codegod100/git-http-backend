use std::io;
use std::path::PathBuf;
use actix_web::{web, App, HttpServer};
use clap::Parser;
use git_http_backend::actix::get_text_file::get_text_file;
use git_http_backend::actix::git_receive_pack::git_receive_pack;
use git_http_backend::actix::git_upload_pack::git_upload_pack;
use git_http_backend::actix::handler::ActixGitHttp;
use git_http_backend::actix::objects_info_packs::objects_info_packs;
use git_http_backend::actix::objects_pack::objects_pack;
use git_http_backend::actix::refs::info_refs;
use git_http_backend::config::GitHttpConfig;

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
pub struct ActixServerArgs{
    #[arg(short, long, default_value = "e:")]
    pub root: String,
    #[arg(short, long, default_value = "80")]
    pub port: u16,
    #[arg(short, long, default_value = "0.0.0.0")]
    pub addr: String,
}


#[tokio::main]
pub async fn main() -> io::Result<()>{
    tracing_subscriber::fmt().init();
    let args = ActixServerArgs::parse();
    let root = PathBuf::from(args.root);
    if !root.exists(){
        panic!("root path not exists");
    }
    let config = ActixGitHttp{
        config: GitHttpConfig{
            root,
            port: args.port,
            addr: args.addr,
        }
    };
    HttpServer::new(move ||{
        App::new()
            .app_data(web::Data::new(config.clone()))
            .wrap(actix_web::middleware::Logger::default())
            .service(web::scope("/{namespace}/{repo}")
                .route("/git-upload-pack", web::to(git_upload_pack))
                .route("/git-receive-pack", web::to(git_receive_pack))
                .route("info/refs", web::to(info_refs))
                .route("HEAD", web::to(get_text_file))
                .route("objects/info/alternates", web::to(get_text_file))
                .route("objects/info/http-alternates", web::to(get_text_file))
                .route("objects/info/packs", web::to(objects_info_packs))
                .route("objects/info/{rest:.*}", web::to(get_text_file))
                .route("objects/pack/{pack}", web::to(objects_pack))
            )
    })
        .bind("0.0.0.0:80")?
        .run()
        .await?;
    Ok(())
}