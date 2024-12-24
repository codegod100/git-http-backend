# Git-Http-Backend
[![crates.io](https://img.shields.io/crates/v/git-http-backend.svg)](https://crates.io/crates/git-http-backend)
[![Released API docs](https://docs.rs/git-http-backend/badge.svg)](https://docs.rs/git-http-backend)


this is a simple http server for git
it can be used as a backend for git-http-backend

```shell
cargo run --release --bin server -- -r 'e:' -p 80 -a 'localhost'
```

Next, create a folder `test` under drive E.
```shell
mkdir e:\test
```
Then, create a file `test.git` under drive E.
```shell
git init --bare e:\test\test.git
```

Now we can clone the repository
```shell
git clone http://localhost/test/test.git
```