---
layout: post
title: PostgresSQL
tag: RDBMS
---

## cli commands
```shell
# 以当前 Linux 用户名登录数据库，如果是第一次登录一般会让设置密码
$ psql
# 以管理员用户 `postgres` 登录 cli
$ PGPASSWORD=postgresadmin2020 psql -U postgres
# 创建数据库用户 dbuser，并设置密码。
> CREATE USER dbuser WITH PASSWORD 'password';
# 创建数据库，并指定 owner
> CREATE DATABASE exampledb OWNER dbuser;
# 将 exampledb 数据库的所有权限都赋予 dbuser，否则 dbuser 只能登录控制台，没有任何数据库操作权限。
> GRANT ALL PRIVILEGES ON DATABASE exampledb to dbuser;
# 退出 cli，或者 ctrl + d
> \q
# 用指定用户登录数据库
$ psql -U dbuser -d exampledb -h 127.0.0.1 -p 5432
```