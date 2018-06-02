---
layout: post
title: Mysql-Linux
tag: Mysql
---
## 卸载 MySQL

### 卸载 yum 安装的 MySQL
```shell
yum remove -y mysql*

# 验证卸载情况，如果存在继续删
rpm -qa | grep -i mysql

# 删除其他相关文件
rm -rf /var/lib/mysql
rm /etc/my.cnf
```

### 卸载 rpm 安装的 MySQL
```shell
rpm -qa | grep -i mysql
MySQL-test-5.5.54-1.el6.x86_64
MySQL-shared-5.5.54-1.el6.x86_64
MySQL-server-5.5.54-1.el6.x86_64
MySQL-client-5.5.54-1.el6.x86_64
MySQL-devel-5.5.54-1.el6.x86_64
MySQL-embedded-5.5.54-1.el6.x86_64
MySQL-shared-compat-5.5.54-1.el6.x86_64
rpm -e MySQL-test-5.5.54-1.el6.x86_64 MySQL-shared-5.5.54-1.el6.x86_64 MySQL-server-5.5.54-1.el6.x86_64 ...
# 删除服务
chkconfig --list | grep -i mysql
chkconfig --del mysql
# 删除相关文件
whereis mysql 或者 find / -name mysql
mysql: /usr/bin/mysql /usr/lib64/mysql /usr/include/mysql /usr/share/mysql
rm -rf /usr/lib/mysql
rm -rf /usr/lib64/mysql
rm -rf /usr/include/mysql
rm -rf /usr/share/mysql
rm -rf /usr/my.cnf
```

## 安装 MySQL

### rpm 包安装
　　建议安装 rpm 包，省时省力，只需要指定root密码，不需要额外配置什么东西就可以启动了。
```shell
rpm -ivh mysql-community-client-5.7.22-1.el7.x86_64.rpm \
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
wget http://dev.mysql.com/get/Downloads/MySQL-5.6/mysql-5.6.33-linux-glibc2.5-x86_64.tar.gz

tar -zxvf mysql-5.6.33-linux-glibc2.5-x86_64.tar.gz -C /usr/local/

cd /usr/local/

ln -s /usr/local/mysql-5.6.33-linux-glibc2.5-x86_64 mysql

cd mysql-5.6.33-linux-glibc2.5-x86_64

# deprecated in 5.7 
scripts/mysql_install_db --user=despacito
# 5.7
bin/mysqld --initialize --user=despacito (super user with random passwd in log) 
# 或者
bin/mysqld --initialize-insecure --user despacito (no passwd) 

# 将启动脚本 mysql.server 放到 /etc/init.d 目录下，这样就可以使用 service 命令了
cp support-files/mysql.server /etc/init.d/mysqld
chmod 755 /etc/init.d/mysqld

# mysql 配置文件
cp support-files/my-default.cnf /etc/my.cnf

# 修改启动脚本
vim /etc/init.d/mysqld

# mysql 安装目录
basedir=/usr/local/mysql/
# 数据存储目录
datadir=/usr/local/mysql/data/
```

## 启动/关闭 mysql 服务
```shell
# 查看命令
service mysql | service mysqld

# 支持下面的操作
{start|stop|restart|reload|force-reload|status}

# 例如启动服务，实际上执行的是 ./support-files/mysql.server start
service mysql start
```

## 创建用户与分配权限
```shell
# 查看 mysql 详细用法
bin/mysql --help 

# root用户登录 
# 使用 -h 指定远程Mysql服务器的 hostname，默认localhost
mysql -u root -p

# 第一次登录必须修改生成的初始密码
# === 方式1 ===
bin/mysqladmin -u root -p password 新密码
# === 方式2 ===
mysql> SET PASSWORD = PASSWORD('your new password');
mysql> ALTER USER 'root'@'localhost' PASSWORD EXPIRE NEVER;
mysql> flush privileges;

# 创建一个新数据库实例，在mysql shell中';'是必须的
mysql> create database testDB;

# 创建一个新用户test，并将testDB的所有权限赋给它。localhost指只有本机可以登录访问
mysql> grant all privileges on testDB.* to test@localhost identified by '1234';
# "%"表示除了本机之外的所有主机可以登录访问，要想本机和所有主机都可以就同时执行这两条命令
mysql> grant all privileges on testDB.* to test@"%" identified by '1234';

# 创建用户也可以直接操作系统用户表 mysql.user
mysql> insert into mysql.user(Host,User,Password) values("localhost","test",password("1234"));

# 赋予某些权限，和所有数据库
mysql> select,insert,update,delete,create,drop on *.* to test@localhost identified by '1234';

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

## 忘记MySQL用户名密码
```shell
# 首先关闭MySQL实例
bin/mysqld stop | service mysqld stop

# 安全模式启动MySQL
bin/mysqld_safe --skip-grant-tables &

# 进入MySQL Command Line
bin/mysql

# 进来之后，就可以修改密码了
mysql> SET PASSWORD FOR 'roor'@'localhost' = PASSWORD('newpass');
mysql> flush privileges;
```

## 数据导出/导入

### 数据导出
```shell
# 查看基本使用方法
mysqldump

# 查看详细的使用方法
mysqldump --help 

# 导出表
mysqldump -uroot -p dbname table1 table2 > /root/data.sql

# 导出指定数据库
mysqldump -uroot -p --databases dbname1 dbname2 dbname3 > /root/data.sql

# 导出所有数据库
mysqldump -uroot -p --all-databases > /root/all_databases_data.sql
```
### 数据导入
```shell
mysql -uroot -p

mysql> source /root/all_databases_data.sql
```

如果有多个 sql 文件需要导入数据库，可以新建一个文件`all.sql`
```shell
vim all.sql
# 添加下面的内容
source /root/data1.sql
source /root/data2.sql

# 然后去 mysql 控制台执行
mysql> source /root/all.sql
```
