---
layout: post
title: Kubernetes 核心概念
tag:  Kubernetes
---

[原文链接](http://www.dockone.io/article/932)

## 什么是 kubernetes
Kubernetes（k8s）是自动化容器操作的开源平台，这些操作包括部署，调度和节点集群间扩展。如果你曾经用过Docker容器技术部署容器，那么可以将Docker看成Kubernetes内部使用的低级别组件。Kubernetes不仅仅支持Docker，还支持Rocket，这是另一种容器技术。

Kubernetes可以：

* 自动化容器的部署和复制
* 随时扩展或收缩容器规模
* 将容器组织成组，并且提供容器间的负载均衡
* 很容易地升级应用程序容器的新版本
* 提供容器弹性，如果容器失效就替换它，等等...

实际上，使用Kubernetes只需一个部署文件，使用一条命令就可以部署多层容器（前端，后台等）的完整集群：
```shell
$ kubectl create -f single-config-file.yaml
```
## kubernetes cluster
![有帮助的截图]({{ site.url }}/assets/kubernetes-cluster.png)

![有帮助的截图]({{ site.url }}/assets/kubernetes-replication-controller.gif)

![有帮助的截图]({{ site.url }}/assets/kubernetes-service.gif)
