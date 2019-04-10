---
layout: post
title: HBase Install
tag: HBase
---

## 安装
指定环境变量
```shell
$ vim ~/.bash_profile
export HADOOP_HOME=/home/hadoop/hadoop-3.1.2
export HBASE_HOME=/home/hadoop/hbase-2.0.5
export PATH=$PATH:$HOME/.local/bin:$HOME/bin:$HADOOP_HOME/bin:$HADOOP_HOME/sbin:$HBASE_HOME/bin
$ . ~/.bash_profile

$ vim $HBASE_HOME/conf/hbase-env.sh
# Set environment variables here.
# The java implementation to use.
export JAVA_HOME=/usr/jdk64/jdk1.8.0_112
```

修改配置文件`$HBASE_HOME/conf/hbase-site.xml `
```xml
<configuration>
  <!-- 存储 hbase 数据的路径，可以是 file:///home/hadoop/hbase -->
  <property>
    <name>hbase.rootdir</name>
    <value>hdfs:///hbase</value>
  </property>
  <property>
    <name>hbase.zookeeper.property.dataDir</name>
    <value>/home/hadoop/zookeeper</value>
  </property>
  <property>
    <name>hbase.unsafe.stream.capability.enforce</name>
    <value>false</value>
    <description>
      Controls whether HBase will check for stream capabilities (hflush/hsync).

      Disable this if you intend to run on LocalFileSystem, denoted by a rootdir
      with the 'file://' scheme, but be mindful of the NOTE below.

      WARNING: Setting this to false blinds you to potential data loss and
      inconsistent system state in the event of process and/or node failures. If
      HBase is complaining of an inability to use hsync or hflush it's most
      likely not a false positive.
    </description>
  </property>
</configuration>
```

## 启动
```shell
$ start-hbase.sh
```

连接 hbase shell
```shell
$ hbase shell
```