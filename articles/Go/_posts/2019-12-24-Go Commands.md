---
layout: post 
title: Go Commands 
tag: Go
---

## Usage

```shell
$ go
Go is a tool for managing Go source code.

Usage:

        go <command> [arguments]

The commands are:

        bug         start a bug report
        build       compile packages and dependencies
        clean       remove object files and cached files
        doc         show documentation for package or symbol
        env         print Go environment information
        fix         update packages to use new APIs
        fmt         gofmt (reformat) package sources
        generate    generate Go files by processing source
        get         add dependencies to current module and install them
        install     compile and install packages and dependencies
        list        list packages or modules
        mod         module maintenance
        run         compile and run Go program
        test        test packages
        tool        run specified go tool
        version     print Go version
        vet         report likely mistakes in packages

Use "go help <command>" for more information about a command.

Additional help topics:

        buildmode   build modes
        c           calling between Go and C
        cache       build and test caching
        environment environment variables
        filetype    file types
        go.mod      the go.mod file
        gopath      GOPATH environment variable
        gopath-get  legacy GOPATH go get
        goproxy     module proxy protocol
        importpath  import path syntax
        modules     modules, module versions, and more
        module-get  module-aware go get
        module-auth module authentication using go.sum
        module-private module configuration for non-public modules
        packages    package lists and patterns
        testflag    testing flags
        testfunc    testing functions

Use "go help <topic>" for more information about that topic.
```

## 常用命令
```shell
# 会更新指定的包版本和所有依赖该包的版本
$ go get -u github.com/pkg/errors

# 更新 go.mod 中依赖的所有的包
$ go get -u

# 更新指定包到特定的版本
$ go get package@[@version]
# version支持的格式:
# 1. vx.y.z
$ go get -u xxx/pkg/xxx@v1.0.0
# 2. commit的checksum
$ go get xxx/pkg/xxx@fe21520c75483fa7e6acfcfce9827785121652ba
# 3. master, latest
$ go get  xxx/pkg/xxx@latest
```

## Go 的编译命令执行过程
* [初探 Go 的编译命令执行过程](https://halfrost.com/go_command/)