use std::path::PathBuf;

#[derive(Clone)]
pub struct GitHttpConfig{
    pub root: PathBuf,
    pub port: u16,
    pub addr: String,
}