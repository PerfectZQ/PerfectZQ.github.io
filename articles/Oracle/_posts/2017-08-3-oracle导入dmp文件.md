---
layout: post
title: 导入dmp文件
tag: Oracle
---

### 文件校验
　　为了避免导入时候出现问题，先校验下文件是否在传输过程中出现问题，如果源文件和传输后的文件md5码是相同的可以确认文件在传输中没有出现问题
```shell
[oracle@dbhost impbak]$ md5sum GDI_SI_EPG_HIS_T.dmp
c30715d195627b07693ccf5e0a6249dd  GDI_SI_EPG_HIS_T.dmp
```

### 导入dmp文件:imp
　　在Windows中，imp命令依赖oracle客户端bin文件夹中的命令，如果本地安装的不是完整的oracle（包含service），而是独立的客户端(instant client)，会出现`'imp' 不是内部或外部命令，也不是可运行的程序或批处理文件。`的问题，需要下载Package Tools相关的组件，[http://www.oracle.com/technetwork/cn/database/features/instant-client/index.html](http://www.oracle.com/technetwork/cn/database/features/instant-client/index.html)，下载`instantclient-tools-windows.x64-12.2.0.1.0`，解压到`D:\oracle\instantclient_11_2`文件夹中

　　导入dmp文件，首先确认dmp文件导出的方式，是导出的整个数据库还是只导出一张表。然后需要知道表空间的名称，导出的用户名和密码。

1. 创建表空间
```sql
--表空间名称
create tablespace TS_SI_GATHER_SAFEDATA
--文件存放地址 --size表空间的初始大小
datafile '/data/ora11gdata/lhytbill/BJGD_EPG.dbf' size 200M
-- on 启用自动扩展 off 关闭
autoextend on 
next 10M
-- 表空间最大值 没有限制
maxsize unlimited 
logging extent management local autoallocate
segment space management auto;
-- 查看已存在的表空间信息
select * from dba_data_files
```
2. 创建用户
```sql
--创建用户
create user DTSS_DB_USER identified by "DTSS_DB_USER"
default tablespace "TS_SI_GATHER_SAFEDATA"
temporary tablespace "TEMP"
```
3. 为用户分配权限
```sql
grant  connect,resource,dba to DTSS_DB_USER ;
commit;
```
4. 导入dmp文件
```sql
# username/password@servicename， commit=y即便出了问题之后，之前成功的数据都会写到数据库中
imp DTSS_DB_USER/DTSS_DB_USER@lhytbill  fromuser=DTSS_DB_USER touser=DTSS_DB_USER file=/home/oracle/impbak/GDI_SI_EPG_HIS_T.dmp buffer=40960000 commit=y
```

### imp命令详解

```shell
# 查看imp命令的关键词（属性）
imp -help

Keyword  Description (Default)       Keyword      Description (Default)
--------------------------------------------------------------------------
USERID   username/password           FULL         import entire file (N)
BUFFER   size of data buffer         FROMUSER     list of owner usernames
FILE     input files (EXPDAT.DMP)    TOUSER       list of usernames
SHOW     just list file contents (N) TABLES       list of table names
IGNORE   ignore create errors (N)    RECORDLENGTH length of IO record
GRANTS   import grants (Y)           INCTYPE      incremental import type
INDEXES  import indexes (Y)          COMMIT       commit array insert (N)
ROWS     import data rows (Y)        PARFILE      parameter filename
LOG      log file of screen output   CONSTRAINTS  import constraints (Y)
DESTROY                overwrite tablespace data file (N)
INDEXFILE              write table/index info to specified file
SKIP_UNUSABLE_INDEXES  skip maintenance of unusable indexes (N)
FEEDBACK               display progress every x rows(0)
TOID_NOVALIDATE        skip validation of specified type ids 
FILESIZE               maximum size of each dump file
STATISTICS             import precomputed statistics (always)
RESUMABLE              suspend when a space related error is encountered(N)
RESUMABLE_NAME         text string used to identify resumable statement
RESUMABLE_TIMEOUT      wait time for RESUMABLE 
COMPILE                compile procedures, packages, and functions (Y)
STREAMS_CONFIGURATION  import streams general metadata (Y)
STREAMS_INSTANTIATION  import streams instantiation metadata (N)
DATA_ONLY              import only data (N)
VOLSIZE                number of bytes in file on each volume of a file on tape
```

### Windows下配置Oracle instant client(独立客户端)，并配置PL/SQL
　　下载地址：[http://www.oracle.com/technetwork/cn/database/features/instant-client/index.html](http://www.oracle.com/technetwork/cn/database/features/instant-client/index.html)

　　最基本的是`instantclient-basic-windows.x64-12.2.0.1.0`，还包含其他组件`instantclient-tools-windows.x64-12.2.0.1.0`中包含导出/入数据相关的组件，exp/imp，`instantclient-sqlplus-win-x86-64-10.2.0.3.0.zip`，包含sqlplus，等等……

　　配置环境变量:
* NLS_LANG=AMERICAN_AMERICA.ZHS16GBK
* ORACLE_HOME=D:\oracle\instantclient_12_2
* TNS_ADMIND=D:\oracle\instantclient_12_2，如果这个不配置，PL/SQL会出TNS解析出错的问题
* path中添加`%ORACLE_HOME%`

　　在解压目录中添加tnsnames.ora、listener.ora两个文件

　　在PL/SQL客户端中选首选项（Preferences），配置
* Oracle Home 为 `D:\oracle\instantclient_11_2`
* OCI library 为 `D:\oracle\instantclient_11_2\oci.dll`