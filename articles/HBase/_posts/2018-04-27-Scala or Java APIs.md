---
layout: post
title: Scala or Java APIs
tag: HBase
---

## 导入依赖
### Maven
```xml
<dependency>
   <groupId>org.apache.hbase</groupId>
   <artifactId>hbase-client</artifactId>
   <version>1.3.1</version>
</dependency>
```
### SBT
```sbtshell
libraryDependencies += "org.apache.hbase" % "hbase-client" % "1.3.1"
```
## 基本 API
这里是Scala写法，Java写法，自行领悟，-_-。

```scala
package com.zq.hbase.learn

import org.apache.hadoop.hbase.{HBaseConfiguration, HColumnDescriptor, HTableDescriptor, TableName}
import org.apache.hadoop.hbase.client._
import org.apache.hadoop.hbase.util.Bytes

object HBaseUtil {
  def main(args: Array[String]): Unit = {
    
    // 创建 HBase 配置文件对象
    val conf = HBaseConfiguration.create()
    // 指定 zookeeper 节点地址，在 hbase-site.xml 有配置
    conf.set("hbase.zookeeper.quorum", "server202,server203,server204")
    // 指定 zookeeper 端口号
    conf.set("hbase.zookeeper.property.clientPort", "2181")
    /**
     * HDP's HBase 需要额外指定 zookeeper.znode.parent
     * Cloudera's HBase 不需要
     * 因为我用的 Cloudera，所以在这里注释掉了 ^_^
     */
    // conf.set("zookeeper.znode.parent", "/hbase-unsecure")
    
    // 根据配置文件创建连接
    val connection: Connection = ConnectionFactory.createConnection(conf)
    
    /**
      * 通过连接获取管理对象
      * Note:
      * 1、这是一个轻量级的操作，不会保证返回的Admin对象是线程安全的
      * 在多线程的情况下，应该为每个线程创建一个新实例。
      * 2、不建议把返回的 Admin 对象池化或缓存
      * 3、记得调用 admin.close()
      */
    val admin: Admin = connection.getAdmin

    // 如果表存在，删了重建
    if (admin.tableExists(TableName.valueOf("test_table"))) {
      admin.disableTable(TableName.valueOf("test_table"))
      admin.deleteTable(TableName.valueOf("test_table"))
    }
    // 建表
    val tableDescriptor: HTableDescriptor = new HTableDescriptor(TableName.valueOf("test_table"))
    val columnDescriptor: HColumnDescriptor = new HColumnDescriptor("column_family".getBytes())
    tableDescriptor.addFamily(columnDescriptor)
    admin.createTable(tableDescriptor)


    // 返回 HBase table ist
    val tables: Array[HTableDescriptor] = admin.listTables()
    tables.foreach(println)


    // let's insert some data in 'mytable' and get the row
    val table: Table = connection.getTable(TableName.valueOf("test_table"))

    // rowkey
    val put: Put = new Put(Bytes.toBytes("2018/4/27-rowkey"))
    // column family, column qualifier, value
    put.addColumn(Bytes.toBytes("column_family"), Bytes.toBytes("column_qualifier"), Bytes.toBytes("value"))
    // add to HBase table
    table.put(put)

    // rowkey
    val get: Get = new Get(Bytes.toBytes("2018/4/27-rowkey"))
    val result: Result = table.get(get)
    val value: Array[Byte] = result.value()
    println(Bytes.toString(value))
  }

}
```