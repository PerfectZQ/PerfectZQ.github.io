---
layout: post
title: Levenshtein 距离
tag:  Algorithm
---

## 概念
　　Levenshtein 距离，又叫编辑距离(Edit Distance)，指从一个字符串转成另一个字符串所需要最少编辑次数。编辑距离越大，说明两个字符串越不相似。编辑操作包括插入、删除、替换字符。

　　举个例子：sitting -> kitten
```console
kitting  (s -> k)
kitteng  (i -> e)
kitten   ( <- g)
```

　　相似度计算公式为`1 - editDistance / Math.max(str1.length, str2.length)`

　　sitting 和 kitten 两个字符串的编辑距离为3。相似度为`1-3/Math.max(6,7)`，`4/7`。
## 主要应用领域
* DNA序列分析
* 拼音检查
* 语音辨识
* 抄袭侦测
* 字符串近似搜索

## 算法
　　定义函数`edit(n,m)`，计算长度为`n`的字符串`str1`和长度为`m`的字符串`str2`的编辑距离。

　　通过动态规划将问题分解为3个部分。
1. `if(n == 0) edit(n,m) = m`
2. `if(m == 0) edit(n,m) = n`
3. `if(n > 0 && m > 0) edit(n,m) = Math.min(edit(n-1,j)+1, edit(n,m-1)+1, edit(n-1,m-1)+f(n,m) )`，其中`f(n,m)`的值取决于`str1`的第`n`个字符是否等于`str2`的第`m`个字符，如果相等，则为`0`，反之为`1`。

　　图解：首先初始化一个`(n+1)*(m+1)`的矩阵，以`str1="sitting"`和`str2="kitten"`为例，构造一个`8*7`的矩阵如下。
![有帮助的截图]({{ site.url }}/assets/levenshtein1.PNG)
　　根据蓝色部分，`edit(1,1) = Math.min(edit(0,1)+1, edit(1,0)+1, edit(0,0)+f(1,1)) = 1`。
![有帮助的截图]({{ site.url }}/assets/levenshtein2.PNG)
　　依此类推，直到计算到`edit(n,m)`。
![有帮助的截图]({{ site.url }}/assets/levenshtein3.PNG)