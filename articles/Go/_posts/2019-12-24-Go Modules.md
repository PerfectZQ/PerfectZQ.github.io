---
layout: post
title: Go Modules
tag: Go
---

## 介绍
Java 管理依赖的工具有 Maven、Gradle，而对于 Go，以前(1.13之前)则是依赖`GOPATH`，`GOPATH`下有三个目录
* `$GOPATH/src`: go 编译时查找代码的地方，例如`import (k8s.io/kubernetes/cmd/kubectl/app)`，就需要将`k8s.io/kubernetes/cmd/kubectl/app`放在`src`目录下
* `$GOPATH/bin`: `go get`、`godep` 这种 bin 工具包的时候，二进制文件下载的目的地
* `$GOPATH/pkg`: 编译生成的 lib 文件存储的地方

自 1.13 之后[Go Modules](https://blog.golang.org/using-go-modules)正式成为默认依赖管理方式。项目也不必一定要在`$GOPATH/src`中了，现在 Go 允许在`$GOPATH/src`外的任何目录使用`go.mod`创建项目

```
# GOROOT 就是 Go 的安装目录，类似于 Java 的 JDK
export GOROOT=/usr/local/go1.16.7
# GOPATH 是我们的工作空间，保存 Go 项目代码和第三方依赖包
export GOPATH=/Users/zhangqiang/go
```

### Global Caching
Go modules 的全局数据缓存
* 同一个模块版本的数据只缓存一份，所有其他模块共享使用。
* 目前所有模块版本数据均缓存在`$GOPATH/pkg/mod`和`$GOPATH/pkg/sum`下，未来或将移至`$GOCACHE/mod`和`$GOCACHE/sum`下(可能会在当`$GOPATH`被淘汰后)。
* 可以使用`go clean -modcache`清理所有已缓存的模块版本数据。
* 另外在 1.11 之后`GOCACHE`已经不允许设置为`off`了

## 配置环境变量
```shell
# 查看所有环境变量
$ go env

# 修改 GOBIN 路径（Optional）
$ go env -w GOBIN=$HOME/bin

# 打开 Go Modules
# auto(default): 只在项目包含了 go.mod 文件时启用 Go modules
# on:            启用 Go modules
# off:           禁用 Go modules
$ go env -w GO111MODULE=on

# 设置 GOPROXY，设置 Go 模块代理，它的值是一个以英文逗号`,`分割的 Go module proxy 列表
# 默认是 proxy.golang.org ，国内访问不了。direct 为特殊指示符，用于指示 Go 回源到模块版
# 本的源地址去抓取(比如 GitHub 等)，当值列表中上一个 Go module proxy 返回 404 或 410 
# 错误时，Go 自动尝试列表中的下一个，遇见 direct 时回源，遇见 EOF 时终止并抛出类似 
# `invalid version: unknown revision...` 的错误。
$ go env -w GOPROXY=https://goproxy.io,direct
# GoLand 设置
Settings -> Go -> Go Moudles(vgo) -> Enable Go Modules (vgo) integration -> Proxy https://goproxy.io,direct
# 如果是 vendoring 项目可以 check Vendoring mode 


# 设置私库地址(1.13+)，它可以声明指定域名为私有仓库，go get 在处理该域名下的所有依赖时，
# 会直接跳过 GOPROXY 和 CHECKSUM 等逻辑
$ export GOPRIVATE=gitlab.com/xxx
```

## 生成 go.mod
```shell
# 在 $GOPATH/src 之外的目录创建目录
$ mkdir /Users/zhangqiang/GolandProjects/hdfs-download-client

$ cd /Users/zhangqiang/GolandProjects/hdfs-download-client

$ vim main.go
package main

import (
    "github.com/gin-gonic/gin"
    "fmt"
)

func main() {
    r := gin.Default()
    r.GET("/ping", func(c *gin.Context) {
        fmt.Println("hello world!")
        c.JSON(200, gin.H{
            "message": "pong",
        })
    })
    r.Run() // listen and serve on 0.0.0.0:8080
}

# 生成 go.mod 文件
$ go mod init dfs-download-client
go: creating new go.mod: module dfs-download-client

$ ls -l /Users/zhangqiang/GolandProjects/hdfs-download-client
total 16
-rw-r--r--  1 zhangqiang  453037844   36 Dec 24 20:25 go.mod
-rw-r--r--  1 zhangqiang  453037844  308 Dec 24 20:25 main.go

$ cat go.mod 
module dfs-download-client

go 1.13
```

go.mod 是启用了 Go modules 的项目所必须的最重要的文件，它描述了当前项目（也就是当前模块）的元信息，每一行都以一个动词开头，目前有以下 5 个动词:
* module：用于定义当前项目的模块路径。
* go：用于设置预期的 Go 版本。
* require：用于设置一个特定的模块版本。
* exclude：用于从使用中排除一个特定的模块版本。
* replace：用于将一个模块版本替换为另外一个模块版本。

## build
```shell
# 编译
$ go build

# 清理所有无用的依赖
$ go mod tidy

# 查看所有依赖
$ go list -m all
hdfs-download-client
github.com/colinmarc/hdfs v1.1.3
github.com/davecgh/go-spew v1.1.0
github.com/golang/protobuf v1.3.2
github.com/golang/snappy v0.0.1
github.com/linkedin/goavro/v2 v2.9.7
github.com/pmezard/go-difflib v1.0.0
github.com/stretchr/objx v0.1.0
github.com/stretchr/testify v1.4.0
gopkg.in/check.v1 v0.0.0-20161208181325-20d25e280405
gopkg.in/yaml.v2 v2.2.2

# 打包成指定操作系统的二进制可执行包
# 目标处理器的架构，支持一下处理器架构 arm arm64 386 amd64 ppc64 ppc64le mips64 mips64le s390x
$ set GOARCH=amd64
# 指的是目标操作系统，支持以下操作系统 darwin freebsd linux windows android dragonfly netbsd openbsd plan9 solaris
$ set GOOS=linux
$ go build -o gotest main.go
```

## Reference
* [GO 依赖管理工具go Modules](https://segmentfault.com/a/1190000020543746)