---
layout: post
title: Java Technology and the JVM
tag: Java
---
## References
* [**Java Platform Standard Edition Technical Documentation site - 各版本文档入口**](https://docs.oracle.com/en/java/javase/11/)
* [Java Language and Virtual Machine Specifications](https://docs.oracle.com/javase/specs/index.html)
* [The Java® Language Specification - Java SE 8 Edition](https://docs.oracle.com/javase/specs/jls/se8/html/index.html)
* [The Java® Virtual Machine Specification Java SE 8 Edition](https://docs.oracle.com/javase/specs/jvms/se8/html/index.html)

## 基本概念
### Java Programming Language
Java 是一门面向对象的编程语言并有以下特性：

* **平台独立、跨操作系**: Java 程序被编译为字节码，运行在 JVM 中，JVM 支持多种操作系统，因此一套程序可以运行在不同的操作系统上。
* **面向对象**: 封装、抽象、继承、多态
* **自动垃圾收集**: 由 JVM 进行内存管理，垃圾回收
* **丰富的标准库**: Java 提供了很多标准库如 IO、网络、日期操作等等。

### Java Runtime Edition(JRE)
JRE 包含 Java Virtual Machine(JVM)，Java platform core classes，和 supporting Java platform libraries。

### Java Development Kit
JDK 是一组用于开发 Java 应用程序的工具(如`javac`、`javap`、`java`、`jar`、`jps`...)。使用 JDK，可以编译 Java 程序并在 JVM 中运行，还提供了用于打包和分发应用程序的一组工具。

JDK 和 JRE 共享 Java 应用程序编程接口（Java API 是开发人员用于创建 Java 应用程序的预打包库的集合。 Java API 通过提供工具类来完成许多常见的编程任务（包括字符串操作，日期/时间处理，网络和实现数据结构（例如，列表，映射，堆栈和队列）），使开发更容易。

`JDK = JRE + A collection of tools for developing Java applications`

### Java Virtual Machine


### Java SE Platform at a Glance
![有帮助的截图]({{ site.url }}/assets/java-se-platform.jpg)

[Java SE Platform at a Glance](https://www.oracle.com/technetwork/java/javase/tech/index.html)

## Java Garbage Collection
* [Java Garbage Collection Basics](https://www.oracle.com/webfolder/technetwork/tutorials/obe/java/gc01/index.html#overview)
* [**HotSpot Virtual Machine Garbage Collection Tuning Guide Java SE 8**](https://docs.oracle.com/javase/8/docs/technotes/guides/vm/gctuning/)
* [Sizing the Generations of JVM](https://docs.oracle.com/javase/8/docs/technotes/guides/vm/gctuning/sizing.html#sizing_generations)

## Tools and Commands Reference
[Tools and Commands Reference](https://docs.oracle.com/en/java/javase/11/tools/tools-and-command-reference.html)

Mac 各版本的 JDK 默认安装路径`/Library/Java/JavaVirtualMachines/`

JVM 相关命令在`/System/Library/Frameworks/JavaVM.framework/Versions/Current/Commands`可以找到(当然在 JDK 的默认安装目录也能找到)，有很多命令和工具。

对于某个命令的详细介绍和参数介绍可以使用`info`查阅，例如查看`java`命令可以使用`info java`。

下面介绍一些比较有用的命令。

### java
运行已经编译好的 java 程序
```shell
Usage: java [-options] class [args...]
           (to execute a class)
   or  java [-options] -jar jarfile [args...]
           (to execute a jar file)

# 需要在 src/META-INF/MANIFEST.MF 指定 Main-Class: com.xxx.YourMainApp，然后打成 executable jar
# 否则会出现 Can't execute jar- file: “no main manifest attribute” 的问题
$ java -jar yourapp.jar

# 如果不是一个 executable jar 包，则可以通过下面的方式指定主类
$ java -cp .:yourapp.jar com.xxx.YourMainApp

# 为 jvm 分配可用内存
$ java -cp .:yourapp.jar -Xms16g -Xmx16g com.xxx.YourMainApp

# 注意 [options] 必须在 class/-jar 前面，否则会被当作[args]
$ java -Xms16g -Xmx16g -XX:+UseConcMarkSweepGC -XX:+UseParNewGC -jar rockfs-server-1.0-SNAPSHOT.jar
```

### jar
压缩/解压缩 jar 文件
```shell
# 解压缩到当前目录，没有解压缩到指定文件夹，可以移除jar包，然后压缩
$ jar -xvf test.jar
mv test.jar ../

# 压缩 
$ jar -cvf test.jar *
```

### jps
查看虚拟机进程状况：显示指定系统内所有的 Hotspot 虚拟机进程

```shell
# usage
jps [options] [hostid]

# jps 可以通过RMI协议查询开启了RMI服务的远程虚拟机进程状态，hostid为RMI注册表中注册的主机名
# 常用 options;
# -q 只输出LVMID，省略主类名称
# -m 输出虚拟机进程启动时传递给主类main()函数的参数
# -l 输出主类的全名，如果进程执行的是Jar包，输出Jar路径
# -v 输出虚拟机进程启动时的JVM参数
```

### jstat
虚拟机统计信息监控工具：用于收集运行中的 Hotspot 虚拟机各方面的运行数据

```shell
$ jstat
Usage: jstat -help|-options
       jstat -<option> [-t] [-h<lines>] <vmid> [<interval> [<count>]]

Definitions:
  <option>      An option reported by the -options option
  <vmid>        Virtual Machine Identifier. A vmid takes the following form:
                     <lvmid>[@<hostname>[:<port>]]
                Where <lvmid> is the local vm identifier for the target
                Java virtual machine, typically a process id; <hostname> is
                the name of the host running the target Java virtual machine;
                and <port> is the port number for the rmiregistry on the
                target host. See the jvmstat documentation for a more complete
                description of the Virtual Machine Identifier.
  <lines>       Number of samples between header lines.
  <interval>    Sampling interval. The following forms are allowed:
                    <n>["ms"|"s"]
                Where <n> is an integer and the suffix specifies the units as 
                milliseconds("ms") or seconds("s"). The default units are "ms".
  <count>       Number of samples to take before terminating.
  -J<flag>      Pass <flag> directly to the runtime system.

# 查看可用的 options
$ jstat -options
-class
-compiler
-gc
-gccapacity
-gccause
-gcmetacapacity
-gcnew
-gcnewcapacity
-gcold
-gcoldcapacity
-gcutil
-printcompilation
```

查看 pid=29732 gc 情况，interval=500ms, samples=5000。
```shell
$ jstat -gcutil 29732 500ms 5000
# 具体每列的含义可以通过`info jstat`或者`man jstat`查阅
S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT   
0.00  20.29  12.03   9.84  97.26  92.48     89    0.486     3    0.209    0.695
0.00  20.29  12.03   9.84  97.26  92.48     89    0.486     3    0.209    0.695
0.00  20.29  12.03   9.84  97.26  92.48     89    0.486     3    0.209    0.695
0.00  20.29  12.14   9.84  97.26  92.48     89    0.486     3    0.209    0.695
0.00  20.29  12.14   9.84  97.26  92.48     89    0.486     3    0.209    0.695
0.00  20.29  12.14   9.84  97.26  92.48     89    0.486     3    0.209    0.695
```

### jstatd
虚拟机统计信息监控工具守护进程，可以方便的建立远程 RMI 服务器，这样就可以分析远程服务器上的 jvm 统计信息了。

### jinfo
Java 配置信息工具：显示虚拟机配置信息，比如给 main 方法的提交参数等
```shell
$ jinfo
Usage:
    jinfo [option] <pid>
        (to connect to running process)
    jinfo [option] <executable <core>
        (to connect to a core file)
    jinfo [option] [server_id@]<remote server IP or hostname>
        (to connect to remote debug server)

where <option> is one of:
    -flag <name>         to print the value of the named VM flag
    -flag [+|-]<name>    to enable or disable the named VM flag
    -flag <name>=<value> to set the named VM flag to the given value
    -flags               to print VM flags
    -sysprops            to print Java system properties
    <no option>          to print both of the above
    -h | -help           to print this help message
```

### jstack
Java 堆栈跟踪工具：显示虚拟机的**线程**堆栈信息

```shell
$ jstack
Usage:
    jstack [-l] <pid>
        (to connect to running process)
    jstack -F [-m] [-l] <pid>
        (to connect to a hung process)
    jstack [-m] [-l] <executable> <core>
        (to connect to a core file)
    jstack [-m] [-l] [server_id@]<remote server IP or hostname>
        (to connect to a remote debug server)

Options:
    -F  to force a thread dump. Use when jstack <pid> does not respond (process is hung)
    -m  to print both java and native frames (mixed mode)
    -l  long listing. Prints additional information about locks
    -h or -help to print this help message
```

JVM 在发生 crash 的时候一般会生成两个文件`hs_err_pid3742.log`和`core.3742`，`3742`是`pid`，`hs_err_pid3742.log`通过 JVM 参数`-XX:ErrorFile=./hs_err_pid<pid>.log`配置，`core.3742`是 core dump 文件，它的命名规则通过`/proc/sys/kernel/core_pattern`的值控制，因此你生成的 core dump 文件不一定和我的命名规则一样。注意，需要保证`ulimit -c unlimited`才会在系统崩溃的时候生成`core.xxx`，默认`ulimit -c`是`0`，不生成。除了系统崩溃时生成 core dump，在系统卡住或者 cpu 使用率很高的时候也可以手动触发`kill -3 pid`吓唬下 JVM 生成 core dump 文件。

```shell
# 连接 core 文件
$ jstack $JAVA_HOME/bin/java core.3742

Attaching to core core.3742 from executable /usr/bin/java, please wait...
Debugger attached successfully.
Server compiler detected.
JVM version is 25.181-b13
Deadlock Detection:

No deadlocks found.

Thread 28312: (state = BLOCKED)
 - sun.misc.Unsafe.park(boolean, long) @bci=0 (Compiled frame; information may be imprecise)
 - java.util.concurrent.locks.LockSupport.park(java.lang.Object) @bci=14, line=175 (Interpreted frame)
 - java.util.concurrent.locks.AbstractQueuedSynchronizer.parkAndCheckInterrupt() @bci=1, line=836 (Interpreted frame)
 - java.util.concurrent.locks.AbstractQueuedSynchronizer.acquireQueued(java.util.concurrent.locks.AbstractQueuedSynchronizer$Node, int) @bci=67, line=870 (Interpreted frame)
 - java.util.concurrent.locks.AbstractQueuedSynchronizer.acquire(int) @bci=17, line=1199 (Compiled frame)
 - java.util.concurrent.locks.ReentrantLock$NonfairSync.lock() @bci=21, line=209 (Compiled frame)
 - java.util.concurrent.locks.ReentrantLock.lock() @bci=4, line=285 (Compiled frame)
 - com.rich.rockfs.server.Rockfs.getWritableRocksDB(com.rich.rockfs.beans.DBInfo) @bci=85, line=97 (Compiled frame)
 - com.rich.rockfs.server.RockServerImpl.batchPut(com.rich.rockfs.beans.MultiplePutRequest, io.grpc.stub.StreamObserver) @bci=15, line=128 (Compiled frame)
 - com.rich.rockfs.server.RocksServerGrpc$MethodHandlers.invoke(java.lang.Object, io.grpc.stub.StreamObserver) @bci=90, line=472 (Interpreted frame)
 - io.grpc.stub.ServerCalls$UnaryServerCallHandler$UnaryServerCallListener.onHalfClose() @bci=53, line=171 (Compiled frame)
 - io.grpc.internal.ServerCallImpl$ServerStreamListenerImpl.halfClosed() @bci=15, line=283 (Compiled frame)
 - io.grpc.internal.ServerImpl$JumpToApplicationThreadServerStreamListener$1HalfClosed.runInContext() @bci=7, line=761 (Compiled frame)
 - io.grpc.internal.ContextRunnable.run() @bci=9, line=37 (Compiled frame)
 - io.grpc.internal.SerializingExecutor.run() @bci=18, line=123 (Compiled frame)
 - java.util.concurrent.ThreadPoolExecutor.runWorker(java.util.concurrent.ThreadPoolExecutor$Worker) @bci=95, line=1149 (Interpreted frame)
 - java.util.concurrent.ThreadPoolExecutor$Worker.run() @bci=5, line=624 (Interpreted frame)
 - java.lang.Thread.run() @bci=11, line=748 (Interpreted frame)


Thread 28310: (state = BLOCKED)
 - sun.misc.Unsafe.park(boolean, long) @bci=0 (Compiled frame; information may be imprecise)
 - java.util.concurrent.locks.LockSupport.park(java.lang.Object) @bci=14, line=175 (Interpreted frame)
 - java.util.concurrent.locks.AbstractQueuedSynchronizer.parkAndCheckInterrupt() @bci=1, line=836 (Interpreted frame)
 - java.util.concurrent.locks.AbstractQueuedSynchronizer.acquireQueued(java.util.concurrent.locks.AbstractQueuedSynchronizer$Node, int) @bci=67, line=870 (Interpreted frame)
 - java.util.concurrent.locks.AbstractQueuedSynchronizer.acquire(int) @bci=17, line=1199 (Compiled frame)
 - java.util.concurrent.locks.ReentrantLock$NonfairSync.lock() @bci=21, line=209 (Compiled frame)
 - java.util.concurrent.locks.ReentrantLock.lock() @bci=4, line=285 (Compiled frame)
 - com.rich.rockfs.server.Rockfs.getWritableRocksDB(com.rich.rockfs.beans.DBInfo) @bci=85, line=97 (Compiled frame)
 - com.rich.rockfs.server.RockServerImpl.batchPut(com.rich.rockfs.beans.MultiplePutRequest, io.grpc.stub.StreamObserver) @bci=15, line=128 (Compiled frame)
 - com.rich.rockfs.server.RocksServerGrpc$MethodHandlers.invoke(java.lang.Object, io.grpc.stub.StreamObserver) @bci=90, line=472 (Interpreted frame)
 - io.grpc.stub.ServerCalls$UnaryServerCallHandler$UnaryServerCallListener.onHalfClose() @bci=53, line=171 (Compiled frame)
 - io.grpc.internal.ServerCallImpl$ServerStreamListenerImpl.halfClosed() @bci=15, line=283 (Compiled frame)
 - io.grpc.internal.ServerImpl$JumpToApplicationThreadServerStreamListener$1HalfClosed.runInContext() @bci=7, line=761 (Compiled frame)
 - io.grpc.internal.ContextRunnable.run() @bci=9, line=37 (Compiled frame)
 - io.grpc.internal.SerializingExecutor.run() @bci=18, line=123 (Compiled frame)
 - java.util.concurrent.ThreadPoolExecutor.runWorker(java.util.concurrent.ThreadPoolExecutor$Worker) @bci=95, line=1149 (Interpreted frame)
 - java.util.concurrent.ThreadPoolExecutor$Worker.run() @bci=5, line=624 (Interpreted frame)
 - java.lang.Thread.run() @bci=11, line=748 (Interpreted frame)
...
```

### jmap
Java 内存映像工具：生成虚拟机的内存转储快照(heapdump文件)

```shell
# 查看使用方法
$ jmap
Usage:
    jmap [option] <pid>
        (to connect to running process)
    jmap [option] <executable <core>
        (to connect to a core file)
    jmap [option] [server_id@]<remote server IP or hostname>
        (to connect to remote debug server)

where <option> is one of:
    <none>               to print same info as Solaris pmap
    -heap                to print java heap summary
    -histo[:live]        to print histogram of java object heap; if the "live"
                         suboption is specified, only count live objects
    -clstats             to print class loader statistics
    -finalizerinfo       to print information on objects awaiting finalization
    -dump:<dump-options> to dump java heap in hprof binary format
                         dump-options:
                           live         dump only live objects; if not specified,
                                        all objects in the heap are dumped.
                           format=b     binary format
                           file=<file>  dump heap to <file>
                         Example: jmap -dump:live,format=b,file=heap.bin <pid>
    -F                   force. Use with -dump:<dump-options> <pid> or -histo
                         to force a heap dump or histogram when <pid> does not
                         respond. The "live" suboption is not supported
                         in this mode.
    -h | -help           to print this help message
    -J<flag>             to pass <flag> directly to the runtime system
```

查看指定进程堆内存分配情况
```shell
$ jmap -heap 8357
Attaching to process ID 8357, please wait...
Debugger attached successfully.
Server compiler detected.
JVM version is 25.181-b13

using thread-local object allocation.
Parallel GC with 6 thread(s)

Heap Configuration:
 MinHeapFreeRatio         = 0
 MaxHeapFreeRatio         = 100
 MaxHeapSize              = 8392802304 (8004.0MB)
 NewSize                  = 175112192 (167.0MB)
 MaxNewSize               = 2797600768 (2668.0MB)
 OldSize                  = 351272960 (335.0MB)
 NewRatio                 = 2
 SurvivorRatio            = 8
 MetaspaceSize            = 21807104 (20.796875MB)
 CompressedClassSpaceSize = 1073741824 (1024.0MB)
 MaxMetaspaceSize         = 17592186044415 MB
 G1HeapRegionSize         = 0 (0.0MB)

Heap Usage:
PS Young Generation
Eden Space:
 capacity = 132120576 (126.0MB)
 used     = 42286136 (40.32720184326172MB)
 free     = 89834440 (85.67279815673828MB)
 32.00571574862041% used
From Space:
 capacity = 21495808 (20.5MB)
 used     = 0 (0.0MB)
 free     = 21495808 (20.5MB)
 0.0% used
To Space:
 capacity = 21495808 (20.5MB)
 used     = 0 (0.0MB)
 free     = 21495808 (20.5MB)
 0.0% used
PS Old Generation
 capacity = 351272960 (335.0MB)
 used     = 0 (0.0MB)
 free     = 351272960 (335.0MB)
 0.0% used

4277 interned Strings occupying 340832 bytes.
```

分析 core dump
```shell
$ jmap -heap $JAVA_HOME/bin/java core.3742
```

### jhat
虚拟机堆转储快照分析工具：用于分析 heapdump 文件，它会建立一个 HTTP/HTML 服务器，让用户可以在浏览器上查看分析结果

一般不会直接使用 jhat 去分析 heapdump 文件，因为它的功能比较简陋。一般都会把转储文件拷贝到其他节点，使用更强大的 JProfiler/VisualVM/MAT 进行分析。


### jvisualvm


