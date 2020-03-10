---
layout: post
title: Filter and Interceptor
tag: JavaWeb
---

## Reference
* [Spring过滤器和拦截器的区别](https://blog.csdn.net/yjc0403/article/details/84924548)

## 定义
### 过滤器
Filter 是 Servlet 的，在JavaWeb中，根据传入的 request、response 提前过滤掉一些信息，或者提前设置一些参数，然后再传入servlet或者struts的action进行业务逻辑，比如过滤掉非法url（不是login.do的地址请求，如果用户没有登陆都过滤掉），或者在传入servlet或者 struts的action前统一设置字符集，或者去除掉一些非法字符。

* 过滤器是基于函数回调的
* 过滤器依赖 Servlet 容器
* 过滤器则可以对几乎所有的请求起作用
* 过滤器不能访问 action 上下文、值栈里的对象
* 过滤器只能在容器初始化时被调用一次
* 过滤器无法获取IOC容器中的各个 Bean

### 拦截器
Interceptor 是 Spring AOP 的，在 Service 的方法调用前执行一个方法，或者在方法后调用一个方法。比如动态代理就是拦截器的简单实现，在你调用方法前打印出字符串（或者做其它业务逻辑的操作），也可以在你调用方法后打印出字符串，甚至在你抛出异常的时候做业务逻辑的操作。

* 拦截器是基于 Java 反射（动态代理）的
* 过滤器不依赖 Servlet 容器
* 拦截器只能对 action 请求起作用
* 拦截器可以访问 action 上下文、值栈里的对象
* 在 action 的生命周期中，拦截器可以多次被调用
* 拦截器可以获取IOC容器中的各个 Bean，这点很重要，在拦截器里注入一个service，可以调用业务逻辑。

## 工作流程及顺序
![有帮助的截图]({{ site.url }}/assets/Request工作流程.jpg)

## 应用场景
1. 对于一些不需要用到 Bean 的 request 预处理和 response 后处理，可以过滤器，如：Encoding，CORS(Cross-Origin Resource Sharing，跨域资源共享)
2. 对于一些要用到用到 Bean，或者逻辑比较复杂，有特殊处理的，可以用拦截器