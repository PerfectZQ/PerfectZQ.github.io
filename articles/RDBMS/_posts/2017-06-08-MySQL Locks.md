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