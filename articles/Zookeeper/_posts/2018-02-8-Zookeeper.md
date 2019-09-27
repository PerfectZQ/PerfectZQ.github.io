---
layout: post
title: Zookeeper
tag: Zookeeper
---


## 简介

Zookeeper 的数据结构类似 Linux 文件系统

对于 Zookeeper 的每一个节点，节点一定有值，没有值是没有办法创建成功的，可以指定为空串。

Zookeeper 为程序提供节点的监听服务（类似数据库触发器，当数据发生变化，会通知客户端程序）

## zkCli
```shell
# 连接 zookeeper server
$ ./zkCli.sh -server 192.168.51.246:2181
Connecting to 192.168.51.246:2181
2019-09-27 16:21:49,999 - INFO  [main:Environment@100] - Client environment:zookeeper.version=3.4.6-91--1, built on 01/04/2018 10:34 GMT
2019-09-27 16:21:50,001 - INFO  [main:Environment@100] - Client environment:host.name=ambarissd
2019-09-27 16:21:50,001 - INFO  [main:Environment@100] - Client environment:java.version=1.8.0_181
2019-09-27 16:21:50,003 - INFO  [main:Environment@100] - Client environment:java.vendor=Oracle Corporation
2019-09-27 16:21:50,003 - INFO  [main:Environment@100] - Client environment:java.home=/usr/java/jdk1.8.0_181-amd64/jre
...

# 查看 zkCli 命令
[zk: 192.168.51.246:2181(CONNECTED) 0] help
ZooKeeper -server host:port cmd args
        stat path [watch]
        set path data [version]
        ls path [watch]
        delquota [-n|-b] path
        ls2 path [watch]
        setAcl path acl
        setquota -n|-b val path
        history 
        redo cmdno
        printwatches on|off
        delete path [version]
        sync path
        listquota path
        rmr path
        get path [watch]
        create [-s] [-e] path data acl
        addauth scheme auth
        quit 
        getAcl path
        close 
        connect host:port

# 查看 / 下所有节点
[zk: 192.168.51.246:2181(CONNECTED) 1] ls /
[registry, hiveserver2, zookeeper, hbase-unsecure, rmstore, ambari-metrics-cluster, templeton-hadoop]
```

## 概念
### 节点类型
#### 持久节点
```shell
$ create /persist ""
```

#### 临时节点
当创建临时节点的客户端与 Zookeeper 断开连接时，临时节点会被删除
```shell
$ create -e /temp ""
```

#### 有序节点
连续创建有序节点，节点后缀会自增1
```shell
$ create -s /seq ""
$ create -s /seq ""
```
#### 无序节点
无序节点，连续创建会抛出异常
```shell
$ create /ordinary ""
$ create /ordinary ""
```


## zookeeper 分布式锁
### 使用临时节点
缺点：羊群效应（不公平）。当锁释放后，假设有10000个进程去竞争锁，所释放后会通知10000个进程去竞争所，但最终只有1个进程会成功，而其他9999个进程都会失败，资源浪费。

### 使用有序临时节点




## 异常
### 连接 zookeeper 特别慢
```shell
# 查看 hostname
$ hostname
zhangqiangdeMacBook-Pro.local
# 将 hostname 配置到 127.0.0.1/::1 或者 固定的静态IP
$ vim /etc/hosts
127.0.0.1       zhangqiangdeMacBook-Pro.local localhost
::1             zhangqiangdeMacBook-Pro.local localhost
```