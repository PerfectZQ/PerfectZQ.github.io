---
layout: post
title: Java Junior
tag: Java
---

## Introduction
本篇主要整理 Java 初级的一些知识点

## JDK 环境变量
```shell
# OSX 查找 JAVA_HOME 的方法
# === 方法1 ===
$ which java
/usr/bin/java
$ ls -l /usr/bin/java
lrwxr-xr-x  1 root  wheel  74 12 19 19:56 /usr/bin/java -> /System/Library/Frameworks/JavaVM.framework/Versions/Current/Commands/java
$ cd /System/Library/Frameworks/JavaVM.framework/Versions/Current/Commands/
$ ./java_home -V
# 显示如下信息：
Matching Java Virtual Machines (1):
    1.8.0_144, x86_64:	"Java SE 8"	/Library/Java/JavaVirtualMachines/jdk1.8.0_144.jdk/Contents/Home
# === 方法2 ===
$ /usr/libexec/java_home -V
# 查看某个版本的 java_home
$ /usr/libexec/java_home -v 1.8

# 配置 JAVA_HOME
$ vim ~/.bash_profile
export JAVA_8_HOME=`/usr/libexec/java_home -v 1.8` 
export JAVA_HOME=$JAVA_8_HOME
export CLASS_PATH=$JAVA_HOME/lib
export PATH=$PATH:$JAVA_HOME/bin
$ source ~/.bash_profile
```

## Classpath 
```scala
// 获取classpath的根目录：file:/D:/IdeaProjects/javalearn/target/classes/
println(this.getClass.getClassLoader.getResource(""))
// 取classpath的根目录: D:/IdeaProjects/javalearn/target/classes/
println(this.getClass.getClassLoader.getResource("").getPath())
// 获取classpath根目录+当前类包路径：file:/D:/IdeaProjects/javalearn/target/classes/com/zq/
println(this.getClass.getResource(""))
```

## Spring 获取当前路径
```java
// 1. IDEA Main,
// C:\Users\zhangqiang\IdeaProjects\dataplat-meta\meta-plat-service\target\classes
// 2. java -jar ./meta-plat-service-1.0-SNAPSHOT.jar,
// C:\Users\zhangqiang\IdeaProjects\dataplat-meta\meta-plat-service\target
// 3. cd C:\Users\zhangqiang && java -jar C:\Users\zhangqiang\IdeaProjects\dataplat-meta\meta-plat-service\target\meta-plat-service-1.0-SNAPSHOT.jar,
// C:\Users\zhangqiang
File path = new File(ResourceUtils.getURL("classpath:").getPath());
if (!path.exists()) path = new File("");
System.out.println(path.getAbsolutePath());


// 1. IDEA Main,
// C:\Users\zhangqiang\IdeaProjects\dataplat-meta
// 2. java -jar ./meta-plat-service-1.0-SNAPSHOT.jar,
// C:\Users\zhangqiang\IdeaProjects\dataplat-meta\meta-plat-service\target
// 3. cd C:\Users\zhangqiang && java -jar C:\Users\zhangqiang\IdeaProjects\dataplat-meta\meta-plat-service\target\meta-plat-service-1.0-SNAPSHOT.jar,
// C:\Users\zhangqiang
System.out.println(System.getProperty("user.dir"));


// 1. IDEA Main,
// C:\Users\zhangqiang\IdeaProjects\dataplat-meta
// 2. java -jar ./meta-plat-service-1.0-SNAPSHOT.jar,
// C:\Users\zhangqiang\IdeaProjects\dataplat-meta\meta-plat-service\target
// 3. cd C:\Users\zhangqiang && java -jar C:\Users\zhangqiang\IdeaProjects\dataplat-meta\meta-plat-service\target\meta-plat-service-1.0-SNAPSHOT.jar,
// C:\Users\zhangqiang\IdeaProjects\dataplat-meta\meta-plat-service\target
ApplicationHome home = new ApplicationHome();
System.out.println(home.getDir());
File executeJarFile = home.getSource();
// 1. IDEA Main,
// java.lang.NullPointerException
// 2. java -jar ./meta-plat-service-1.0-SNAPSHOT.jar,
// C:\Users\zhangqiang\IdeaProjects\dataplat-meta\meta-plat-service\target\meta-plat-service-1.0-SNAPSHOT.jar
// 3. cd C:\Users\zhangqiang && java -jar C:\Users\zhangqiang\IdeaProjects\dataplat-meta\meta-plat-service\target\meta-plat-service-1.0-SNAPSHOT.jar,
// C:\Users\zhangqiang\IdeaProjects\dataplat-meta\meta-plat-service\target\meta-plat-service-1.0-SNAPSHOT.jar
System.out.println(executeJarFile.toString());


// 1. IDEA Main,
// /C:/Users/zhangqiang/IdeaProjects/dataplat-meta/meta-plat-service/target/classes/
// 2. java -jar ./meta-plat-service-1.0-SNAPSHOT.jar,
// file:/C:/Users/zhangqiang/IdeaProjects/dataplat-meta/meta-plat-service/target/meta-plat-service-1.0-SNAPSHOT.jar!/BOOT-INF/classes!/
// 3. cd C:\Users\zhangqiang && java -jar C:\Users\zhangqiang\IdeaProjects\dataplat-meta\meta-plat-service\target\meta-plat-service-1.0-SNAPSHOT.jar,
// file:/C:/Users/zhangqiang/IdeaProjects/dataplat-meta/meta-plat-service/target/meta-plat-service-1.0-SNAPSHOT.jar!/BOOT-INF/classes!/
String path1 = ClassUtils.getDefaultClassLoader().getResource("").getPath();
System.out.println(URLDecoder.decode(path1, "utf-8"));


// 1. IDEA Main,
// /C:/Users/zhangqiang/IdeaProjects/dataplat-meta/meta-plat-service/target/classes/
// 2. java -jar ./meta-plat-service-1.0-SNAPSHOT.jar,
// file:/C:/Users/zhangqiang/IdeaProjects/dataplat-meta/meta-plat-service/target/meta-plat-service-1.0-SNAPSHOT.jar!/BOOT-INF/classes!/
// 3. cd C:\Users\zhangqiang && java -jar C:\Users\zhangqiang\IdeaProjects\dataplat-meta\meta-plat-service\target\meta-plat-service-1.0-SNAPSHOT.jar,
// file:/C:/Users/zhangqiang/IdeaProjects/dataplat-meta/meta-plat-service/target/meta-plat-service-1.0-SNAPSHOT.jar!/BOOT-INF/classes!/
String path2 = ResourceUtils.getURL("classpath:").getPath();
System.out.println(path2);
```

## Properties
### Load Properties in resource directories
java项目中的`resources`等资源文件夹中的文件在编译后，会添加到classpath下，因此可以直接使用下面的方法读取资源目录下的文件。
```scala
import java.util.Properties

val props: Properties = new Properties()
props.load(this.getClass.getClassLoader.getResourceAsStream("mongodb.properties"))
props.get("ip").toString
```
### Load Properties not in resource directories
```scala
import java.util.Properties

val props: Properties = new Properties()
props.load(new FileInputStream("/opt/neu/submit/gd_log_analyse.properties"))
props.get("ip").toString
```

### Differences between getProperties & getEnv
`System.getProperties`获取的是启动 JVM 时候通过`-Dproperty=value`中传入的参数，而`System.getEnv`是获取真正的操作系统(非 JVM)的环境变量。

### Differences between setProperty & java -Dproperty


## Special characters in java regex
在字符串分割split()方法和replace()方法中，`.`字符、`|`字符以及`\`字符都是需要额外转义的特殊字符。

举个例子，Spark处理一批文本数据的时候，有的文本中存在`\`字符，在拼接Json字符串的时候会错误的将Json的 `"` 转义掉，这样会导致Json的解析异常，所以需要将`'\'`去掉，然后首先想到了下面的写法：

```scala
val str = """\哈哈哈\"""

// 注意，这是错误的写法！
str.replaceAll("""\""","")
```
结果出现了下面的异常：

```console
Exception in thread "main" java.util.regex.PatternSyntaxException: Unexpected internal error near index 1
\
 ^
	at java.util.regex.Pattern.error(Pattern.java:1924)
	at java.util.regex.Pattern.compile(Pattern.java:1671)
	at java.util.regex.Pattern.<init>(Pattern.java:1337)
	at java.util.regex.Pattern.compile(Pattern.java:1022)
	at java.lang.String.replaceAll(String.java:2162)
	at com.neusoft.apps.Test$.main(Test.scala:37)
	at com.neusoft.apps.Test.main(Test.scala)
```

原因是：`\` 其实在正则表达式中依然是转移字符，虽然 `"""\"""` 这种写法，在Scala中不需要转义就代表 `\` 字符，但是java.util.regex.Pattern中仍然将其视为转义符，而转义符后面没有跟待转义的字符，然后就报错了。
所以，转义符`\` 后再加上 `\` ，再进行一次转义才相当于字符 `\` 。

```scala
val str = """\哈哈哈\"""
str.replaceAll("""\\""","")
```
或者

```scala
val str = """\哈哈哈\"""
str.replaceAll("\\\\","")
```
同理，在String.split()方法中也是如此。

## JDBC format
### Oracle
`service_name`是数据库服务名，一个数据库服务可以包含多个数据库实例，`SID`即数据库实例的唯一标识。

```shell
jdbc:oracle:thin:@//<host>:<port>/<service_name>
jdbc:oracle:thin:@<host>:<port>:<SID> 
jdbc:oracle:thin:@<TNSName> 
```

注意如果jdbcURL格式写错了可能会出现异常：`java.sql.SQLException: No suitable driver`

### Mysql
```shell
jdbc:mysql://[username:password@][host:port],[host:port].../[database][?参数名1][=参数值1][&参数名2][=参数值2]... 
```

## Date
### DataFormat
* G 年代标志符
* y 年
* M 月
* d 日
* h 时 在上午或下午 (1~12)
* H 时 在一天中 (0~23)
* m 分
* s 秒
* S 毫秒
* E 星期 ("EEE"代表英文的星期，"EEEE"代表中文的星期)
* D 一年中的第几天
* F 一月中第几个星期几
* w 一年中第几个星期
* W 一月中第几个星期
* a 上午 / 下午 标记符 
* k 时 在一天中 (1~24)
* K 时 在上午或下午 (0~11)
* z 时区

### 将字符串转换成时间类型 parse()
```java
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.Date;

// 英文时间需要设置Local属性，默认取系统本地时间
String str = "24/May/2017:00:00:00";
// 用MMM代表英文的月份，MMMM代表中文的月份，如五月
SimpleDateFormat sdf = new SimpleDateFormat("dd/MMM/yyyy:HH:mm:ss", Locale.ENGLISH);
Date date = sdf.parse(str);

// 两位数字就用两个M来代表
String str = "24/05/2017:00:00:00";
SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy:HH:mm:ss", Locale.ENGLISH);
Date date = sdf.parse(str);

// 1位数字就用1个M来代表，即便是12，也是可以识别的，只不过如果是时间转字符串的话，月份的结果是5，而不是05
String str = "24/5/2017:00:00:00";
SimpleDateFormat sdf = new SimpleDateFormat("dd/M/yyyy:HH:mm:ss", Locale.ENGLISH);
Date date = sdf.parse(str);
```

### 将时间类型转换成字符串 format()

```java
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.Date;

SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd");
Date currentTime = sdf.format(new Date(System.currentTimeMillis()));
```

## Java Operator
### Java 中的三种移位运算符
Java 包含`<<`、`>>`、`>>>`三种移位运算符
```java
// -2147483640
int num = Integer.MIN_VALUE + 8;
// 10000000000000000000000000001000
System.out.println(Integer.toBinaryString(num));

// 左移: num = num * 2^3
// 64
num = num << 3;
// 00000000000000000000000001000000
System.out.println(Integer.toBinaryString(num));

// 右移: num = num / 2^3
// -268435455
num = num >> 3;
// 11110000000000000000000000000001
System.out.println(Integer.toBinaryString(num));

// 无符号右移: 忽略符号位，最高位补零
num = -1
// 11111111111111111111111111111111
System.out.println(Integer.toBinaryString(num));
num = num >>> 3;
// 00011111111111111111111111111111
System.out.println(Integer.toBinaryString(num));
```

## JSR303
`JSR(Java Specification Requests)`，Java规范提案是指向`JCP(Java Community Process)`提出新增一个标准化技术规范的正式请求。任何人都可以提交JSR，以向Java平台增添新的API和服务。JSR已成为Java界的一个重要标准。