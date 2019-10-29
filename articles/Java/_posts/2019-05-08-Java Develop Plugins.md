---
layout: post
title: Java Develop Plugins
tag: Java
---

## Lombok
* [juejin.im/post/5b00517cf265da0ba0636d4b](juejin.im/post/5b00517cf265da0ba0636d4b)

### 引入依赖
```xml
<dependency>
  <groupId>org.projectlombok</groupId>
  <artifactId>lombok</artifactId>
  <version>1.16.18</version>
  <scope>provided</scope>
</dependency>
```

### IDEA 集成
* 安装插件 `Preferences -> Plugins -> Lombok`
* 开启注解 `Preferences -> Build,Execution,Deployment -> Compiler -> Annotation Processors -> Enable Annocation Processors`

### 原理
自从Java 6起，`javac`就支持`JSR 269 Pluggable Annotation Processing API`规范，只要程序实现了该API，就能在`javac`运行的时候得到调用。

Lombok 就是一个实现了`JSR 269 API`的程序。在使用`javac`的过程中，它产生作用的具体流程如下：

* `javac` 对源代码进行分析，生成一棵抽象语法树(AST)
* `javac` 编译过程中调用实现了JSR 269的Lombok程序
* 此时 Lombok 就对第一步骤得到的AST进行处理，找到 Lombok 注解所在类对应的语法树(AST)，然后修改该语法树(AST)，增加 Lombok 注解定义的相应树节点
* `javac` 使用修改后的抽象语法树(AST)生成字节码文件

## 实用分享
* [IntelliJ IDEA 超实用使用技巧分享](https://mp.weixin.qq.com/s/X_DKo4pAIa7TootqkJNXhA)
* [IDEA高级用法：集成JIRA、UML类图插件、SSH、FTP...](https://mp.weixin.qq.com/s/K-nhlK5aRBKTE-N_Nk9N4A)
* [IDEA Features](http://www.jetbrains.com/idea/features/)