---
layout: post
title: kubernetes 异常处理
tag:  Kubernetes
---
## kubectl 异常
### no resource found
```shell
# 执行 kubectl 命令时出现下面的 error
No resources found.
Error from server (NotAcceptable): unknown (get pods)

# 原因：尽管 kubernetes 一直说要将 kubectl 更新到最新以防出现未预期的错误，
# 但是版本差太多一样会出现问题。比如：
$ kubectl version
Client Version: version.Info{Major:"1", Minor:"11", GitVersion:"v1.11.2", GitCommit:"bb9ffb1654d4a729bb4cec18ff088eacc153c239", GitTreeState:"clean", BuildDate:"2018-08-08T16:31:10Z", GoVersion:"go1.10.3", Compiler:"gc", Platform:"darwin/amd64"}
Server Version: version.Info{Major:"1", Minor:"8", GitVersion:"v1.8.1", GitCommit:"f38e43b221d08850172a9a4ea785a86a3ffa3b3a", GitTreeState:"clean", BuildDate:"2017-10-11T23:16:41Z", GoVersion:"go1.8.3", Compiler:"gc", Platform:"linux/amd64"}

# 可以看到 client 是 1.11.2 版本的，而 server 是 1.8.1 版本的，这样就会出现上面的问题
# 使用对应版本的 kubectl(v1.8.1) 就不会出现上面的问题了

# OSX
$ curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.8.1/bin/darwin/amd64/kubectl
# Linux
$ curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.8.1/bin/linux/amd64/kubectl
```