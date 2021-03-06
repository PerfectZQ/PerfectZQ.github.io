---
layout: post
title: Python Logging
tag: Python
---

## logging 默认配置
```python
import logging  
logging.debug('debug message')  
logging.info('info message')  
logging.warning('warning message')  
logging.error('error message')  
logging.critical('critical message')  
```
输出结果
```console
WARNING:root:warning message
ERROR:root:error message
CRITICAL:root:critical message
```
默认情况下python logging 默认将输出打印到标准输出，默认日志输出级别是 WARNING，默认输出格式：日志级别:Logger名称:输出日志

logging 的日志级别：CRITICAL < ERROR < WARNING < INFO < DEBUG < NOTSET
## logging basicConfig 灵活设置logging配置

```python 
import logging

logging.basicConfig(
    # 默认level=logging.WARNING，只输出小于等于WARNING级别的日志
    level=logging.DEBUG,
    # 日志格式 Mon, 09 Oct 2017 10:45:30 log_study.py[line:19] DEBUG debug
    format='%(asctime)s %(filename)s[line:%(lineno)d] %(levelname)s %(message)s',
    datefmt='%a, %d %b %Y %H:%M:%S',
    # 输出位置，默认控制台
    filename='/tmp/test.log',
    # 默认值为'a' 追加
    filemode='w')
```
**logging basicConfig 中可以设置的参数如下：**
* level：rootLogger的日志级别
* format：指定handler使用的日志显示格式
* datefmt：日期格式
* filename：用指定文件名创建FileHandler，这样日志就会存储在指定的日志文件中
* filemode：日志写入方式，在指定了filename时使用此参数
* stream：用指定stream创建streamHandler。可以指定输出到sys.stderr、sys.stdout或者文件，默认为sys.stderr。若同时列出了filename和stream两个参数，则stream会被忽略。

**format参数中的格式化串**
* %(name)s：Logger的名字
* %(levelno)s：数字形式的日志级别
* %(levelname)s：文本形式的日志级别
* %(pathname)s：调用日志输出函数的模块的完整路径名，可能没有
* %(filename)s：调用日志输出函数的模块的文件名
* %(module)s：调用日志输出函数的模块名
* %(funcName)s：调用日志输出函数的函数名
* %(lineno)d：调用日志输出函数的语句所在的代码行
* %(created)f：当前时间，用UNIX标准的表示时间的浮点数表示
* %(relativeCreated)d：自Logger创建以来到输出日志信息时的毫秒数
* %(asctime)s：字符串形式的当前时间。默认格式是 “2003-07-08 16:49:45,896”。逗号后面的是毫秒
* %(thread)d：线程ID。可能没有
* %(threadName)s：线程名。可能没有
* %(process)d：进程ID。可能没有
* %(message)s：用户输出的消息

## logging模块级别的函数
**用于输出不同级别日志的函数:**
* logging.debug()
* logging.info()
* logging.warning()
* logging.error()
* logging.critical()

**设置logging配置的函数：**
* logging.basicConfig()：用默认的日志格式(Formatter)为日志建立一个默认的流处理器(StreamHandler)，设置基础配置(日志级别)，加到root Logger中

**获取一个logger对象：**
* logging.getLogger([name])：如果没有指定name，那么返回root Logger，返回的实例与name一一对应，相同name返回的是相同的实例。

**获取一个Formatter对象**
* logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

**获取一个Handler对象**
* logging.FileHandler('/tmp/test.log')：获取一个FileHandler对象
* logging.StreamHandler()：获取一个StreamHandler对象
## logging模块中的组件
**logging模块提供了多个组件：**
* Logger：Logger对象提供应用程序可以直接使用的接口
* Handler：将日志发送到适当的目的地
* Filter：提供过滤日志信息的方法
* Formatter：指定日志的显示内容和格式

### Logger

Logger是一个树形结构，输出信息之前都要先获取一个logger对象，如果没有显示的获取，则自动创建并使用root logger

logger = logger.getLogger()返回root logger，它应用默认的日志级别、handler和formatter。

可以通过 logger.setLevel(lev)来指定最高的显示级别，可使用的级别有（从高到低）：logging.NOTSET、logging.DEBUG、logging.INFO、logging.WARNING、logging.ERROR、logging.CRITICAL

```python
# root
logger = logging.getLogger()

# root.mylogger
logger2 = logging.getLogger('mylogger')
logger2.setLevel(logging.ERROR)

# root.mylogger.mychild1
logger3 = logging.getLogger('mylogger.child1')

# root.mylogger.mychild1.child2
logger4 = logging.getLogger('mylogger.child1.child2')
logger4.setLevel(logging.INFO)

streamHandler = logging.StreamHandler()
logger1.addHandler(streamHandler)
logger2.addHandler(streamHandler)
logger3.addHandler(streamHandler)
logger4.addHandler(streamHandler)

logger1.warn('logger1 debug message')
logger2.critical('logger2 critical message')
logger3.info('logger3 info message')
logger4.info('logger4 info message')

```
输出结果
```console
logger1 debug message
logger2 critical message
logger2 critical message
logger4 info message
logger4 info message
logger4 info message
logger4 info message
```
logger1输出一遍、logger2输出两遍、logger3没有输出、logger4输出4遍原因是什么呢？

logger1是root logger，它添加了一个streamHandler，logger2是logger1的子logger，它继承了根logger的handler，这样它就包含两个handler了，所以输出两遍日志。logger3是logger2的子logger，logger3为什么没有输出呢？正常它应该输出3遍才对。原因是logger2的level修改成了critical，logger3继承了logger2的level，所以info信息没有输出，当logger4修改了level为info之后，输出了4遍日志信息。

**logger实例与logger.getLogger(name)中的name是一一对应的，只要name一样，返回的就是同一个logger实例。**

例如: 下面的logger1和logger2就是相同的实例。
```python
import logging

logger1 = logging.getLogger('myLogger')
logger1.setLevel(logging.INFO)

logger2 = logging.getLogger('myLogger')

formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# 获取一个StreamHandler用于将日志输出到控制台
streamHandler = logging.StreamHandler()
streamHandler.setFormatter(formatter)

# 获取一个FileHandler用于将日志输出到文件
fileHandler = logging.FileHandler('/tmp/test.log')
fileHandler.setFormatter(formatter)

# 为myLogger添加handler，这样日志既会在控制台中输出，也会在文件中输出。
# 另外如果不为logger对象添加handler，会报 `No handlers could be found for logger "myLogger"` 的错。
logger1.addHandler(streamHandler)
logger1.addHandler(fileHandler)

logger1.info('message...')
logger2.info('message...')
```
输出结果格式: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`
```console
2017-10-09 14:33:21,621 - myLogger - INFO - message...
2017-10-09 14:33:21,621 - myLogger - INFO - message...
```

### Handler
Handler对象用于指定日志输出的目的地。

**Handler中常用的方法：**
* Handler.setLevel(level)：指定日志级别
* Handler.setFormatter()：设置formatter
* Handler.addFilter(filter)：添加过滤器
* Handler.removeFilter(filter)：删除过滤器

**常见的handler：**
* logging.StreamHandler：可以向类似与sys.stdout或者sys.stderr的任何文件对象(file object)输出信息
* logging.FileHandler：用于向一个文件输出日志信息
* logging.handlers.RotatingFileHandler：类似于上面的FileHandler，但是它可以管理文件大小。当文件达到一定大小之后，它会自动将当前日志文件改名，然后创建一个新的同名日志文件继续输出
* logging.handlers.TimedRotatingFileHandler：和RotatingFileHandler类似，不过，它没有通过判断文件大小来决定何时重新创建日志文件，而是间隔一定时间就自动创建新的日志文件
* logging.handlers.SocketHandler：使用TCP协议，将日志信息发送到网络。
* logging.handlers.DatagramHandler：使用UDP协议，将日志信息发送到网络。
* logging.handlers.SysLogHandler：日志输出到syslog
* logging.handlers.NTEventLogHandler：远程输出日志到Windows NT/2000/XP的事件日志 
* logging.handlers.SMTPHandler：远程输出日志到邮件地址
* logging.handlers.MemoryHandler：日志输出到内存中的制定buffer
* logging.handlers.HTTPHandler：通过"GET"或"POST"远程输出到HTTP服务器

各个handler的详细用法[click here](https://docs.python.org/2/library/logging.handlers.html#module-logging.handlers)

### Formatter
Formatter对象用来设置日志的输出内容和格式，默认的时间格式 `%Y-%m-%d %H:%M:%S`。
```python
formatter = logging.formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
fileHandler.setFormatter(formatter)
```
formatter中具体的可用参数可以参考上面的`logging basicConfig 灵活设置logging配置`章节

### Filter
只有满足过滤规则的日志才会输出。

可以为handler添加filter，所有使用此handler的logger都会生效
```python
# 只有logger名以myLogger.child1.child2为前缀的logger才会输出日志
filter = logging.filter('myLogger.child1.child2')
fileHandler.addFilter(filter)
```
也可以单独为logger添加filter
```python
logger.addFilter(filter)
```

## 除了在程序中直接设置logger属性，还可以在配置文件中配置
例如logging.conf
```properties
[loggers]  
keys=root,simpleExample  
  
[handlers]  
keys=consoleHandler  
  
[formatters]  
keys=simpleFormatter  
  
[logger_root]  
level=DEBUG  
handlers=consoleHandler  
  
[logger_simpleExample]  
level=DEBUG  
handlers=consoleHandler  
qualname=simpleExample  
propagate=0  
  
[handler_consoleHandler]  
class=StreamHandler  
level=DEBUG  
formatter=simpleFormatter  
args=(sys.stdout,)  
  
[formatter_simpleFormatter]  
format=%(asctime)s - %(name)s - %(levelname)s - %(message)s  
```
程序中应用
```python
import logging    
import logging.config    
    
logging.config.fileConfig("logging.conf")  
    
logger = logging.getLogger("simpleExample")    
    
logger.debug("debug message")    
logger.info("info message")    
logger.warn("warn message")    
logger.error("error message")    
logger.critical("critical message") 
```
## 多个模块中使用logging
logging保证在同一个python解释器中，使用相同name会返回相同的logger实例。所以当在多模块中使用时，可以在main模块中配置logging，这个配置就可以作用于多个子模块了，在子模块中直接getLogger获取logger对象就可以了。

main.py
```python
import logging    
import logging.config    
    
logging.config.fileConfig('logging.conf')    
root_logger = logging.getLogger('root')    
root_logger.debug('test root logger...')    
    
logger = logging.getLogger('main')    
logger.info('test main logger')    
```
子模块
```python
import logging     
    
logger = logging.getLogger('main.mod')    
logger.info('say something...')    
```
