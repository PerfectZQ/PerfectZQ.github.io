---
layout: post
title: MySQL Install
tag: RDBMS
---
## 参考
* [Mysql Official Document](https://dev.mysql.com/doc/refman/8.0/en/)
* [Comment Syntax](https://dev.mysql.com/doc/refman/8.0/en/comments.html)
* [Mysql Download Repo](https://repo.mysql.com//)

## 卸载 MySQL

### 卸载 yum 安装的 MySQL
```shell
$ yum remove -y mysql*

# 验证卸载情况，如果存在继续删
$ rpm -qa | grep -i mysql

# 删除其他相关文件
$ rm -rf /var/lib/mysql
$ rm /etc/my.cnf
```

### 卸载 rpm 安装的 MySQL
```shell
# 查询已经安装的 mysql 包
$ rpm -qa | grep -i mysql
MySQL-test-5.5.54-1.el6.x86_64
MySQL-shared-5.5.54-1.el6.x86_64
MySQL-server-5.5.54-1.el6.x86_64
MySQL-client-5.5.54-1.el6.x86_64
MySQL-devel-5.5.54-1.el6.x86_64
MySQL-embedded-5.5.54-1.el6.x86_64
MySQL-shared-compat-5.5.54-1.el6.x86_64

# 如果有依赖卸载不了可以加参数 --nodeps 强制卸载
$ rpm -e MySQL-test-5.5.54-1.el6.x86_64 MySQL-shared-5.5.54-1.el6.x86_64 MySQL-server-5.5.54-1.el6.x86_64 ...

# 删除服务
$ chkconfig --list | grep -i mysql
$ chkconfig --del mysql
# 或者
$ systemctl disable mysqld

# 删除相关文件
$ whereis mysql 或者 find / -name mysql
$ mysql: /usr/bin/mysql /usr/lib64/mysql /usr/include/mysql /usr/share/mysql
$ rm -rf /usr/lib/mysql
$ rm -rf /usr/lib64/mysql
$ rm -rf /usr/include/mysql
$ rm -rf /usr/share/mysql
$ rm -rf /usr/my.cnf
```

## 安装 MySQL

### rpm 包安装
建议安装 rpm 包，省时省力，只需要指定root密码，不需要额外配置什么东西就可以启动了。
```shell
$ rpm -ivh mysql-community-client-5.7.22-1.el7.x86_64.rpm \
           mysql-community-common-5.7.22-1.el7.x86_64.rpm \
           mysql-community-libs-5.7.22-1.el7.x86_64.rpm \
           mysql-community-server-5.7.22-1.el7.x86_64.rpm
```
  
对于 Mysql5.7+ 的版本，为了加强安全性，为自动为 root 用户随机生成了一个密码，对于 RPM 安装的 Mysql，默认是/var/log/mysqld.log。并且只有在第一次启动 Mysql 才可以在日志中查看临时密码!

如果很不幸你忘记了密码，可以在`/etc/my.cnf`中添加`skip-grant-tables`，然后重启 Mysql，直接进入 Mysql 控制台，然后修改密码就可以了。

```shell
mysql> update mysql.user set authentication_string=password('123456') where user='root' and host='localhost';
```

然后注释掉`/etc/my.cnf`中的`skip-grant-tables`，重启就可以了。

如果修改密码的时候出现`Your password does not satisfy the current policy requirements`，说明你设置的密码不符合安全性规范，如果你就是想设置的简单一些，可以修改两个参数。

```shell
# validate_password_policy 的取值以及含义：
# 0: low      密码检查标准 Length
# 1: medium   密码检查标准 Length; numeric, lowercase/uppercase, and special characters
# 2: strong   密码检查标准 Length; numeric, lowercase/uppercase, and special characters; dictionary file
mysql> set global validate_password_policy=0;
# validate_password_length 参数默认为8，它有最小值的限制，最小值为4，即便你设置成1，它实际也会变成4
mysql> set global validate_password_length=4;
```

### 压缩包安装方式
```shell
$ wget http://dev.mysql.com/get/Downloads/MySQL-5.6/mysql-5.6.33-linux-glibc2.5-x86_64.tar.gz

$ tar -zxvf mysql-5.6.33-linux-glibc2.5-x86_64.tar.gz -C /usr/local/

$ cd /usr/local/

$ ln -s /usr/local/mysql-5.6.33-linux-glibc2.5-x86_64 mysql

$ cd mysql-5.6.33-linux-glibc2.5-x86_64

# deprecated in 5.7 
$ scripts/mysql_install_db --user=despacito
# 5.7
$ bin/mysqld --initialize --user=despacito (super user with random passwd in log) 
# 或者
$ bin/mysqld --initialize-insecure --user=despacito (no passwd) 

# 将启动脚本 mysql.server 放到 /etc/init.d 目录下，这样就可以使用 service 命令了
$ cp support-files/mysql.server /etc/init.d/mysqld
$ chmod 755 /etc/init.d/mysqld

# mysql 配置文件
$ cp support-files/my-default.cnf /etc/my.cnf

# 修改启动脚本
$ vim /etc/init.d/mysqld
# mysql 安装目录
basedir=/usr/local/mysql/
# 数据存储目录
datadir=/usr/local/mysql/data/
```

## 开启 binlog 日志
```shell
$ vim my.inf
# 开启 binlog
log_bin=ON
# binlog 日志基本文件名
log_bin_basename=/var/lib/mysql/mysql-bin
# binlog 的索引文件，用于管理所有 binlog 文件的目录
log_bin_index=/var/lib/mysql/mysql-bin.index

# 查看binlog是否开启成功
mysql> show variables like '%log_bin%'
+---------------------------------+---------------------------------+
| Variable_name                   | Value                           |
+---------------------------------+---------------------------------+
| log_bin                         | ON                              |
| log_bin_basename                | /var/lib/mysql/mysql-bin        |
| log_bin_index                   | /var/lib/mysql/mysql-bin.index  |
| log_bin_trust_function_creators | OFF                             |
| log_bin_use_v1_row_events       | OFF                             |
| sql_log_bin                     | ON                              |
+---------------------------------+---------------------------------+
```

成功开启binlog后，查看binlog文件索引信息
```shell
$ cat /var/lib/mysql/mysql-bin.index
/var/lib/mysql/mysql-bin.000001
/var/lib/mysql/mysql-bin.000002
/var/lib/mysql/mysql-bin.000003
/var/lib/mysql/mysql-bin.000004
```

## 启动/关闭 mysql 服务
```shell
# 查看命令
$ service mysql | service mysqld
# 支持的操作 {start|stop|restart|reload|force-reload|status}
# 例如启动服务，实际上执行的是 ./support-files/mysql.server start
$ service mysql start

# 或者使用 systemctl <option> mysqld
```

## 创建用户与分配权限
```shell
# 查看 mysql 详细用法
$ bin/mysql --help 

# root用户登录 
# 使用 -h 指定远程 mysql 服务器的 hostname，默认 localhost
$ mysql -u root -p

# 第一次登录必须修改生成的初始密码
# === 方式1 === 
# Note: -p和密码之间不要有空格，否则会无法正确传参
$ bin/mysqladmin -u root -p"password" 新密码
# === 方式2 ===
mysql> SET PASSWORD = PASSWORD('your new password');
mysql> ALTER USER 'root'@'localhost' PASSWORD EXPIRE NEVER;
mysql> flush privileges;

# 创建一个新数据库实例，在 mysql shell 中`;`是必须的
mysql> create database testDB;

# 创建一个新用户 test，并将 testDB 的所有权限赋给它。localhost 指只有本机可以登录访问
mysql> grant all privileges on testDB.* to test@localhost identified by '1234';
# "%" 表示除了本机之外的所有主机可以登录访问，要想本机和所有其他主机都可以就同时执行这两条命令
mysql> grant all privileges on testDB.* to test@"%" identified by '1234';

# 创建用户也可以直接操作系统用户表 mysql.user
mysql> insert into mysql.user(Host, User, Password) values("localhost", "test", password("1234"));

# 赋予某些权限，和所有数据库
mysql> select, insert, update, delete, create, drop on *.* to test@localhost identified by '1234';

# Note：8.0 语法
mysql> CREATE USER 'root'@'%' IDENTIFIED BY '你的密码';
mysql> GRANT ALL ON *.* TO 'root'@'%';
# 修改密码
mysql> ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '你的密码';

# 记得刷新系统权限表
mysql> flush privileges; 
```

## 其他命令
```shell
# 删除用户
mysql> Delete FROM mysql.user Where User='test' and Host='localhost';

# 修改用户密码
mysql> update mysql.user set password=password('新密码') where User="test" and Host="localhost";
mysql> flush privileges;

# 列出所有数据库
mysql> show databases;

# 切换数据库
mysql> use '数据库名';

# 列出所有表
mysql> show tables;

# 显示表结构
mysql> describe 表名;

# 删除数据库和表
mysql> drop database 数据库名;
mysql> drop table 数据表名;
```

## 忘记 mysql 用户名密码
```shell
# 首先关闭MySQL实例
$ bin/mysqld stop | service mysqld stop

# 安全模式启动MySQL
$ bin/mysqld_safe --skip-grant-tables &

# 进入MySQL Command Line
$ bin/mysql

# 进来之后，就可以修改密码了
mysql> SET PASSWORD FOR 'root'@'localhost' = PASSWORD('newpass');
mysql> flush privileges;
```

## 数据导出/导入
### 数据导出
```shell
# 查看基本使用方法
$ mysqldump

# 查看详细的使用方法
$ mysqldump --help 

# 导出表
$ mysqldump -uroot -p dbname table1 table2 > /root/data.sql

# 导出指定数据库
$ mysqldump -uroot -p --databases dbname1 dbname2 dbname3 > /root/data.sql

# 导出所有数据库
$ mysqldump -uroot -p --all-databases > /root/all_databases_data.sql
```
### 数据导入
```shell
$ mysql -uroot -p

mysql> source /root/all_databases_data.sql
```

如果有多个 sql 文件需要导入数据库，可以新建一个文件`all.sql`
```shell
$ vim all.sql
# 添加下面的内容
source /root/data1.sql
source /root/data2.sql

# 然后去 mysql 控制台执行
mysql> source /root/all.sql
```
### 导出表结构到 Excel
```mysql
SELECT 
    COLUMN_NAME 列名,
    COLUMN_TYPE 列类型,
    DATA_TYPE 数据类型,
    CHARACTER_MAXIMUM_LENGTH 数据长度,
    IS_NULLABLE 是否为空,
    COLUMN_KEY 键类型,
    COLUMN_DEFAULT 默认值,
    COLUMN_COMMENT 备注
FROM
    INFORMATION_SCHEMA.COLUMNS
WHERE
    TABLE_SCHEMA = 'your_db_name'
AND
    TABLE_NAME = 'your_table_name'
```


## MySQL 修改字符集为 utf8mb4
`utf8mb4`是`MySQL 5.5.3+`支持的字符集
### 查看当前系统默认的字符集设置
```shell
mysql> SHOW VARIABLES WHERE Variable_name LIKE 'character\_set\_%' OR Variable_name LIKE 'collation%';
+--------------------------+-------------------+
| Variable_name            | Value             |
+--------------------------+-------------------+
| character_set_client     | utf8              |
| character_set_connection | utf8              |
| character_set_database   | latin1            |
| character_set_filesystem | binary            |
| character_set_results    | utf8              |
| character_set_server     | latin1            |
| character_set_system     | utf8              |
| collation_connection     | utf8_general_ci   |
| collation_database       | latin1_swedish_ci |
| collation_server         | latin1_swedish_ci |
+--------------------------+-------------------+
10 rows in set (0.04 sec)
```

### 查看某个 database 的字符编码
```shell
mysql> show create database video_search;
+--------------+-------------------------------------------------------------------------+
| Database     | Create Database                                                         |
+--------------+-------------------------------------------------------------------------+
| video_search | CREATE DATABASE `video_search` /*!40100 DEFAULT CHARACTER SET latin1 */ |
+--------------+-------------------------------------------------------------------------+
1 row in set (0.00 sec)
```

### 查看某个 table 的字符编码
```shell
mysql> show create table module_info;
+-------------+--------------------------------------------------------------------+
| Table       | Create Table                                                       |
+-------------+--------------------------------------------------------------------+
| module_info | CREATE TABLE `module_info` (
                  `module_id` int(32) NOT NULL AUTO_INCREMENT COMMENT '模块id',
                  `module_name` varchar(50) DEFAULT NULL COMMENT '模块名称',
                  `description` varchar(500) DEFAULT NULL COMMENT '模块描述',
                  PRIMARY KEY (`module_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='视频搜模块列表'       |
+-------------+--------------------------------------------------------------------+
1 row in set (0.00 sec)
```

### 查看 columns 的字符编码
```shell
mysql> show full columns from module_info;
+-------------+--------------+-------------------+------+-----+---------+----------------+---------------------------------+--------------+
| Field       | Type         | Collation         | Null | Key | Default | Extra          | Privileges                      | Comment      |
+-------------+--------------+-------------------+------+-----+---------+----------------+---------------------------------+--------------+
| module_id   | int(32)      | NULL              | NO   | PRI | NULL    | auto_increment | select,insert,update,references | 模块id       |
| module_name | varchar(50)  | latin1_swedish_ci | YES  |     | NULL    |                | select,insert,update,references | 模块名称     |
| description | varchar(500) | latin1_swedish_ci | YES  |     | NULL    |                | select,insert,update,references | 模块描述     |
+-------------+--------------+-------------------+------+-----+---------+----------------+---------------------------------+--------------+
3 rows in set (0.00 sec)
```

### 修改 database 默认的字符集
```shell
mysql> ALTER DATABASE video_search CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
Query OK, 1 row affected (0.01 sec)

mysql> show create database video_search;
+--------------+-----------------------------------------------------------------------------------------------------+
| Database     | Create Database                                                                                     |
+--------------+-----------------------------------------------------------------------------------------------------+
| video_search | CREATE DATABASE `video_search` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ |
+--------------+-----------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)
```

### 修改表
修改数据库默认字符集后，对于已经存在的表是不会生效的，还需要手动修改表的字符集

#### 只修改表的默认字符集
```shell
mysql> ALTER TABLE module_info DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
Query OK, 0 rows affected (0.06 sec)
Records: 0  Duplicates: 0  Warnings: 0

mysql> show create table module_info;
+-------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table       | Create Table                                                                                                                                                                                                                                                                                                                                                                                               |
+-------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| module_info | CREATE TABLE `module_info` (
                  `module_id` int(32) NOT NULL AUTO_INCREMENT COMMENT '模块id',
                  `module_name` varchar(50) CHARACTER SET latin1 DEFAULT NULL COMMENT '模块名称',
                  `description` varchar(500) CHARACTER SET latin1 DEFAULT NULL COMMENT '模块描述',
                  PRIMARY KEY (`module_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频搜模块列表'                  |
+-------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)
```

#### 修改表默认的字符集和所有字符列的字符集
```shell
mysql> ALTER TABLE module_info CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
Query OK, 0 rows affected (0.11 sec)
Records: 0  Duplicates: 0  Warnings: 0
```

### 修改指定 column 的字符集
```shell
mysql> ALTER TABLE table_name CHANGE column_name column_name VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```