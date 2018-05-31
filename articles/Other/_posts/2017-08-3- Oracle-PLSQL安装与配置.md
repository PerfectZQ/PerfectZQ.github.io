---
layout: post
title: Oracle-PLSQL 安装与配置
tag: Oracle
---
## Windows instant client configure
　　下载地址：[http://www.oracle.com/technetwork/cn/database/features/instant-client/index.html](http://www.oracle.com/technetwork/cn/database/features/instant-client/index.html)

### 下载清单

* 下载 `instantclient-basic-nt-11.2.0.4.0.zip`
* 下载 `instantclient-sqlplus-nt-11.2.0.4.0.zip`
* 下载 `instantclient-tools-nt-11.2.0.4.0.zip`
* 下载 `instantinstantclient-jdbc-nt-11.2.0.4.0.zip`

　　最基本的是`instantclient-basic*`，组件`instantclient-tools*`中包含导出/入数据相关的组件，如`exp/imp`，`instantclient-sqlplus-*`，包含sqlplus，等等……
### 配置环境变量
* ORACLE_HOME=D:\oracle\instantclient_11_2
* NLS_LANG=AMERICAN_AMERICA.ZHS16GBK 或 SIMPLIFIED CHINESE_CHINA.ZHS16GBK
* TNS_ADMIN=D:\oracle\instantclient_11_2，如果这个不配置，PL/SQL会出TNS解析出错的问题
* Path中添加`%ORACLE_HOME%`

### 添加相关文件
　　在解压目录中添加tnsnames.ora、listener.ora两个文件

## Mac instant client configure

### 下载清单
* 下载 `instantclient-basic-macos.x64-12.1.0.2.0.zip`
* 下载 `instantclient-sqlplus-macos.x64-12.1.0.2.0.zip`
* 下载 `instantclient-sdk-macos.x64-12.1.0.2.0.zip`，否则会出现找不到`oci.h`的错误

### 配置环境变量

```shell
vim ~/.bash_profile

# Setting PATH for oracle_instant_12_1
export ORACLE_HOME=/opt/oracle/instantclient_12_1/
export DYLD_LIBRARY_PATH=$ORACLE_HOME
export SQLPATH=$ORACLE_HOME
export TNS_ADMIN=$ORACLE_HOME/network/admin
export LANG=en_US.UTF8
export NLS_LANG=AMERICAN_AMERICA.UTF8
export NLS_DATE_FORMAT="yyyy-mm-dd HH24:MI:SS"
export PATH=$ORACLE_HOME:$PATH

source ~/.bash_profile
```
  
  Add links to $HOME/lib or /usr/local/lib to enable applications to find the libraries. For example, OCI based applications could do:

```shell
$ cd /opt/oracle/instantclient_12_1
$ ln -s libclntsh.dylib.12.1 libclntsh.dylib
# OCCI programs will additionally need:
$ ln -s libocci.dylib.12.1 libocci.dylib
$ mkdir ~/lib
$ ln -s ~/instantclient_12_1/libclntsh.dylib ~/lib/
```
### 验证是否安装成功
```shell
sqlplus username/password@localhost:1521/orcl
```

## 配置 PLSQL
　　在PL/SQL客户端中选首选项（Preferences），配置
* Oracle Home 为 `D:\oracle\instantclient_11_2`
* OCI library 为 `D:\oracle\instantclient_11_2\oci.dll`



