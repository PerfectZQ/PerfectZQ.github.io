---
layout: post
title: Spark-redis整合
tag: Spark
---

## 简介
spark-redis 是为了让spark更简单的操作redis的各种集合

[spark-redis使用入门](https://redislabs.com/solutions/use-cases/spark-and-redis/)

[github地址](https://github.com/RedisLabs/spark-redis)
## 下载并安装 Maven
解压
```shell
sudo mv -rf apache-maven-3.5.0-bin.tar.gz /usr/local/
sudo tar -zxvf apache-maven-3.5.0-bin.tar.gz 
rm apache-maven-3.5.0-bin.tar.gz
```
配置maven环境变量
```shell
MAVEN_HOME=/usr/local/apache-maven-3.5.0
export MAVEN_HOME
export PATH=${PATH}:${MAVEN_HOME}/bin
source ~/.bash_profile
```
验证maven是否安装成功
```shell
mvn -v
```
显示如下
```console
Apache Maven 3.5.0 (ff8f5e7444045639af65f6095c62210b5713f426; 2017-04-04T03:39:06+08:00)
Maven home: /usr/local/apache-maven-3.5.0
Java version: 1.8.0_144, vendor: Oracle Corporation
Java home: /Library/Java/JavaVirtualMachines/jdk1.8.0_144.jdk/Contents/Home/jre
Default locale: zh_CN, platform encoding: UTF-8
OS name: "mac os x", version: "10.12.6", arch: "x86_64", family: "mac"
```
## 下载spark-redis源码
[https://github.com/RedisLabs/spark-redis](https://github.com/RedisLabs/spark-redis)

或者
```shell
git clone https://github.com/RedisLabs/spark-redis.git
```
## 用Maven将源码编译打包
```shell
cd spark-redis
mvn clean package -DskipTests
```
编译完之后会在target文件夹下生成两个jar包，spark-redis-0.3.2.jar和spark-redis-0.3.2-jar-with-dependencies.jar
