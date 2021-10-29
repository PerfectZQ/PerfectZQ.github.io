---
layout: post
title: Hive 集群间数据迁移
tag: Hive
---

## 使用 hadoop distcp
hive 元数据和真实的数据是完全分离的，因此迁移分为两个部分:
* **元数据迁移**: 把所有 Hive 表的建表语句写入`/tmp/schema.sql`(当然你也可以 dump mysql 元数据，这样你就不用把建表语句 copy 出来了)
* **真实数据迁移**: Hive 数据通过`hadoop distcp`在不同 hdfs copy 真实数据
```shell
# 语法
hadoop distcp [options] source destination
# 查看帮助
$ hadoop distcp
```

### 按表迁移
[通过hadoop distcp进行集群间数据迁移](https://www.jianshu.com/p/c642fc4dc25b)

如果表太多，嫌慢的话可以直接参考下小节<全库迁移>

```shell
$ vim hive-cluster-transport.sh
#!/bin/sh

# Note: 需要在 ${source_host} 节点上执行该脚本，否则获取不到 hive 表信息

# 内网生产 NameNode hadoop1:8020
source_host="192.168.50.229"
source_NameNode="$source_host:8020"
# 内网测试 NameNode hadoop3:8020
destination_host="192.168.51.23"
destination_NameNode="$destination_host:8020"

# 打印
function log() {
    current=`date +'%Y-%m-%d %T'`
    message=$1
    echo "$current: ==== $message"
}

echo "" >/tmp/schema.sql
dbs=$(hive -e "show databases;")

for db in $dbs
do
    log "开始迁移 db=$db"
    # 跳过 default
    if [ $db == "default" ]; then
        echo "skip default"
        continue
    fi
    db_tables=$(hive -e "use ${db};show tables;" | grep -v _es | grep -v _hb | grep -v importinfo)
    echo "create database if not exsits $db" >> /tmp/schema.sql
    echo -e ';\c' >> /tmp/schema.sql
    for table in $db_tables
    do
        src_path=hdfs://$source_NameNode/apps/hive/warehouse/${db}.db/$table/
        dest_path=hdfs://$destination_NameNode/apps/hive/warehouse/${db}.db/$table/
        # 获取 hive 表 schema
        log "获取 $db.$table schema to /tmp/schema.sql"
        hive -e "show create table $db.$table" >> /tmp/schema.sql
        echo -e ';\c' >> /tmp/schema.sql
        # 迁移 hive 表 data
        log "迁移 table=$db.$table 数据"
        # -update 会检查文件夹名称和文件数量，进行增量更新
        # -skipcrccheck 跳过检查 source blocksize 和 target blocksize 是否一样
        hadoop distcp -update -skipcrccheck $src_path $dest_path
        # 执行修复命令
        echo "MSCK REPAIR TABLE ${db}.${table};\c" >> /tmp/schema.sql
    done
done

# 在 destination 节点执行 schema.sql
$ hive -f schema.sql
```

### 全库迁移
[hadoop跨集群之间迁移hive数据](https://blog.csdn.net/levy_cui/article/details/70156682)

#### benchmark
750g 80m

#### 元数据迁移
```shell
# 源 hive mysql 
$ mysqldump -uroot -p"Password" --databases hive >/root/hive.sql

# 目标 hive mysql 
$ mysql -uroot -p"Password"
# 备份元数据
$ mysqldump -uroot -p"Password" --databases hive >/root/hive_bak.sql
# 将源 hive 元数据导入目标 hive mysql
mysql> source /root/hive.sql 
# 如果两个集群的 NameNode host 不同，需要修改 NameNode 地址
mysql> update DBS set DB_LOCATION_URI = replace(DB_LOCATION_URI,'hdfs://hadoop1','hdfs://hadoop3');
mysql> update SDS set LOCATION = replace(LOCATION ,'hdfs://hadoop1','hdfs://hadoop3');
```

#### hdfs 数据迁移
```shell
$ nohup hadoop distcp -update -skipcrccheck hdfs://192.168.50.229:8020/apps/hive/warehouse \
hdfs://192.168.51.23:8020/apps/hive/warehouse >hive-transport.log 2>&1 &
```