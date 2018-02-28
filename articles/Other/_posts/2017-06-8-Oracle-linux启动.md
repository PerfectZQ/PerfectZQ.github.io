---
layout: post
title: Oracle-Linux启动
tag: Mysql
---
## 启动实例分两步
1. 启动`lsnrctl`监听
2. 启动数据库实例

## 启动监听
```shell
su - oracle
# 查看启动状态
lsnrctl status
```

　　下面是未启动监听的状态

```console
LSNRCTL for Linux: Version 12.1.0.2.0 - Production on 28-FEB-2018 15:53:05

Copyright (c) 1991, 2014, Oracle.  All rights reserved.

Connecting to (DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=s12179)(PORT=1521)))
TNS-12541: TNS:no listener
 TNS-12560: TNS:protocol adapter error
  TNS-00511: No listener
   Linux Error: 111: Connection refused
Connecting to (DESCRIPTION=(ADDRESS=(PROTOCOL=IPC)(KEY=EXTPROC1521)))
TNS-12541: TNS:no listener
 TNS-12560: TNS:protocol adapter error
  TNS-00511: No listener
   Linux Error: 111: Connection refused
```

　　启动监听
```shell
lsnrctl start
```

## 启动实例
```shell
[oracle@s12179 ~]$ sqlplus /nolog

SQL> conn as sysdba
Enter user-name: system
Enter password: 
Connected to an idle instance.

SQL> startup
ORACLE instance started.
```

## 关闭实例
```shell
SQL> shutdown
Database closed.
Database dismounted.
ORACLE instance shut down.
```
