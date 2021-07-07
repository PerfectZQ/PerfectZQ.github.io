---
layout: post
title: Java GC Log
tag: Java
---

## GC Log Options
* `-XX:+PrintGC`，别名`-verbose:gc`：输出简要 GC 日志
* `-XX:+PrintGCDetails`：输出 GC 的详细日志
* `-XX:+PrintGCTimeStamps`：输出 GC 的时间戳（以基准时间的形式）
* `-XX:+PrintGCDateStamps`：输出 GC 的时间戳（以日期的形式，如 2013-05-04T21:53:59.234+0800）
* `-XX:+PrintHeapAtGC`：在进行 GC 的前后打印出堆的信息
* `-XX:+PrintReferenceGC`：
* `-XX:+PrintAdaptiveSizePolicy`：
* `-Xloggc:./logs/gc/log`：指定 GC 日志文件的输出路径，默认控制台输出


## Reference
* [JVM 关于 GC 的日志分析](https://www.cnblogs.com/yanl55555/p/13366984.html)