---
layout: post
title: Properties的使用
tag: Java
---

## getResource：获取 classpath 
```scala
// 获取classpath的根目录：file:/D:/IdeaProjects/javalearn/target/classes/
println(this.getClass.getClassLoader.getResource(""))
// 获取classpath根目录+当前类包路径：file:/D:/IdeaProjects/javalearn/target/classes/com/zq/
println(this.getClass.getResource(""))
```

## 获取resources文件夹中的properties文件
java项目中的`resources`等资源文件夹中的文件在编译后，会添加到classpath下，因此可以直接使用下面的方法读取资源目录下的文件。
```scala
import java.util.Properties

val props: Properties = new Properties()
props.load(this.getClass.getClassLoader.getResourceAsStream("mongodb.properties"))
props.get("ip").toString
```
## 获取其他文件夹中的properties文件
```scala
import java.util.Properties

val props: Properties = new Properties()
props.load(new FileInputStream("/opt/neu/submit/gd_log_analyse.properties"))
props.get("ip").toString
```