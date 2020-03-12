---
layout: post
title: SpringBoot 调用外部 RestFul 接口
tag: JavaWeb
---

## Overview

SpringBoot 调用外部 RestFul 接口，大致有如下几种方式
* [HttpClient]()
* [OkHttp]()
* [RestTemplate]()
* [Feign]()

最基本的 HttpClient，或者 OkHttp，都需要很长一段代码（或者我直接复制一个类过来），代码复杂、还要担心资源回收的问题。

RestTemplate 是 Spring 用于同步 Client 端的核心类，简化了与 HTTP 服务的通信，并满足 RestFul 原则，程序代码可以给它提供 URL，并提取结果。默认情况下，RestTemplate 默认依赖 JDK 的 HTTP 连接工具。当然你也可以通过`setRequestFactory`属性切换到不同的 HTTP 源，比如`Apache HttpComponents`、`Netty`和`OkHttp`。

* [Kubernetes 开发 SpringCloud (三)、使用 SpringCloud Feign 进行 SrpingCloud 服务间的通信](https://blog.csdn.net/qq_32641153/article/details/97750629)
