---
layout: post
title: Properties的使用
tag: Java
---

### 获取resource文件夹中的properties文件
```
import java.util.Properties

val props: Properties = new Properties()
props.load(getClass.getClassLoader.getResourceAsStream("mongodb.properties"))
props.get("ip").toString
```
### 获取其他文件夹中的properties文件
```
import java.util.Properties

val props: Properties = new Properties()
props.load(new FileInputStream("/opt/neu/submit/gd_log_analyse.properties"))
props.get("ip").toString
```