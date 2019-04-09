---
layout: post
title: Java Technology and the JVM
tag: Java
---
## References
[Java Platform Standard Edition Technical Documentation site](https://docs.oracle.com/en/java/javase/11/)

[Java Language and Virtual Machine Specifications](https://docs.oracle.com/javase/specs/index.html)

[The Java® Language Specification - Java SE 8 Edition](https://docs.oracle.com/javase/specs/jls/se8/html/index.html)

[The Java® Virtual Machine Specification Java SE 8 Edition](https://docs.oracle.com/javase/specs/jvms/se8/html/index.html)

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
[Java Garbage Collection Basics](https://www.oracle.com/webfolder/technetwork/tutorials/obe/java/gc01/index.html#overview)

## Tools and Commands Reference
[Tools and Commands Reference](https://docs.oracle.com/en/java/javase/11/tools/tools-and-command-reference.html)

Mac 各版本的 JDK 默认安装路径`/Library/Java/JavaVirtualMachines/`

JVM 相关命令在`/System/Library/Frameworks/JavaVM.framework/Versions/Current/Commands`可以找到(当然在 JDK 的默认安装目录也能找到)，有很多命令和工具。

对于某个命令的详细介绍和参数介绍可以使用`info`查阅，例如查看`jps`命令可以使用`info jps`。

下面介绍一些比较有用的命令。
### java
运行已经编译好的 java 程序
```shell
# 需要在 src/META-INF/MANIFEST.MF 指定 Main-Class: com.xxx.YourMainApp，然后打成 executable jar
# 否则会出现 Can't execute jar- file: “no main manifest attribute” 的问题
java -jar myapp.jar

# 指定主类
java -cp myapp.jar com.xxx.YourMainApp
```

### jar
压缩/解压缩 jar 文件
```shell
# 解压缩到当前目录，没有解压缩到指定文件夹，可以移除jar包，然后压缩
jar -xvf test.jar
mv test.jar ../

# 压缩 
jar -cvf test.jar *
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
虚拟机统计信息监控工具：用于收集 Hotspot 虚拟机各方面的运行数据

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

# 查看 pid=29732 gc 情况，interval=500ms, samples=5000
$ jstat -gcutil 29732 500ms 5000   
S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT   
0.00  20.29  12.03   9.84  97.26  92.48     89    0.486     3    0.209    0.695
0.00  20.29  12.03   9.84  97.26  92.48     89    0.486     3    0.209    0.695
0.00  20.29  12.03   9.84  97.26  92.48     89    0.486     3    0.209    0.695
0.00  20.29  12.14   9.84  97.26  92.48     89    0.486     3    0.209    0.695
0.00  20.29  12.14   9.84  97.26  92.48     89    0.486     3    0.209    0.695
0.00  20.29  12.14   9.84  97.26  92.48     89    0.486     3    0.209    0.695
```

### jstatd
虚拟机统计信息监控工具守护进程，可以方便的建立远程 RMI 服务器

### jinfo
Java 配置信息工具：显示虚拟机配置信息

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

### jhat
虚拟机堆转储快照分析工具：用于分析 heapdump 文件，它会建立一个 HTTP/HTML 服务器，让用户可以在浏览器上查看分析结果

一般不会直接使用 jhat 去分析 heapdump 文件，因为它的功能比较简陋。一般都会把转储文件拷贝到其他节点，使用更强大的 JProfiler/VisualVM/MAT 进行分析。

### jstack
Java 堆栈跟踪工具：显示虚拟机的线程快照

### jvisualvm


