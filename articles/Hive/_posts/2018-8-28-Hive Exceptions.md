---
layout: post
title: Hive Exceptions
tag: Hive
---
## HDFS 对应分区目录下有数据文件，但是 Hive 查不到数据
Hive 查询数据会先查找 metastore，然后根据 metadata 去读取 warehouse 中的数据文件，如果直接将数据文件放到对应 hdfs 目录下，而没有更新 metadata 的话就会出现这种问题。

```shell
# 查看 Hive metastore，是否对应的分区信息
mysql -u hive -p
mysql> select * from hive.PARTITIONS;
+---------+-------------+------------------+---------------+-------+--------+
| PART_ID | CREATE_TIME | LAST_ACCESS_TIME | PART_NAME     | SD_ID | TBL_ID |
+---------+-------------+------------------+---------------+-------+--------+
|       1 |  1535366828 |                0 | dt=2018-08-23 |    37 |     34 |
|       2 |  1535367038 |                0 | dt=2018-08-24 |    40 |     38 |
|       3 |  1535369094 |                0 | dt=2018-08-25 |    42 |     34 |
|       4 |  1535369137 |                0 | dt=2018-08-26 |    45 |     41 |
+---------+-------------+------------------+---------------+-------+--------+

# 如果没有对应的表分区信息，可以通过下面的方法解决

# 方法1：metastore check，它会将检测到的分区信息写入 metastore
hive> MSCK REPAIR TABLE tablename;

# 方法2：
hive> ALTER TABLE hive_tablename ADD PARTITION(dt='2018-08-27');
```
## Map Join OOM
```console
Starting to launch local task to process map join; maximum memory = xxx
```
### 参考连接
* [HIVE Map Join 异常问题处理总结](https://yq.aliyun.com/articles/64306)
* [StackOverflow](https://stackoverflow.com/questions/22977790/hive-query-execution-error-return-code-3-from-mapredlocaltask)
* [Hive Map Join 原理](http://itindex.net/detail/55106-hive-join-%E5%8E%9F%E7%90%86)

### 解决建议
* `set hive.auto.convert.join=false;`，关闭 map join
* 调小`hive.smalltable.filesize`，默认是25000000（在2.0.0版本中）
* `hive.mapjoin.localtask.max.memory.usage`，调大到`0.999`
* `set hive.ignore.mapjoin.hint=false;`，关闭忽略 map join 的 hints
* 调大 MapredLocalTask 的JVM启动参数: `export HADOOP_HEAPSIZE=2000`或者`vim /usr/lib/hadoop-current/libexec/hadoop-config.sh`，设置`JAVA_HEAP_MAX=-Xmx2000m`