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

# 列出数据库名 SELECT datname FROM pg_database;
> \l
# 切换数据库相当于 use dbname
> \c exampledb
# 列出表名 SELECT tablename FROM pg_tables WHERE tablename NOT LIKE 'pg%' AND tablename NOT LIKE 'sql_%' ORDER BY tablename;
> \dt

# 删除数据库 https://www.postgresqltutorial.com/postgresql-drop-database/
> DROP DATABASE exampledb;
# Drop a database that has active connections:
# First, find the activities associated with the database by querying the pg_stat_activity view:
> SELECT * FROM pg_stat_activity WHERE datname = '<database_name>';
# Second, terminate the active connections by issuing the following query:
> SELECT pg_terminate_backend (pid) FROM pg_stat_activity WHERE	pg_stat_activity.datname = '<database_name>';
> DROP DATABASE <database_name>;

# 删除用户
> DROP USER dbuser;
# 修改用户密码
> ALTER USRE dbuser PASSWORD '123456';

# 退出 cli，或者 ctrl + d
> \q

# 用指定用户登录数据库
$ psql -U dbuser -d exampledb -h 127.0.0.1 -p 5432
```