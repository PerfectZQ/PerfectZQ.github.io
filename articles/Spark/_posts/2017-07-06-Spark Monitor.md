---
layout: post
title: Spark Monitor
tag: Spark
---

## Reference
* [Monitoring](http://spark.apache.org/docs/latest/monitoring.html)
* [Web UI](https://spark.apache.org/docs/latest/web-ui.html)

## Spark Cluster Monitor
Spark UI 模式监控管理界面的入口`http://master:8080`，可以在`$SPARK_HOME/conf/spark-env.sh`中修改参数`SPARK_MASTER_PORT`或者`SPARK_MASTER_WEBUI_PORT`来改变端口号。

除此之外，Spark 会给每一个 SparkContext 启动一个默认的 Web 界面，`http://driver:4040`，该界面显示了关于程序运行情况的信息，如果同时运行多个 SparkContext，则端口会顺延到`4041`、`4042`...默认情况下，这些信息只能在程序运行期间被访问。程序运行结束后仍要访问的话，需要将 APP 运行期间的事件日志保存下来，并且配置 Spark History Server

> 需要注意的是 APP 运行期间的事件日志，即`eventLog`和用户输出的日志并不是同一种东西。对于用户输出的日志信息可以在监控管理页面的 Executor Tab 中查看，日志文件默认存储在每个节点`$SPARK_HOME/work/`目录下，各个节点下每个程序的日志文件名字相同。另外，各个节点存储的日志信息是分发到各个 Executor 任务执行时的信息，即在`foreachPartition`、`map`等 RDD 算子中执行的日志输出信息。而在driver 执行的日志输出信息不会被存储到里面，它默认在 driver 控制台输出，可以通过修改`$SPARK_HOME/conf/log4j.properties`，追加文件输出的`appender`。

## Spark History 

当 Spark 任务执行结束，或者我们执行`stop-all.sh`关闭集群，在重启集群之后，Web 页面的任务信息会被清空。为了防止这种情况，我们可以配置 Spark History Sever，这样还可以查看已经运行结束的任务的事件信息。通过 Spark UI 监控日志，能更直观的查询任务情况，如内存占用、响应时间、完成情况。当 Spark 运行在集群，如 YARN 或者 Mesos 中，Spark History Sever 仍然可以满足我们的需求。

首先进行如下配置，将 Spark 任务运行期间的事件日志保存下来。
```shell
vim $SPARK_HOME/conf/spark-default.conf

# 这样Spark就会将程序运行情况信息编码并以文件的形式持久化，打开会发现是json格式的信息。
spark.eventLog.enabled        true
# 用来指定SparkAPP运行情况信息日志的目录。注意是程序运行情况信息，并不是用户输出的日志信息。 
spark.eventLog.dir            hdfs://s121202:8020/sparkLogs
# 是否压缩记录Spark事件，默认值是snappy
spark.eventLog.compress       true
```

在启用 Spark History Server 之前，确保这个目录已经被创建，否则运行`./start-history-server.sh`的时候会报错。
```shell
# 提前在hdfs中创建文件夹
$ su - hdfs
$ hadoop fs -mkdir /sparkLogs
```

除此之外，`SPARK_PID_DIR`的默认路径是`/tmp/spark-events`，如果此路径不存在，在启用的时候也会报错，信息如下。
```console
starting org.apache.spark.deploy.history.HistoryServer, logging to /opt/neu/spark-2.1.1-bin-hadoop2.6/logs/spark-neu-org.apache.spark.deploy.history.HistoryServer-1-s121202.out
failed to launch: nice -n 0 /opt/neu/spark-2.1.1-bin-hadoop2.6/bin/spark-class org.apache.spark.deploy.history.HistoryServer
  	at org.apache.spark.deploy.history.FsHistoryProvider.org$apache$spark$deploy$history$FsHistoryProvider$$startPolling(FsHistoryProvider.scala:204)
  	... 9 more
full log in /opt/neu/spark-2.1.1-bin-hadoop2.6/logs/spark-neu-org.apache.spark.deploy.history.HistoryServer-1-s121202.out

# 查看错误日志
$ tail -500f /opt/neu/spark-2.1.1-bin-hadoop2.6/logs/spark-neu-org.apache.spark.deploy.history.HistoryServer-1-s121202.out
# 完整报错信息如下：
Spark Command: /usr/java/latest/bin/java -cp /opt/neu/spark-2.1.1-bin-hadoop2.6/conf/:/opt/neu/spark-2.1.1-bin-hadoop2.6/jars/*:/etc/hadoop/conf/ -Xmx1g org.apache.spark.deploy.history.HistoryServer
...
Exception in thread "main" java.lang.reflect.InvocationTargetException
	at sun.reflect.NativeConstructorAccessorImpl.newInstance0(Native Method)
	at sun.reflect.NativeConstructorAccessorImpl.newInstance(NativeConstructorAccessorImpl.java:62)
	at sun.reflect.DelegatingConstructorAccessorImpl.newInstance(DelegatingConstructorAccessorImpl.java:45)
	at java.lang.reflect.Constructor.newInstance(Constructor.java:423)
	at org.apache.spark.deploy.history.HistoryServer$.main(HistoryServer.scala:278)
	at org.apache.spark.deploy.history.HistoryServer.main(HistoryServer.scala)
Caused by: java.io.FileNotFoundException: Log directory specified does not exist: file:/tmp/spark-events Did you configure the correct one through spark.history.fs.logDirectory?
	at org.apache.spark.deploy.history.FsHistoryProvider.org$apache$spark$deploy$history$FsHistoryProvider$$startPolling(FsHistoryProvider.scala:214)
	at org.apache.spark.deploy.history.FsHistoryProvider.initialize(FsHistoryProvider.scala:160)
	at org.apache.spark.deploy.history.FsHistoryProvider.<init>(FsHistoryProvider.scala:156)
	at org.apache.spark.deploy.history.FsHistoryProvider.<init>(FsHistoryProvider.scala:77)
	... 6 more
Caused by: java.io.FileNotFoundException: File file:/tmp/spark-events does not exist
	at org.apache.hadoop.fs.RawLocalFileSystem.deprecatedGetFileStatus(RawLocalFileSystem.java:537)
	at org.apache.hadoop.fs.RawLocalFileSystem.getFileLinkStatusInternal(RawLocalFileSystem.java:750)
	at org.apache.hadoop.fs.RawLocalFileSystem.getFileStatus(RawLocalFileSystem.java:527)
	at org.apache.hadoop.fs.FilterFileSystem.getFileStatus(FilterFileSystem.java:409)
	at org.apache.spark.deploy.history.FsHistoryProvider.org$apache$spark$deploy$history$FsHistoryProvider$$startPolling(FsHistoryProvider.scala:204)
	... 9 more
```

Spark App 的事件日志信息所在的目录可以在执行启动脚本的时候通过传参来指定，例如`./start-history-server.sh hdfs://s121202:8020/sparkLogs`，也可以通过`spark.history.fs.logDirectory`参数来指定，指定方式如下。
```shell
$ vim $SPARK_HOME/conf/spark-env.sh
export SPARK_HISTORY_OPTS="-Dspark.history.ui.port=6666 -Dspark.history.retainedApplications=3 -Dspark.history.fs.logDirectory=hdfs://s121202:8020/sparkLogs"
# -Dspark.history.ui.port=6666 指定 WebUI 访问端口，端口号必须是 1024~65535 之间的数，或者指定 0，表示随机取一个空闲的 port，在启动日志信息中可以看到它。
# -Dspark.history.retainedApplications=3 指定保存 Application 历史记录个数 
# -Dspark.history.fs.logDirectory=hdfs://s121202:8020/sparkLogs 指定包含要加载的应用程序事件日志的目录 URL，也可以是本地文件路径 file://
```

> `spark.eventLog.dir`用来指定 Spark App 运行时生成事件日志的目录，而`spark.history.fs.logDirectory`是 spark history server 发现日志事件的位置

启动 Spark History Server:
```shell
# 进入sbin目录下
$ cd $SPARK_HOME/sbin
# 执行启动脚本
$ ./start-history-server.sh
```
启动完成之后，通过默认地址：`http://localhost:18080`访问

## Task Failure Monitor
* [Spark 任务之 Task 失败监控](https://blog.csdn.net/UUfFO/article/details/79935431)

在 Spark 程序中，`task`会根据`spark.task.maxFailures(default 4)`失败后进行会先进行重试，而不是让整个 Spark App 死掉，只有重试次数超过阈值的时候才会杀死 App。另外，如果是 Spark on YARN，那么程序还会受 YARN 的重试机制尝试重启 Spark App，通过参数`yarn.resourcemanager.am.max-attempts(default 2)`控制。

### Catch Task Failure Event
* 在`Executor`中，不管`task`成功与否都会向`execBackend`报告`task`的状态
```scala
execBackend.statusUpdate(taskId, TaskState.FINISHED, serializedResult)
```

* `CoarseGrainedExecutorBackend`会向`driver`发送`StatusUpdate`状态变更信息
```scala
override def statusUpdate(taskId: Long, state: TaskState, data: ByteBuffer) {
    val msg = StatusUpdate(executorId, taskId, state, data)
    driver match {
      case Some(driverRef) => driverRef.send(msg)
      case None => logWarning(s"Drop $msg because has not yet connected to driver")
    }
  }
```

* `CoarseGrainedSchedulerBackend`收到信息后调用`scheduler.statusUpdate()`
```scala
// 1
override def receive: PartialFunction[Any, Unit] = {
      case StatusUpdate(executorId, taskId, state, data) =>
        scheduler.statusUpdate(taskId, state, data.value)
        .....
        
// 2
taskResultGetter.enqueueFailedTask(taskSet, tid, state, serializedData)
// 3
scheduler.handleFailedTask(taskSetManager, tid, taskState, reason)
// 4
taskSetManager.handleFailedTask(tid, taskState, reason)
// 5
sched.dagScheduler.taskEnded(tasks(index), reason, null, accumUpdates, info)
// 6
eventProcessLoop.post(CompletionEvent(task, reason, result, accumUpdates, taskInfo)) 
```

* 
