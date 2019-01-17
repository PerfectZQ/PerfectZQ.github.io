---
layout: post
title: Zookeeper
tag: Zookeeper
---

Zookeeper 的数据结构类似 Linux 文件系统

对于 Zookeeper 的每一个节点，节点一定有值，没有值是没有办法创建成功的，可以指定为空串。

Zookeeper 为程序提供节点的监听服务（类似数据库触发器，当数据发生变化，会通知客户端程序）

## 节点类型
### 持久节点
```shell
$ create /persist ""
```

### 临时节点
当创建临时节点的客户端与 Zookeeper 断开连接时，临时节点会被删除
```shell
$ create -e /temp ""
```

### 有序节点
连续创建有序节点，节点后缀会自增1
```shell
$ create -s /seq ""
$ create -s /seq ""
```
### 无序节点
无序节点，连续创建会抛出异常
```shell
$ create /ordinary ""
$ create /ordinary ""
```


## zookeeper 分布式锁
### 使用临时节点
缺点：羊群效应（不公平）。当锁释放后，假设有10000个进程去竞争锁，只有1个进程会成功，而其他9999个进程都会失败，资源浪费。

### 使用有序临时节点




## 异常
### 连接 zookeeper 特别慢
```shell
# 查看 hostname
$ hostname
zhangqiangdeMacBook-Pro.local
# 将 hostname 配置到 127.0.0.1/::1
$ vim /etc/hosts
127.0.0.1       zhangqiangdeMacBook-Pro.local localhost
::1             zhangqiangdeMacBook-Pro.local localhost
```