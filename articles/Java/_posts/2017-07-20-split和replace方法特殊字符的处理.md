---
layout: post
title: 特殊字符处理异常
tag: Java
---

## 特殊字符
在字符串分割split()方法和replace()方法中，`.`字符、`|`字符以及`\`字符都是需要额外转义的特殊字符。

## 举个例子
Spark处理一批文本数据的时候，有的文本中存在`\`字符，在拼接Json字符串的时候会错误的将Json的 `"` 转义掉，这样会导致Json的解析异常，所以需要将`'\'`去掉，然后首先想到了下面的写法：

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