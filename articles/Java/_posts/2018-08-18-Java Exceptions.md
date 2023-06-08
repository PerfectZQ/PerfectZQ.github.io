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

直译过来就是，超出垃圾收集的开销上限。`OutOfMemoryError`是`java.lang.VirtualMachineError`的子类，当 JVM
花费太多时间执行垃圾收集并且只能回收非常少的堆空间时，就会发生错误，说明 JVM 内存耗尽了，

根据 Java 文档，默认情况下，如果 Java 进程花费超过`98％`的时间用于GC，并且每次运行中只有不到`2％`的堆被恢复，则 JVM
被配置为抛出此错误。换句话说，这意味着我们的应用程序几乎耗尽了所有可用内存，并且垃圾收集器花费了太多时间来尝试清理它并反复失败(
没有可以被清理的对象)。

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

### Connection reset by peer

* [When is "java.io.IOException:Connection reset by peer" thrown?](https://stackoverflow.com/questions/8658118/when-is-java-io-ioexceptionconnection-reset-by-peer-thrown)

> `Connection reset by peer` is typically a result of your peer sending a TCP `RST` to you.

* [TCP RST 产生的几种情况](https://zhuanlan.zhihu.com/p/30791159)

在 TCP 协议中，`RST`(Reset)段标识复位，用来异常的关闭连接。在 TCP 的设计中它是不可或缺的，发送`RST`
段关闭连接时，不必等缓冲区的数据都发送出去，直接丢弃缓冲区中的数据。而接收端收到`RST`段后，也不必发送`ACK`来确认。

TCP 是全双工的数据通信，也就是说任意一端的连接都可以主动的向对端发送数据。`peer`翻译过来是对端、对等连接的意思，如果一端的
Socket 被关闭（主动关闭，或因为异常退出而引起的关闭），但另一端并不知道，仍向一个已经关闭的 Socket 发送数据，发送的第一个数据包引发该异常。

常见原因：

* 比如 Socket 默认空闲超时时间为 60s，即当超过 60s 没有数据读写操作就会自动关闭连接。
* 客户端关掉了浏览器（或者按了 Stop），而服务器还在给客户端发送数据
* 服务器的并发连接数超过了其承载量，服务器会将其中一些连接关闭

### Connection reset

* [Socket java.net.SocketException: Connection reset](https://blog.csdn.net/xc_zhou/article/details/80950753)

一端退出，但退出时并未关闭该连接，另一端如果在从连接中读数据则抛出该异常。简单的说就是在连接断开后的读和写操作引起的

### Connection refused: connect

### Socket is closed

### Broken pipe

* [从tcp原理角度理解Broken pipe和Connection Reset by Peer的区别](http://lovestblog.cn/blog/2014/05/20/tcp-broken-pipe/)

## 502 Bad Gateway

要么是网关代理服务器太忙了，要么就是挂了，要么就是在重启，要么你请求到了错误的网关地址(DNS 配置一个错误的地址)，总之它现在不可用

## 504 Gateway Time-out

504 错误代表网关超时(Gateway timeout)，是指服务器作为网关或代理将请求转发到下游服务器后没有在规定时间内返回响应。nginx
做反向代理，默认请求是有一个 60 秒的超时，如果 http 请求超过了60秒还没有返回响应，连接就会被 Nginx 中断，客户端就会得到 504
的错误：gateway time-out。

客户端异常信息

```console
scalaj.http.HttpStatusException: 504 Error: HTTP/1.1 504 Gateway Time-out
	at scalaj.http.HttpResponse.throwIf(Http.scala:156) ~[hdfs-download-client-1.1.jar:?]
	at scalaj.http.HttpResponse.throwError(Http.scala:168) ~[hdfs-download-client-1.1.jar:?]
	at com.sensetime.hdfs.request.TaskService.parseResponse(TaskService.scala:281) ~[hdfs-download-client-1.1.jar:?]
	at com.sensetime.hdfs.request.TaskService$$anonfun$1.apply(TaskService.scala:70) ~[hdfs-download-client-1.1.jar:?]
	at com.sensetime.hdfs.request.TaskService$$anonfun$1.apply(TaskService.scala:70) ~[hdfs-download-client-1.1.jar:?]
	at com.sensetime.hdfs.tools.Retry$.recursiveAction$1(Retry.scala:25) [hdfs-download-client-1.1.jar:?]
	at com.sensetime.hdfs.tools.Retry$.retry(Retry.scala:36) [hdfs-download-client-1.1.jar:?]
	at com.sensetime.hdfs.request.TaskService.createTask(TaskService.scala:69) [hdfs-download-client-1.1.jar:?]
	at com.sensetime.hdfs.client.DownloadV2$.process(DownloadV2.scala:67) [hdfs-download-client-1.1.jar:?]
	at com.sensetime.hdfs.client.DownloadV2$.main(DownloadV2.scala:31) [hdfs-download-client-1.1.jar:?]
	at com.sensetime.hdfs.client.DownloadV2.main(DownloadV2.scala) [hdfs-download-client-1.1.jar:?]
```

客户端请求

```scala
/**
   * Create a new download task, and return the taskId
   *
   * @param token
   * @param taskName
   * @param username
   * @param downloadIp
   * @param itemList
   * @return
   */
  def createTask(taskName: String, username: String, downloadIp: String, itemList: List[Item])
                (implicit token: String): String = {

    val req = Http(s"$httpAddress/download_task/createDownloadTask")
      .header("Authorization", token)
      .header("Content-Type", "application/json")
      .header("Charset", "UTF-8")
      .cookie("login_opencloud_id", username)
      .option(HttpOptions.connTimeout(connTimeout))
      // 这里定义了客户端读取超时时间，504 是 Nginx 网关中断的连接，需要修改 Nginx 网关的超时时间
      .option(HttpOptions.readTimeout(readTimeout))
      .postData(
        s"""
           |{
           |  "taskName": "$taskName",
           |  "username": "$username",
           |  "downloadIp": "$downloadIp",
           |  "items": ${new GsonBuilder().create().toJson(itemList.asJava)}
           |}
           |""".stripMargin)
    val resp = Retry.retry(maxRetry) {
      parseResponse(req.asString)
    }
    val taskId = resp.body
    logger.info(s"createTask: TaskId = ${resp.body}")
    taskId

  }
```

修改 Nginx 网关 read Timeout

```shell
location ~ /arch-long {
    proxy_pass  http://127.0.0.1:8080;
    # 设置代理读取超时时间为 3600s，即一个小时
    proxy_read_timeout  3600;
}
```

## Nginx 代理网关常用配置

[Nginx Http Proxy Module Configurations](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_read_timeout)

![有帮助的截图]({{ site.url }}/assets/nginx/nginx_http.jpg)

![nginx_http.jpg](..%2F..%2F..%2Fassets%2Fnginx%2Fnginx_http.jpg)

* `proxy_send_timeout 300`: 设置 Nginx 发送给请求 Upstream Proxied Server 的超时时间
  > Sets a timeout for transmitting a request to the proxied server. The timeout is set only between two successive
  write operations, not for the transmission of the whole request. If the proxied server does not receive anything
  within this time, the connection is closed.
* `proxy_read_timeout 300`: 设置 Nginx 代理服务器的读取超时时间，代表 Nginx 会等待多长时间来获取请求的响应
  > Defines a timeout for reading a response from the proxied server. The timeout is set only between two successive
  read operations, not for the transmission of the whole response. If the proxied server does not transmit anything
  within this time, the connection is closed.
