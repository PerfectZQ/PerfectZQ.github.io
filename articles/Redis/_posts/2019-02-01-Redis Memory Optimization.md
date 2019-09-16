---
layout: post
title: Redis Memory Optimization
tag: Redis
---

## 参考
* Redis 开发与运维 - 付磊、张益军

## RedisObject
Redis 中的所有值对象在 Redis 内部定义为`RedisObject`，理解`RedisObject`对内存优化很有帮助，一个`RedisObject`包含下面几个属性:

* **type**: 对象所属类型，`string`、`list`、`hash`、`set`、`zset`，占4位。 使用`type {key}`查看对象所属类型，`type`命令返回的都是值对象的类型，键都是`string`类型的。
* **encoding**: 对象所属类型的内部编码，占4位。这一块对内存的优化非常重要，下面单独说一下
* **lru**: LRU 时钟计数器。记录了对象最后一次被访问的时间。当配置了`maxmemory`和`maxmemory-policy=volatile-lru`或者`allkeys-lru`时，该字段用于辅助键的删除。当使用`object idletime {key}`查看指定键的空闲时间时，不会更新该对象的`lru`值。
* **ref count**: 引用计数器
* **data pointer**: 数据指针

```shell
redis01:6379[15]> debug object test
Value at:0x7f772a65ab30 refcount:1 encoding:hashtable serializedlength:10 lru:10004393 lru_seconds_idle:1915
```

## 数据结构的内部编码
redis 常用的五种数据结构，每种数据结构其实都有多种内部实现，我们称他为内部编码，举个例子

```shell
# 查看 redis set 的内部编码
$ obejct encoding "set1" 
```