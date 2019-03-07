---
layout: post
title: Redis 事务与 Pipeline
tag: Redis
---

## 原生事务
```scala
val redis = Redis.getRedisClient()
// 开启事务
redis.multi()
redis.set("1", "1")
redis.set("2", "2")
// 执行事务
redis.exec()
```

## Pipeline 
```scala
val redis = Redis.getRedisClient()
val pipeline = redis.pipelined()
pipeline.set("1", "1")
pipeline.set("2", "2")
// flush & 同步获取 pipeline 中的所有 response & close pipeline
pipeline.sync()
```

## Pipeline 事务
```scala
val redis = Redis.getRedisClient()
val pipeline = redis.pipelined()
// 开启事务
pipeline.multi()
pipeline.set("1", "1")
pipeline.set("2", "2")
// 执行事务
val response = pipeline.exec()
// flush & 同步获取 pipeline 中的所有 response & close pipeline
pipeline.sync()
// 执行 sync 之后才能正确获取 response.get
println(response.get)
```

