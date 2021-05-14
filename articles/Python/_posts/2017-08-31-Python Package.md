---
layout: post
title: Python Package
tag: Python
---

## Create venv
```shell
# 安装 python 开发依赖，避免安装依赖时出现类似 command 'x86_64-linux-gnu-gcc' failed 的错误
$ sudo apt install python3.8-pip python3.8-dev build-essential libssl-dev libffi-dev python3.8-setuptools
# 安装 venv 配置包
$ sudo apt install python3.8-venv
# 创建项目
$ mkdir ~/myproject && cd ~/myproject
# 初始化 venv 到 myprojectenv 文件夹
$ python3.8 -m venv myprojectenv
# 激活
$ source myprojectenv/bin/activate
(myprojectenv)user@host:~/myproject$
```

## requirements
生成 requirements.txt
```shell
# pip 的 freeze 命令保存了保存当前Python环境下所有类库包，其它包括那些你没有在当前项目中使用的类库。 （如果你没有用 virtualenv ）。
$ pip freeze > requirements.txt

# 但有时你只想将当前项目使用的类库导出生成为 requirements.txt；
$ pip install pipreqs
# pipreqs 加上当前路径即可
$ pipreqs .

# 或者
$ pip-compile --output-file=requirements.txt setup.py
```

安装依赖
```shell
$ pip install -r requirements.txt
```

## 依赖包搜索路径
Python的依赖包搜索路径其实是一个列表，在import模块（Module）时，Python会先去搜索这个列表中的路，如果路径中存在要导入的模块文件，导入成功，否则就会出现`ImportError`

### 查看当前的Python搜索路径
```python
import sys
print(sys.path)
```
### 将自己写的模块加入到Python默认的搜索路径中
1. 代码实现
```python
import sys
sys.path.append('/home/neu/python/flights/flights')
```
2. 在python安装包中添加路径文件
查看python安装路径
```shell
which python
```
即在`/usr/local/lib/python2.7/dist-packages`下添加一个路径文件，例如`customPath.pth`，添加如下
```shell
/home/neu/python/flights/flights
```
**文件必须以`.pth`结尾**

### 安装依赖
```shell
# -i 指定镜像源
# -t 指定安装路径
$ pip install \
-i https://pypi.tuna.tsinghua.edu.cn/simple \
-t C:\Users\zhangqiang\IdeaProjects\airflow-dags-big\venv\Lib\site-packages \
apache-airflow==1.10.5
```


## 打包
* [Packaging Python Projects](https://packaging.python.org/tutorials/packaging-projects/)

```shell
$ python -m pip install --upgrade build
# 会在 dist 目录下生成 .tar 和 .whl 文件
$ python -m build
# 安装 whl 文件
$ pip install *.whl
```