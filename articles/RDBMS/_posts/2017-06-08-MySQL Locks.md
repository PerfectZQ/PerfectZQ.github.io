---
layout: post
title: MySQL Locks
tag: RDBMS
---

## 参考
* [史上最全的 select 加锁分析](https://www.cnblogs.com/rjzheng/p/9950951.html)

## 事务
```shell
# 查看事务隔离级别
mysql> show variables like '%tx_isolation%';
+---------------+-----------------+
| Variable_name | Value           |
+---------------+-----------------+
| tx_isolation  | REPEATABLE-READ |
+---------------+-----------------+
```

## 查看锁信息
```shell
# 查看 InnoDB 的锁信息
mysql> show engine innodb status;

# 此表用于替换 MySQL 5.7 中已废弃的 `information_schema.innodb_lock_waits` 表，同 MySQL 5.7 中的 `information_schema.innodb_lock_waits` 表一样，有 block 发生，此表才有数据。
mysql> select * from performance_schema.data_lock_waits;

# 此表用于替换 MySQL 5.7 中已废弃的 `information_schema.innodb_locks` 表，与 MySQL 5.7 中的 `information_schema.innodb_locks` 表不同，此表展示了当前所有的锁信息。
mysql> select * from performance_schema.data_locks;
```