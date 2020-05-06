---
layout: post
title: Spring Actuator
tag: JavaWeb
---

* [Spring Boot Reference Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/index.html)
    * [Spring Boot Actuator - Monitoring, Metrics, Auditing, and more.](https://docs.spring.io/spring-boot/docs/current/reference/html/production-ready-features.html#production-ready)
    * [Spring Boot Admin Reference Guide](https://codecentric.github.io/spring-boot-admin/current/)

> Spring Boot Admin is a web application, used for managing and monitoring Spring Boot applications. Each application is considered as a client and registers to the admin server. Behind the scenes, the magic is given by the Spring Boot Actuator endpoints.

简单可以理解为，Spring Boot Admin 可以集成在每个 Spring Boot APP 中，然后以客户端的身份将一些监控的数据提供给单独的服务端 Spring Boot Actuator，由 Spring Boot Actuator 提供统一的 Endpoints