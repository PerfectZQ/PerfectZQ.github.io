---
layout: post
title: MySQL Exceptions
tag: RDBMS
---

## 异常记录
### corruption in the InnoDB tablespace
这种错误一般都是由于断电(power breakdown)导致的。
```console
$ less /var/log/mysqld.log

2019-05-22 21:59:55 0x7fad69ffb700  InnoDB: Assertion failure in thread 140382784435968 in file fut0lst.ic line 85
InnoDB: Failing assertion: addr.page == FIL_NULL || addr.boffset >= FIL_PAGE_DATA
InnoDB: We intentionally generate a memory trap.
InnoDB: Submit a detailed bug report to http://bugs.mysql.com.
InnoDB: If you get repeated assertion failures or crashes, even
InnoDB: immediately after the mysqld startup, there may be
InnoDB: corruption in the InnoDB tablespace. Please refer to
InnoDB: http://dev.mysql.com/doc/refman/5.7/en/forcing-innodb-recovery.html
InnoDB: about forcing recovery.
13:59:55 UTC - mysqld got signal 6 ;
This could be because you hit a bug. It is also possible that this binary
or one of the libraries it was linked against is corrupt, improperly built,
or misconfigured. This error can also be caused by malfunctioning hardware.
Attempting to collect some information that could help diagnose the problem.
As this is a crash and something is definitely wrong, the information
collection process might fail.

key_buffer_size=8388608
read_buffer_size=131072
max_used_connections=0
max_threads=1000
thread_count=0
connection_count=0
It is possible that mysqld could use up to 
key_buffer_size + (read_buffer_size + sort_buffer_size)*max_threads = 405567 K  bytes of memory
Hope that's ok; if not, decrease some variables in the equation.

Thread pointer: 0x7fad500008c0
Attempting backtrace. You can use the following information to find out
where mysqld died. If you see no messages after this, something went
terribly wrong...
stack_bottom = 7fad69ffadb0 thread_stack 0x40000
/usr/sbin/mysqld(my_print_stacktrace+0x3b)[0xf0702b]
/usr/sbin/mysqld(handle_fatal_signal+0x461)[0x7b93a1]
/lib64/libpthread.so.0(+0xf5d0)[0x7fad8b55b5d0]
/lib64/libc.so.6(gsignal+0x37)[0x7fad89f44207]
/lib64/libc.so.6(abort+0x148)[0x7fad89f458f8]
/usr/sbin/mysqld[0x789704]
/usr/sbin/mysqld[0x78922c]
/usr/sbin/mysqld[0x10a0815]
/usr/sbin/mysqld[0x10a2918]
/usr/sbin/mysqld(_Z9trx_purgemmb+0x3c9)[0x10a5119]
/usr/sbin/mysqld(srv_purge_coordinator_thread+0xded)[0x107d72d]
/lib64/libpthread.so.0(+0x7dd5)[0x7fad8b553dd5]
/lib64/libc.so.6(clone+0x6d)[0x7fad8a00bead]

Trying to get some variables.
Some pointers may be invalid and cause the dump to abort.
Query (0): Connection ID (thread ID): 0
Status: NOT_KILLED

The manual page at http://dev.mysql.com/doc/mysql/en/crashing.html contains
information that should help you find out what is causing the crash.
```

看错误日志是`InnoDB tablespace`文件损坏，直接导致`mysql`崩溃后启动不了了。看下日志中的线索[https://dev.mysql.com/doc/refman/5.7/en/forcing-innodb-recovery.html](https://dev.mysql.com/doc/refman/5.7/en/forcing-innodb-recovery.html)，可以在`/etc/my.cnf`中配置参数`innodb_force_recovery`为大于`0`的值以强制启动 InnoDB Storage Engine 以便将实际的数据文件 dump 出来，我这里改成`1`也没有成功启动，文档中介绍必要情况(比如还是起不来)可以调大该参数的值，最大是`6`(只读模式)。

```shell
# 备份原始数据库文件，不知道原始数据存在哪可以查看 /etc/my.cnf 的配置项 datadir=/data/mysql
$ mv /data/mysql /data/mysql_bak20190522

# 修改参数以强制启动 mysql innodb
$ vim /etc/my.cnf
[mysqld]
innodb_force_recovery = 6
$ systemctl start mysqld

# 导出所有数据
$ mysqldump -uroot -p --all-databases > /data/all_databases_data.sql

# 重装 mysql
$ rpm -qa | grep mysql
mysql-community-common-5.7.24-1.el7.x86_64
mysql-community-libs-compat-5.7.24-1.el7.x86_64
mysql-community-libs-5.7.24-1.el7.x86_64
mysql-community-server-5.7.24-1.el7.x86_64
mysql-community-client-5.7.24-1.el7.x86_64
$ rpm -e --nodeps mysql-community-common-5.7.24-1.el7.x86_64 ...
$ rpm -ivh mysql-community-common-5.7.24-1.el7.x86_64 ...

# 查看最近生成的临时密码
$ cat /var/log/mysqld.log | grep "temporary password" 
H+:*lcgPw3SD
# Note: -p和密码之间不要有空格，否则会无法正确传参
$ mysql -uroot -pH+:*lcgPw3SD
# 修改初始密码
mysql> set password = password('your new password');
# 设置密码永不过期
mysql> alter user 'root'@'localhost' password expire never;
# 开启远程节点访问权限
mysql> grant all privileges on *.* to root@"%" identified by 'your new password';
# 刷入操作
mysql> flush privileges;
# 导入数据
mysql> source /data/all_databases_data.sql

# 重启 mysql
# 理论上不需要重装 mysql 只要找到损坏的文件/表删掉就可以了，当然这也取决于你坏的到底是什么文件，我们这里坏的比较彻底，并且
# 里面存的是各个集群的元数据信息，数据量也不是很大，因此这个方式是最无脑也是最快的恢复的方式了。
```

> mysql 默认`innodb_force_recovery = 0`，normal startup without forced recovery，当指定为较大的值时会包含所有更小值的功能，比如3包含了1和2的所有功能。如果能够使用`innodb_force_recovery = 3`或更低的值来转储表，只有损坏的单个页面上的某些数据会丢失，相对安全。4或更高就比较危险了，因为数据文件可能会永久损坏。6被认为是激烈的，因为数据库页面处于过时状态，这反过来可能会在B树和其他数据库结构中引入更多损坏。作为一种安全措施，当`innodb_force_recovery`大于0时，InnoDB 会阻止`INSERT`，`UPDATE`或`DELETE`操作。如果`innodb_force_recovery`设置为4或更高，InnoDB 会以只读模式启动。
