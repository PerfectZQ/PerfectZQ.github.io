---
layout: post
title: Java Exceptions
tag: Java
---

## Common Exceptions
[Common Java Exceptions](https://www.baeldung.com/java-common-exceptions)

## JVM Exceptions
### OutOfMemoryError: GC Overhead Limit Exceeded
[GC Overhead Limit Exceeded](https://www.baeldung.com/java-gc-overhead-limit-exceeded)

直译过来就是，超出垃圾收集的开销上限。`OutOfMemoryError`是`java.lang.VirtualMachineError`的子类，当 JVM 花费太多时间执行垃圾收集并且只能回收非常少的堆空间时，就会发生错误，说明 JVM 内存耗尽了，
                                   
根据 Java 文档，默认情况下，如果 Java 进程花费超过`98％`的时间用于GC，并且每次运行中只有不到`2％`的堆被恢复，则 JVM 被配置为抛出此错误。换句话说，这意味着我们的应用程序几乎耗尽了所有可用内存，并且垃圾收集器花费了太多时间来尝试清理它并反复失败(没有可以被清理的对象)。

在遇到`GC Overhead Limit Exceeded`之前，我们也可能会遇到`heap space error`


### StackOverflowError
[Stack Overflow Error](https://www.baeldung.com/java-stack-overflow-error)

## java.io.IOException
### Too many open files
[java.io.IOException: Too many open files](https://www.cnblogs.com/kongzhongqijing/articles/3735664.html)

```shell
# 查看每个用户允许打开的最大文件数
$ ulimit -n

# 修改最大文件数
$ vim /etc/security/limits.conf
# 其中 * 代表 Linux 所有用户生效
* soft nofile 65536
* hard nofile 131072
* soft nproc 4096
* hard nproc 4096

# 该配置需要关闭 shell 才可以生效，因此一定要记得退出当前用户重新登陆，否则不生效！
```

## java.net.SocketException
### Connect reset by peer
如果一端的 Socket 被关闭(或主动关闭，或因为异常退出而引起的关闭)，另一端仍发送数据，发送的第一个数据包引发该异常。

常见原因
* 比如 Socket 默认空闲超时时间为 60s，即当超过 60s 没有数据读写操作就会自动关闭连接。
* 客户关掉了浏览器(或者按了 stop)，而服务器还在给客户端发送数据
* 服务器的并发连接数超过了其承载量，服务器会将其中一些连接关闭

### Connection reset
[Socket java.net.SocketException: Connection reset](https://blog.csdn.net/xc_zhou/article/details/80950753)
一端退出，但退出时并未关闭该连接，另一端如果在从连接中读数据则抛出该异常。简单的说就是在连接断开后的读和写操作引起的

### Connection refused: connect

### Socket is closed

### Broken pipe
[从tcp原理角度理解Broken pipe和Connection Reset by Peer的区别](http://lovestblog.cn/blog/2014/05/20/tcp-broken-pipe/)