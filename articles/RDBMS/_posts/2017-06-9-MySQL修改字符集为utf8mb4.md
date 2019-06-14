---
layout: post
title: MySQL修改字符集为utf8mb4
tag: RDBMS
---

## 前言
`utf8mb4`是`MySQL 5.5.3+`支持的字符集

## 查看当前字符集设置

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

## 修改字符集
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