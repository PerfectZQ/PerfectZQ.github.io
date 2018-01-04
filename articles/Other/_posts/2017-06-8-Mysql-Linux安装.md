---
layout: post
title: Mysql-Linux安装与卸载
tag: Mysql
---
## 卸载mysql
### 卸载 yum 安装的 mysql
```shell
yum remove -y mysql*
# 查看
rpm -qa | grep -i mysql
# 如果存在继续删
# 删除相关文件
rm -rf /var/lib/mysql
rm /etc/my.cnf
```
### 卸载 rpm安装的 mysql
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
## 安装 mysql
### rpm包安装
建议安装 rpm 包，省时省力，只需要指定root密码，不需要额外配置什么东西就可以启动了。
### 压缩包安装方式
```shell
wget http://dev.mysql.com/get/Downloads/MySQL-5.6/mysql-5.6.33-linux-glibc2.5-x86_64.tar.gz
tar -zxvf mysql-5.6.33-linux-glibc2.5-x86_64.tar.gz -C /usr/local/
cd /usr/local/
mv mysql-5.6.33-linux-glibc2.5-x86_64 mysql
cd mysql
# deprecated in 5.7 
bin/mysql_install_db
# 新版本用 bin/mysqld --initialize (super user with random passwd in log) 
# 或者 bin/mysqld --initialize-insecure (no passwd) 
# mysql 启动脚本，这样就可以使用 service 命令了
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
## 启动 mysql
```shell
# 查看命令
service mysql | service mysqld
# 启动
service mysql start
#测试连接
./mysql/bin/mysql -uroot
#加入环境变量，编辑 /etc/profile，这样可以在任何地方用mysql命令了
export PATH=$PATH:/usr/local/mysql/bin
source /etc/profile
```

## 创建用户与分配权限
```shell
# root用户登录 -h 指定 hostname，默认localhost
mysql -u root -p
# 创建一个新数据库实例，在mysql shell中';'是必须的
mysql> create database testDB;
# 创建一个新用户test，并将testDB的所有权限赋给它。localhost指只有本机可以登录访问
mysql> grant all privileges on testDB.* to test@localhost identified by '1234';
# "%"表示除了本机之外的所有主机可以登录访问，要想本机和所有主机都可以就同时执行这两条命令
mysql> grant all privileges on testDB.* to test@"%" identified by '1234';
# 赋予某些权限，和所有数据库
mysql> select,insert,update,delete,create,drop on *.* to test@localhost identified by '1234';
# 刷新系统权限表
mysql> flush privileges; 
# 创建用户也可以直接操作系统表
mysql> insert into mysql.user(Host,User,Password) values("localhost","test",password("1234"));
```

## 其他命令
```shell
# 删除用户
mysql> Delete FROM mysql.user Where User='test' and Host='localhost';
# 修改用户密码
mysql> update mysql.user set password=password('新密码') where User="test" and Host="localhost";
mysql> flush privileges;
# 列出所有数据库
mysql> show database;
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