---
layout: post
title: Python Web
tag: Python
---

## Terminology

### Web Server
宽泛的讲，Web Server 本质上就是一个应用程序，在 C/S 架构中，用来接收/处理来自 Client 的 Requst，然后返回 Response

我们常说的 Apache HTTP / Nginx 严格意义上讲是`HTTP Sever`，它更侧重于的是 HTTP 协议层面的传输和访问控制，我们知道 HTTP 协议属于应用层，所以这种服务器的主要功能定位是，代理、负载均衡、访问静态资源、文件服务器。它只需要把客户端请求的服务器上的资源返回给客户端就够了。

而 Tomcat / Undertow / Gunicorn 则属于`Application Server`，顾名思义一个应用程序服务器，首先他要包含一个应用程序，比如 Tomcat / Undertow 包含的就是 Java Application，所以得支持 Java Runtime，这样 Java 程序才能在里面跑起来。然后要支持应用开发相关的规范，比如安全规范、通信接口规范，并提供基础的类库。对于 Tomcat 来讲，就得支持 JSP/Sevlet 规范运行需要的标准类库、接口...应用程序服务器更侧重于动态请求的处理，比如根据请求，去数据库里查询一些动态的数据返回给客户端，或者写一条数据进去。

因为这两种服务器的侧重点不同，因此大部分的服务架构都是 Nginx 反向代理在前，后面挂一堆 Tomcat 微服务，不同的 Tomcat 处理不同服务的业务逻辑。对于前后端分离的场景，一般前端会把编译好的静态资源放在 Nginx 里面。请求先到反向代理 Nginx，然后转到前端 Nginx，前端在访问后端 Tomcat。

### WSGI
WSGI(Web Server Gateway Interface)，Web 服务器网关接口，是 Python 特有的 Web 服务器的接口规范/协议，相当于 Java 特有的 Java Servlet。它介于 Web 服务器和 Python Web 应用程序之间，制定了通信接口标准，以保证不同的 Web 服务器和不同 Python Web 程序之间通信能够兼容。换言之，只要是基于 WSGI 协议的 Python Web 程序，就可以和支持 WSGI 的 Web 服务器通信。反之，比如 Tomcat 不是基于 WSGI 的，所以 Flask 开发的 Web 应用程序就没办法运行在 Tomcat 上。

所以 Web 服务可以分成两部分来看：
* Web 服务器/容器: 它侧重于处理复杂的 HTTP 请求，管理连接、状态等比较底层的网络问题。常见的 WSGI 服务器有`gunicorn`、`uWSGI`、`wsgiref`，原生的`Nginx`、`Apache`、`Lighttpd`是不支持 WSGI 的，要支持的话需要单独安装支持 WSGI 的模块插件。
* Web 应用程序: 它侧重于实现服务的业务逻辑，因此有众多的 Web 开发框架，常见基于 WSGI 的 Python Web 程序开发框架有`Flask`、`Django`，一般 Web 开发框架也有内置的 Http 服务器，但一般只限于本地开发使用，到了正是环境一般还是会运行在专业的服务器里面，例如`gunicorn`。

既然定义了标准，那么 WSGI 的标准或规范是啥
> Web 服务器在将请求转交给 Web 应用程序之前，需要先将 http 报文转换为 WSGI 规定的格式，WSGI 规定，Web 程序必须有一个可调用对象，且该可调用对象接收两个参数，并返回一个可迭代对象：
* environ：字典，包含请求的所有信息
* start_response：在可调用对象中调用的函数，用来发起响应，参数包括 status，headers 等

