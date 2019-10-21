---
layout: post
title: HBase Exception
tag: HBase
---
## java.lang.NoClassDefFoundError: com/yammer/metrics/core/Gauge
```console
18/05/03 16:44:41 INFO RpcRetryingCaller: Call exception, tries=11, retries=31, started=48412 ms ago, cancelled=false, 
msg=com.google.protobuf.ServiceException: java.lang.NoClassDefFoundError: com/yammer/metrics/core/Gauge 
row 'hsyk_his_custom_info_test,0000396317-238952,99999999999999' on table 'hbase:meta' 
at region=hbase:meta,,1.1588230740, hostname=server203,60020,1524121903630, seqNum=0
```

异常原因：Spark 集群缺少`metrics-core-2.2.0.jar`

hbase 相关依赖清单：
```shell
hamcrest-core-1.3.jar/
hbase-annotations-1.3.1.jar/
hbase-client-1.3.1.jar/
hbase-common-1.3.1-tests.jar/
hbase-common-1.3.1.jar/
hbase-hadoop-compat-1.3.1.jar/
hbase-hadoop2-compat-1.3.1.jar/
hbase-prefix-tree-1.3.1.jar/
hbase-procedure-1.3.1.jar/
hbase-protocol-1.3.1.jar/
hbase-server-1.3.1.jar/
htrace-core-3.1.0-incubating.jar/
metrics-core-2.2.0.jar/
metrics-core-3.1.5.jar/
metrics-graphite-3.1.5.jar/
metrics-json-3.1.5.jar/
metrics-jvm-3.1.5.jar/
```

## regionserver.HRegionServer: error telling master we are up
hbase 在写入数据的时候可以连接上 zookeeper，但是写数据莫名奇妙的超时，查看 HRegionServer的日志`less /var/log/hbase/hbase-hbase-regionserver-ambari2.log`，发现有如下异常：
```console
2018-09-04 14:11:54,698 WARN  [regionserver/ambari2/192.168.178.1:16020] regionserver.HRegionServer: reportForDuty failed; sleeping and then retrying.
2018-09-04 14:11:57,699 INFO  [regionserver/ambari2/192.168.178.1:16020] regionserver.HRegionServer: reportForDuty to master=ambari3,16000,1536036665688 with port=16020, startcode=1536036671111
2018-09-04 14:11:57,699 WARN  [regionserver/ambari2/192.168.178.1:16020] regionserver.HRegionServer: error telling master we are up
com.google.protobuf.ServiceException: java.net.ConnectException: Connection refused
        at org.apache.hadoop.hbase.ipc.AbstractRpcClient.callBlockingMethod(AbstractRpcClient.java:228)
        at org.apache.hadoop.hbase.ipc.AbstractRpcClient$BlockingRpcChannelImplementation.callBlockingMethod(AbstractRpcClient.java:292)
        at org.apache.hadoop.hbase.protobuf.generated.RegionServerStatusProtos$RegionServerStatusService$BlockingStub.regionServerStartup(RegionServerStatusP
rotos.java:10859)
        at org.apache.hadoop.hbase.regionserver.HRegionServer.reportForDuty(HRegionServer.java:2468)
        at org.apache.hadoop.hbase.regionserver.HRegionServer.run(HRegionServer.java:957)
        at java.lang.Thread.run(Thread.java:745)
Caused by: java.net.ConnectException: Connection refused
        at sun.nio.ch.SocketChannelImpl.checkConnect(Native Method)
        at sun.nio.ch.SocketChannelImpl.finishConnect(SocketChannelImpl.java:717)
        at org.apache.hadoop.net.SocketIOWithTimeout.connect(SocketIOWithTimeout.java:206)
        at org.apache.hadoop.net.NetUtils.connect(NetUtils.java:531)
        at org.apache.hadoop.net.NetUtils.connect(NetUtils.java:495)
        at org.apache.hadoop.hbase.ipc.RpcClientImpl$Connection.setupConnection(RpcClientImpl.java:410)
        at org.apache.hadoop.hbase.ipc.RpcClientImpl$Connection.setupIOstreams(RpcClientImpl.java:716)
        at org.apache.hadoop.hbase.ipc.RpcClientImpl$Connection.writeRequest(RpcClientImpl.java:889)
        at org.apache.hadoop.hbase.ipc.RpcClientImpl$Connection.tracedWriteRequest(RpcClientImpl.java:856)
        at org.apache.hadoop.hbase.ipc.RpcClientImpl.call(RpcClientImpl.java:1201)
        at org.apache.hadoop.hbase.ipc.AbstractRpcClient.callBlockingMethod(AbstractRpcClient.java:218)
        ... 5 more
```

异常说当他告诉 master 它已经准备好的时候出问题了，那么什么问题呢？检查`/etc/hosts`文件内容，发现是这么写的
```shell
::1             localhost ip6-localhost ip6-loopback
192.168.178.2   ambari3
192.168.178.1   ambari2
192.168.177.232 ambari1
192.168.177.201 db-es1-node0
192.168.177.227 db-es1-node1
127.0.0.1       localhost
```

发现`127.0.0.1    localhost`在最后一行，改成下面的写法，然后重启集群就好了
```shell
127.0.0.1       localhost
::1             localhost ip6-localhost ip6-loopback
192.168.178.2   ambari3
192.168.178.1   ambari2
192.168.177.232 ambari1
192.168.177.201 db-es1-node0
192.168.177.227 db-es1-node1
```

参考连接[https://stackoverflow.com/questions/23049777/hbase-regionserver-error-telling-master-we-are-up](https://stackoverflow.com/questions/23049777/hbase-regionserver-error-telling-master-we-are-up)

### 127.0.0.1、::1、localhost、0.0.0.0 的区别

另外`127.0.0.1/8`整个都是环回地址，用来测试本机的 TCP/IP 协议栈，发往这段A类地址数据包不会出网卡，网络设备不会对其做路由，也就是根本不需要联网。它一般会与 loopback 接口绑定。

`::1`是ipv6的本机IP，对应ipv4的`127.0.0.1`

对于本机IP，拿笔记本为例，本机有3块网卡，一块网卡叫做 loopback（这是一块虚拟网卡），另外一块网卡叫做 ethernet （这是有线网卡），另外一块网卡叫做 wlan（这是无线网卡）。本机 IP 就是真实网卡的 IP，具体来说有线无线各有一个，而`127.0.0.1`是那块叫做 loopback 的虚拟网卡的 IP。

而`localhost`只是一个域名，他可以指向任意IP，但是通常情况下都指向`127.0.0.1`(ipv4)和`::1`(ipv6)。

`0.0.0.0`在不同的情况下代表的含义不同：
* 当一台主机还没有被分配一个IP地址的时候，用于表示主机本身。（DHCP分配IP地址的时候）
* 用作默认路由，表示"任意IPV4主机"。
* 用来表示目标机器不可用。
* 在服务器中，`0.0.0.0`指的是本机的所有IPV4地址，如果一个主机有两个IP地址(内网和公网)，`192.168.1.1`和`10.1.2.1`，并且该主机上的一个服务监听的地址是`0.0.0.0`，那么通过两个ip地址都能够访问该服务。

## KeyValue size too large
```scala
var configuration: Configuration = HBaseConfiguration.create()
configuration.set("hbase.zookeeper.property.clientPort", props.getProperty("hbase.zookeeper.property.clientPort"))
configuration.set("hbase.zookeeper.quorum", props.getProperty("hbase.zookeeper.quorum"))
/**
 * 在进行插入操作的时候，HBase会挨个检查要插入的列，检查每个列的大小
 * 是否小于`maxKeyValueSize`值，当`cell`的大小大于`maxKeyValueSize`
 * 时，就会抛出`KeyValue size too large`的异常。
 * 方法1：把它设为可以被最大 region size 整除的更大的数，比如10485760(10MB)
 * 方法2：设置为<=0的数，禁用该项检查。
 */
configuration.set("hbase.client.keyvalue.maxsize", "-1")
```


