---
layout: post
title: Shell Scripts
tag: Linux
---

## 特殊变量 & 语法
```shell
# shell script 本身的 pid 
$$ 
# shell script 最后运行的后台 process 的 pid 
$! 
# 最后运行的命令的结束代码(返回值)，一般来讲 0(exit 0) 代表成功结束，1和其他数值代表不同类型的失败，当然你也可以不那么定义
$? 
# 查看使用 set 命令设定的 flag 
$- 
# 所有参数列表。如"$*"用「"」括起来的情况、以"$1 $2 … $n"的形式输出所有参数。 
$* 
# 所有参数列表。如"$@"用「"」括起来的情况、以"$1" "$2" … "$n" 的形式输出所有参数。 
$@ 
# 传递给当前 shell script 的参数个数
$# 
# 当前 shell script 的文件名 
$0 
# 传递给 shell script 的各个参数
$1 ~ $n 
```
### Arrays
在数组类型的变量中，`$var`、`$var[@]`、`${var[@]`的区别，[What is the difference between ${var}, “$var”, and “${var}” in the Bash shell?](https://stackoverflow.com/questions/18135451/what-is-the-difference-between-var-var-and-var-in-the-bash-shell)
```shell
# 定义一个数组类型的变量 foo，包含三个元素 a, b, c
foo=(a b c)
# 只输出第一个元素: a
echo $foo
# 同样的也只输出第一个元素: a
echo ${foo}
# 输出: a b c
echo ${foo[@]}
# 输出: a[@]
echo $foo[@]
```

## References
* [Bash 教程 - 阮一峰](https://wangdoc.com/bash/intro.html)
* [我的 shell script 演练笔记](https://github.com/PerfectZQ/shell-scripts-learning/)