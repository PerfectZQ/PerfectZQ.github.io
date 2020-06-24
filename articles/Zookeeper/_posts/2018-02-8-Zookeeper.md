---
layout: post
title: Zookeeper
tag: Zookeeper
---


## 简介

Zookeeper 的数据结构类似 Linux 文件系统

对于 Zookeeper 的每一个节点，节点一定有值，没有值是没有办法创建成功的，可以指定为空串。

Zookeeper 为程序提供节点的监听服务（类似数据库触发器，当数据发生变化，会通知客户端程序）

## Install
```shell
# Download
$ wget https://mirrors.tuna.tsinghua.edu.cn/apache/zookeeper/zookeeper-3.6.1/apache-zookeeper-3.6.1-bin.tar.gz
$ tar -zxvf apache-zookeeper-3.6.1-bin.tar.gz

$ cd apache-zookeeper-3.6.1-bin/conf && cp zoo_sample.cfg zoo.cfg

# 修改配置文件
$ vim zoo.cfg
# The number of milliseconds of each tick
tickTime=2000
# The number of ticks that the initial 
# synchronization phase can take
initLimit=10
# The number of ticks that can pass between 
# sending a request and getting an acknowledgement
syncLimit=5
# the directory where the snapshot is stored.
# do not use /tmp for storage, /tmp here is just 
# example sakes.
dataDir=/data/zookeeper/dataDir
# write the transaction log to the dataLogDir rather than the dataDir
dataLogDir=/data/zookeeper/dataLogDir
# the port at which the clients will connect
clientPort=2182
# the maximum number of client connections.
# increase this if you need to handle more clients
maxClientCnxns=1000
#
# Be sure to read the maintenance section of the 
# administrator guide before turning on autopurge.
#
# http://zookeeper.apache.org/doc/current/zookeeperAdmin.html#sc_maintenance
#
# The number of snapshots to retain in dataDir
#autopurge.snapRetainCount=3
# Purge task interval in hours
# Set to "0" to disable auto purge feature
#autopurge.purgeInterval=1

standaloneEnabled=false
# https://zookeeper.apache.org/doc/r3.6.0/zookeeperReconfig.html
# https://blog.csdn.net/u012421093/article/details/105313699
#reconfigEnabled=true
#dynamicConfigFile=/opt/apache-zookeeper-3.6.1-bin/conf/zoo.cfg.dynamic

## Metrics Providers
#
# https://prometheus.io Metrics Exporter
#metricsProvider.className=org.apache.zookeeper.metrics.prometheus.PrometheusMetricsProvider
#metricsProvider.httpPort=7000
#metricsProvider.exportJvmInfo=true

# Server Config
server.1=10.53.4.232:2999:3999:participant;0.0.0.0:2182
server.2=10.53.7.223:2999:3999:participant;0.0.0.0:2182
server.3=10.53.4.238:2999:3999:participant;0.0.0.0:2182

## Security Config
# enable server sasl authentication
authProvider.1=org.apache.zookeeper.server.auth.SASLAuthenticationProvider
authProvider.2=org.apache.zookeeper.server.auth.SASLAuthenticationProvider
authProvider.3=org.apache.zookeeper.server.auth.SASLAuthenticationProvider


# 创建 myid 
$ vim /data/zookeeper/dataDir/myid
1


# JAAS Server 配置
$ vim conf/jaas-server.conf
Server {
       org.apache.zookeeper.server.auth.DigestLoginModule required
       user_admin="password"
       user_zhangqiang="password";
};

# JAAS Client 配置
$ vim conf/jaas-client.conf
Client {
       org.apache.zookeeper.server.auth.DigestLoginModule required
       username="admin"
       password="password";
};

# 配置 JVM 启动参数
$ vim conf/java.env
# New in 3.6.0: When set to true, ZooKeeper server will only accept connections and requests from clients that have authenticated with server via SASL. 
# Clients that are not configured with SASL authentication, or configured with SASL but failed authentication (i.e. with invalid credential) will not be
# able to establish a session with server. A typed error code (-124) will be delivered in such case, both Java and C client will close the session with
# server thereafter, without further attempts on retrying to reconnect.
SASL_OPT="-Dzookeeper.sessionRequireClientSASLAuth=true"
# Note: use absolute path
JAAS_SERVER_OPT="-Djava.security.auth.login.config=/opt/apache-zookeeper-3.6.1-bin/conf/jaas-server.conf"
JAAS_CLIENT_OPT="-Djava.security.auth.login.config=/opt/apache-zookeeper-3.6.1-bin/conf/jaas-client.conf"
# Disable all 4 letters commands
FOUR_LW_OPT="-D4lw.commands.whitelist=none"

SERVER_JVMFLAGS="$SERVER_JVMFLAGS $JAAS_SERVER_OPT $SASL_OPT $FOUR_LW_OPT"

CLIENT_JVMFLAGS="$CLIENT_JVMFLAGS $JAAS_CLIENT_OPT"


# 启动
$ bin/zkServer.sh start
```

## zkCli
```shell
# 连接 zookeeper server
$ bin/zkCli.sh -server 192.168.51.246:2181
Connecting to 192.168.51.246:2181
# Zookeeper Server version
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