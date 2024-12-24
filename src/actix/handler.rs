use crate::config::GitHttpConfig;
use crate::GitConfig;
use async_trait::async_trait;
use std::path::PathBuf;

#[derive(Clone,Debug)]
pub struct ActixGitHttp {
    pub config: GitHttpConfig,
}

#[async_trait]
impl GitConfig for ActixGitHttp {
    async fn rewrite(&self, path: String) -> PathBuf {
        PathBuf::from(&self.config.root).join(path)
    }
}
