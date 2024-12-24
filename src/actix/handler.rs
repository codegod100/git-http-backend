use crate::config::GitHttpConfig;
use std::path::PathBuf;

#[derive(Clone)]
pub struct ActixGitHttp{
    pub config: GitHttpConfig
}

impl ActixGitHttp {
    pub fn rewrite(&self, path: String) -> PathBuf {
        PathBuf::from(&self.config.root).join(path)
    }
}