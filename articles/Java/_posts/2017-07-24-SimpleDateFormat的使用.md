---
layout: post
title: SimpleDateFormat的使用
tag: Java
---

## 常用的两个方法
将字符串转换成时间类型:parse()
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

将时间类型转换成字符串:format()

```java
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.Date;

SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd");
Date currentTime = sdf.format(new Date(System.currentTimeMillis()));
```
