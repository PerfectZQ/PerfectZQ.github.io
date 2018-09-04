---
layout: post
title: Kubernetes 核心概念
tag:  Kubernetes
---

## 参考链接
[http://www.dockone.io/article/932](http://www.dockone.io/article/932)

[https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/)

## 什么是 kubernetes
Kubernetes（k8s）是自动化容器操作的开源平台，包括部署、调度和集群扩展。如果你曾经用过 Docker 容器技术部署容器，那么可以将 Docker 看成 Kubernetes 内部使用的低级别组件。Kubernetes 不仅仅支持 Docker，还支持 Rocket，这是另一种容器技术。

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

## Kubernetes Cluster 架构
集群是一组节点，它可以是物理服务器或者虚拟机，其上安装了 kubernetes 所需要的组件，如下图所示。

![有帮助的截图]({{ site.url }}/assets/kubernetes-cluster.png)

从上图可以看到一些比较关键的组件

* Kubernetes Master
* Replication Controller
* Service
* Node
* Pod
* Container
* Label

[kubernetes basic concepts](https://kubernetes.io/docs/concepts/)

[kubernetes components introduction](https://kubernetes.io/docs/concepts/overview/components/)

## Kubernetes Master
Kubernetes Master 是在集群中的单个节点上运行的三个进程的集合，它被指定为主节点。 这些进程是：[kube-apiserver](https://kubernetes.io/docs/admin/kube-apiserver/)，[kube-controller-manager](https://kubernetes.io/docs/admin/kube-controller-manager/) 和 [kube-scheduler](https://kubernetes.io/docs/admin/kube-scheduler/)。

### Master cluster
主节点掌控集群的通信路径主要有两条。

1. 从 API Server 到每个 Node 上都会运行的 Kubelet 进程。
2. 通过 API Server 的代理功能连到集群的任何 Node、Pod、Service。

#### apiserver to kubelet
主要用于：
* 获取 pods 的日志
* attach(通过 kubectl) 到正在运行的 pods 上
* 提供 kubelet 的端口转发功能

#### apiserver to nodes, pods and services
apiserver 通过 http 连接与 nodes, pods and services 交互

## Node
节点（上图橘色方框）是物理或者虚拟机器，作为 Kubernetes Worker，过去称为 Minion。每个节点都运行如下 Kubernetes 关键组件：
* Kubelet：与 kubernetes master 交互。
* Kube-proxy：网络代理，反射了每个节点上的 network services。

## Kubernetes Objects
[]
基本的 Kubernetes Objects 包括：[Pod](https://kubernetes.io/docs/concepts/workloads/pods/pod-overview/)、[Service](https://kubernetes.io/docs/concepts/services-networking/service/)、[Volume](https://kubernetes.io/docs/concepts/storage/volumes/)、[Namespace](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)

### Pod
Pod（上图绿色方框）安装在节点上，包含一组**容器**和**卷**。同一个 Pod 里的容器共享同一个网络命名空间，可以使用 localhost 互相通信。Pod 是短暂的，不是持续性实体。

* 如果 Pod 是短暂的，那么我怎么才能持久化容器数据使其能够跨重启而存在呢？ 是的，Kubernetes 支持卷的概念，因此可以使用持久化的卷类型。
* 是否手动创建 Pod，如果想要创建同一个容器的多份拷贝，需要一个个分别创建出来么？可以手动创建单个 Pod，但是也可以使用 Replication Controller 的 Pod 模板创建出多份拷贝，下文会详细介绍。
* 如果 Pod 是短暂的，那么重启时IP地址可能会改变，那么怎么才能从前端容器正确可靠地指向后台容器呢？这时可以使用 Service，下文会详细介绍。

### Service 
假设我们创建了一组 Pod 的副本，那么在这些副本上如何进行负载均衡？答案就是 Service

如果 Pods 是短暂的，那么重启时 IP 地址可能会改变，怎么才能从前端容器正确可靠地指向后台容器呢？答案同样是 Service

Service 是定义一系列Pod以及访问这些Pod的策略的一层抽象。Service通过Label找到Pod组。因为Service是抽象的，所以在图表里通常看不到它们的存在，这也就让这一概念更难以理解。

现在，假定有 2 个后台 Pod，并且定义后台 Service 的名称为`backend-service`，label 选择器为`(tier=backend, app=myapp)`。`backend-service`的 Service 会完成如下两件重要的事情：
1. 为 Service 创建一个本地集群的 DNS 入口，因此前端 Pod 只需要 DNS 解析`backend-service`就能够得到前端应用程序可用的 IP 地址。
2. 前端得到后台服务的 IP 地址后，但是它应该访问 2 个后台 Pod 的哪一个呢？Service 在这 2 个后台 Pod 之间提供透明的负载均衡，会将请求分发给其中的任意一个（如下面的动画所示）。通过每个 Node 上运行的代理（kube-proxy）完成。

![有帮助的截图]({{ site.url }}/assets/kubernetes-service.gif)

### Volume

### Namespace

## Container

### Label and Selectors
Label 是 attach 到 Pod 的一个键/值对，用来传递用户定义的属性。比如，你可能创建了一个`tier`和`app`标签，通过Label（tier=frontend, app=myapp）来标记前端Pod容器，Label（tier=backend, app=myapp）标记后台Pod。然后可以使用 Selectors 选择带有特定 Label 的一组 Pods，并且将 Service 或者 Replication Controller 应用到匹配到的这组 Pods 上面。

### Controllers
除此之外。kubernetes 还包含一些高级抽象，称为 Controllers。Controllers 基于基本对象构建，并提供一些便利的功能和特性如：

* [ReplicaSet](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/)
* [ReplicationController](https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller/)
* [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
* [StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
* [DaemonSet](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/)
* [Garbage Collection](https://kubernetes.io/docs/concepts/workloads/controllers/garbage-collection/)
* [Job-run to completion](https://kubernetes.io/docs/concepts/workloads/controllers/jobs-run-to-completion/)
* [CronJob](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)

#### Replication Controller
用于创建和复制 Pod，Replication Controller 确保任意时间都有指定数量的 Pod 副本在运行。如果为某个 Pod 创建了 Replication Controller 并且指定 3 个副本，它会创建3个Pod，并且持续监控它们。如果某个 Pod 不响应，那么 Replication Controller 会替换它，保持总数为 3 如下面的动画所示：

![有帮助的截图]({{ site.url }}/assets/kubernetes-replication-controller.gif)

如果之前不响应的Pod恢复了，现在就有4个Pod了，那么Replication Controller会将其中一个终止保持总数为3。如果在运行中将副本总数改为5，Replication Controller会立刻启动2个新Pod，保证总数为5。还可以按照这样的方式缩小Pod，这个特性在执行滚动升级时很有用。

当创建Replication Controller时，需要指定两个东西：

1. Pod 模板：用来创建Pod副本的模板
2. Label：Replication Controller 需要监控的 Pod 的标签。

                                                                                                                     

## kubectl
### 使用 kubectl 与kubernetes 集群交互
[安装 kubectl client](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-kubectl)

### kubectl-commands
[official reference](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands)
