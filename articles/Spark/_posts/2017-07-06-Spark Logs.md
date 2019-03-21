---
layout: post
title: Spark Logs
tag: Spark
---

## Spark 日志存储
Spark 节点启动情况的日志存储在`$SPARK_HOME/logs`下，例如`spark-history-server`的启动情况、`master`或者`worker`的启动情况。

Spark执行各任务时输出的日志，例如`println()`、`logger.info()`会分两部分输出。
* **driver：** 在`main`方法之中`map`等算子之外运行的输出日志会在driver节点(Master)生成，默认只在控制台输出。可以修改`$SPARK_HOME/conf/log4j.properties`，添加以文件方式输出的logger，添加方法见下一节[Log4j 的介绍与配置语法]。
* **executors：** 在`map`等算子之中，即分发到各个executor中执行的输出日志会在executor(Worker)节点生成，默认将日志保存成文件在`$SPARK_HOME/worker/`目录下，保存路径可以通过修改`$SPARK_HOME/spark-env.sh`中的参数`SPARK_WORKER_DIR`更改。除了查看各节点的日志文件，还可以通过[spark监控页面](http://arch-long.cn/articles/spark/%E7%9B%91%E6%8E%A7%E7%AE%A1%E7%90%86.html)查看日志信息。

在`$SPARK_HOME/conf/log4j.property.template`中，有基本的控制台输出配置。`cp log4j.property.template log4j.property` 在`log4j.property`中可以添加自己的`Appender`增加其他的日志输出目标。

如果要单独配置某个spark application的日志，可以在spark-submit提交的时候添加参数，`-conf "spark.driver.extraJavaOptions=-Dlog4j.configuration=file:/log4j.xml"`，来指定其他的配置文件

## Log4j 的介绍与配置语法
Log4j是第三方软件，由Logger、Appender、Layout三个组件组成。Log4j是Log4家族的成员，顾名思义Log4Java。

[Log4j2 配置文件手册](https://logging.apache.org/log4j/2.x/manual/configuration.html)

### Log4j配置根Logger
```shell
# 语法，名字可以随便起，但要和下面的配置对应
log4j.rootLogger = [level],appenderName,appenderName2,... 
# 或者（旧方法不推荐使用）
log4j.rootCategory = [level],appenderName,appenderName2,... 
```
level是日志记录的优先级，分为OFF、TRACE、DEBUG、INFO、WARN、ERROR、FATAL、ALL，Log4j建议只使用4个级别
* DEBUG : 日志输出最多，输出DEBUG、INFO、WARN、ERROR信息
* INFO : 输出INFO、WARN、ERROR信息
* WARN : 输出WARN、ERROR信息
* ERROR : 只输出ERROR信息
appenderName是指出日志信息输出到哪个地方(哪些appender)，可以同时指定多个输出目的

### 配置日志信息输出目的地Appender
[Log4j2 Appender](https://logging.apache.org/log4j/2.x/manual/appenders.html)

Log4j提供的appender类型：
* org.apache.log4j.ConsoleAppender(输出到控制台) 
* org.apache.log4j.FileAppender(输出到文件) 
* org.apache.log4j.DailyRollingFileAppender(每天产生一个日志文件) 
* org.apache.log4j.RollingFileAppender(文件大小到达指定尺寸的时候产生一个新的文件) 
* org.apache.log4j.WriterAppender(将日志信息以流格式发送到任意指定的地方)

```shell
# 先给appender起名字，第一个参数是[level]
log4j.rootLogger =ALL,systemOut,logFile,logDailyFile,logRollingFile,logMail,logDB 
``` 
1. ConsoleAppender选项属性，输出到控制台 
```shell
# 指定appender systemOut的类型
log4j.appender.systemOut = org.apache.log4j.ConsoleAppender 
log4j.appender.systemOut.layout = org.apache.log4j.PatternLayout 
log4j.appender.systemOut.layout.ConversionPattern = [%-5p][%-22d{yyyy/MM/dd HH:mm:ssS}][%l]%n%m%n 
# Threshold = DEBUG:指定日志消息的输出最低层次 
log4j.appender.systemOut.Threshold = DEBUG 
# ImmediateFlush = TRUE:默认值是true,所有的消息都会被立即输出 
log4j.appender.systemOut.ImmediateFlush = TRUE 
# Target = System.err:默认值System.out,输出到控制台(err为红色,out为黑色) 
log4j.appender.systemOut.Target = System.out 
```
2. FileAppender选项属性，输出到文件 
```shell
# 指定appender logFile的类型
log4j.appender.logFile = org.apache.log4j.FileAppender 
log4j.appender.logFile.layout = org.apache.log4j.PatternLayout 
log4j.appender.logFile.layout.ConversionPattern = [%-5p][%-22d{yyyy/MM/dd HH:mm:ssS}][%l]%n%m%n 
log4j.appender.logFile.Threshold = DEBUG 
log4j.appender.logFile.ImmediateFlush = TRUE 
# Append = FALSE:默认值true,将消息追加到指定文件中，false指将消息覆盖指定的文件内容 
log4j.appender.logFile.Append = TRUE 
# File = C:\log4j.log:指定消息输出到C:\log4j.log文件 
log4j.appender.logFile.File = ../Struts2/WebRoot/log/File/log4j_Struts.log 
# Encoding = UTF-8:可以指定文件编码格式
log4j.appender.logFile.Encoding = UTF-8 
``` 
3. DailyRollingFileAppender选项属性，按DatePattern输出到文件
```shell
# 指定appender logDailyFile的类型
log4j.appender.logDailyFile = org.apache.log4j.DailyRollingFileAppender 
log4j.appender.logDailyFile.layout = org.apache.log4j.PatternLayout 
log4j.appender.logDailyFile.layout.ConversionPattern = [%-5p][%-22d{yyyy/MM/dd HH:mm:ssS}][%l]%n%m%n 
log4j.appender.logDailyFile.Threshold = DEBUG 
log4j.appender.logDailyFile.ImmediateFlush = TRUE 
log4j.appender.logDailyFile.Append = TRUE 
log4j.appender.logDailyFile.File = ../Struts2/WebRoot/log/DailyFile/log4j_Struts.log
# DatePattern='.'yyyy-ww:每周滚动一次文件,即每周产生一个新的文件。还可以按用以下参数: 
#             '.'yyyy-MM:每月 
#             '.'yyyy-ww:每周 
#             '.'yyyy-MM-dd:每天 
#             '.'yyyy-MM-dd-a:每天两次 
#             '.'yyyy-MM-dd-HH:每小时 
#             '.'yyyy-MM-dd-HH-mm:每分钟 
log4j.appender.logDailyFile.DatePattern = '.'yyyy-MM-dd-HH-mm
log4j.appender.logDailyFile.Encoding = UTF-8 
```  
4. RollingFileAppender选项属性，设定文件大小输出到文件
```shell
# 指定appender logRollingFile的类型
log4j.appender.logRollingFile = org.apache.log4j.RollingFileAppender 
log4j.appender.logRollingFile.layout = org.apache.log4j.PatternLayout 
log4j.appender.logRollingFile.layout.ConversionPattern = [%-5p][%-22d{yyyy/MM/dd HH:mm:ssS}][%l]%n%m%n 
log4j.appender.logRollingFile.Threshold = DEBUG 
log4j.appender.logRollingFile.ImmediateFlush = TRUE 
log4j.appender.logRollingFile.Append = TRUE 
log4j.appender.logRollingFile.File = ../Struts2/WebRoot/log/RollingFile/log4j_Struts.log 
# MaxFileSize = 100KB:后缀可以是KB,MB,GB.在日志文件到达该大小时,将会自动滚动.如:log4j.log.1 
log4j.appender.logRollingFile.MaxFileSize = 1MB
# MaxBackupIndex = 2:指定可以产生的滚动文件的最大数
log4j.appender.logRollingFile.MaxBackupIndex = 10 
log4j.appender.logRollingFile.Encoding = UTF-8  
```
5. 用Email发送日志
```shell
log4j.appender.logMail = org.apache.log4j.net.SMTPAppender 
log4j.appender.logMail.layout = org.apache.log4j.HTMLLayout 
log4j.appender.logMail.layout.LocationInfo = TRUE 
log4j.appender.logMail.layout.Title = Struts2 Mail LogFile 
log4j.appender.logMail.Threshold = DEBUG 
log4j.appender.logMail.SMTPDebug = FALSE 
log4j.appender.logMail.SMTPHost = SMTP.163.com 
log4j.appender.logMail.From = xly3000@163.com 
log4j.appender.logMail.To = xly3000@gmail.com 
#log4j.appender.logMail.Cc = xly3000@gmail.com 
#log4j.appender.logMail.Bcc = xly3000@gmail.com 
log4j.appender.logMail.SMTPUsername = xly3000 
log4j.appender.logMail.SMTPPassword = 1234567 
log4j.appender.logMail.Subject = Log4j Log Messages 
#log4j.appender.logMail.BufferSize = 1024 
#log4j.appender.logMail.SMTPAuth = TRUE 
```
6. 将日志登录到MySQL数据库
```shell
log4j.appender.logDB = org.apache.log4j.jdbc.JDBCAppender 
log4j.appender.logDB.layout = org.apache.log4j.PatternLayout 
log4j.appender.logDB.Driver = com.mysql.jdbc.Driver 
log4j.appender.logDB.URL = jdbc:mysql://127.0.0.1:3306/xly 
log4j.appender.logDB.User = root 
log4j.appender.logDB.Password = 123456 
log4j.appender.logDB.Sql = INSERT INTOT_log4j(project_name,create_date,level,category,file_name,thread_name,line,all_category,message)values('Struts2','%d{yyyy-MM-ddHH:mm:ss}','%p','%c','%F','%t','%L','%l','%m')
```

## 在程序中使用Log4j
```scala
val logger = Logger.getLogger(this.getClass())
PropertyConfigurator.configure("Log4j.properties");
logger.info("测试信息开始");
logger.info("测试信息结束");
```

## Log4j2 的介绍与配置语法

### 依赖
```xml
<dependencies>
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-core</artifactId>
            <version>2.11.2</version>
        </dependency>
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-slf4j-impl</artifactId>
            <version>2.11.2</version>
        </dependency>
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-1.2-api</artifactId>
            <version>2.11.2</version>
        </dependency>
        <!-- Log4j2 Json Format -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.9.8</version>
        </dependency>
    </dependencies>
```

### 配置文件
注意应该是`log4j2.properties`而不是`log4j.properties`，否则会找不到。
```properties
# ---------------------------------------------------
# -------------------- 定义变量 ----------------------
# ---------------------------------------------------

# `property`下的变量可以通过 ${filename} 获取相应的值
property.filename = target/rolling/rolling.log

# ---------------------------------------------------
# ------------------ 定义 appender -------------------
# ---------------------------------------------------

# ----------------- json logs -----------------
appender.json.type = Console
appender.json.name = stdout
appender.json.target = "SYSTEM_OUT"
appender.json.layout.type = JsonLayout
# If true, the appender does not use end-of-lines and indentation. Defaults to false.
appender.json.layout.compact = true
# If true, the appender appends an end-of-line after each record. Defaults to false. Use with eventEol=true and compact=true to get one record per line.
appender.json.layout.eventEol = true
# If true, ObjectMessage is serialized as JSON object to the "message" field of the output log. Defaults to false.
appender.json.layout.objectMessageAsJsonObject = true
# If true, the appender includes the JSON header and footer, and comma between records. Defaults to false.
appender.json.layout.complete = false
# If true, include full stacktrace of any logged Throwable (optional, default to true).
appender.json.layout.includeStacktrace = true
# Whether to format the stacktrace as a string, and not a nested object (optional, defaults to false).
appender.json.layout.stacktraceAsString = true
# If true, the appender includes the thread context map in the generated JSON. Defaults to false.
appender.json.layout.properties = false
# If true, the thread context map is included as a list of map entry objects, where each entry has a "key" attribute (whose value is the key) and a "value" attribute (whose value is the value). Defaults to false, in which case the thread context map is included as a simple map of key-value pairs.
appender.json.layout.propertiesAsList = false
appender.json.filter.threshold.type = ThresholdFilter
appender.json.filter.threshold.level = info


# ----------------- common logs -----------------
appender.console.type = Console
appender.console.name = stderr
appender.console.target = "SYSTEM_ERR"
appender.console.layout.type = PatternLayout
appender.console.layout.pattern = %d{yyyy-MM-dd HH:mm:ss.sss} %c{10} %level %m
appender.console.filter.threshold.type = ThresholdFilter
appender.console.filter.threshold.level = error

# ----------------- rolling file logs -----------------
appender.rolling.type = RollingFile
appender.rolling.name = rolling
appender.rolling.append = true
appender.rolling.bufferedIO = true
appender.rolling.immediateFlush = false
appender.rolling.fileName = ${filename}
appender.rolling.filePattern = target/rolling/rolling-%d{MM-dd-yy-HH-mm-ss}-%i.log.gz
appender.rolling.layout.type = PatternLayout
appender.rolling.layout.pattern = %d %p %C{1.} [%t] %m%n
appender.rolling.policies.type = Policies
appender.rolling.policies.time.type = TimeBasedTriggeringPolicy
appender.rolling.policies.time.interval = 60 * 10
appender.rolling.policies.time.modulate = true
appender.rolling.policies.size.type = SizeBasedTriggeringPolicy
appender.rolling.policies.size.size = 100MB
appender.rolling.strategy.type = DefaultRolloverStrategy
appender.rolling.strategy.max = 5
appender.rolling.filter.threshold.type = ThresholdFilter
appender.rolling.filter.threshold.level = debug

# ---------------------------------------------------
# ------------------- 启用 loggers -------------------
# ---------------------------------------------------

rootLogger.level = info
# `*.appenderRef.*.ref`通过`appender.*.name`指定前面定义好的 appender
rootLogger.appenderRef.stdout.ref = stdout
# 可以指定多个，保证`appenderRef`和`ref`之间的部分不冲突即可
rootLogger.appenderRef.stderr.ref = stderr
rootLogger.appenderRef.rolling.ref = rolling
```

### 使用
```java
package com.rich;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.message.ObjectMessage;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

public class LogGenerator {

    private final static Logger logger = LogManager.getLogger(LogGenerator.class);

    public static void main(String[] args) {
        nestedJsonLogs();
    }

    public static void nestedJsonLogs() {
        while (true) {
            // 输出 debug 信息到 rolling file
            logger.debug("debug log zzzz");

            // 输出异常栈信息到 stderr
            StringWriter sw = new StringWriter();
            PrintWriter pw = new PrintWriter(sw);
            try {
                throw new IllegalArgumentException("error log qqq");
            } catch (Exception e) {
                e.printStackTrace(pw);
                logger.error(sw.toString());
            }

            // 输出完整的 json 格式数据
            Map<String, String> map = new HashMap<String, String>();
            map.put("name", "张三");
            map.put("age", "24");
            map.put("province", "山东");
            map.put("girlfriend", "唐六");
            ObjectMessage msg = new ObjectMessage(map);
            logger.info(msg);

            // 日志不要太快
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

}
```