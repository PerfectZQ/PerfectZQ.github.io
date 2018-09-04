---
layout: post
title: Kubernetes 核心概念
tag:  Kubernetes
---

## 参考来源
[http://www.dockone.io/article/932](http://www.dockone.io/article/932)

[https://kubernetes.io/docs/](https://kubernetes.io/docs/)

## 什么是 kubernetes
[what is kubernetes?](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/)

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
kubernetes object 可以理解为`record of intent`，即一旦你创建了一个 object，那么 kubernetes 就会持续保证有这么一个 object 存在。并不是说这个 object 不会出问题，而是就算出问题了，kubernetes 也会新创建一个新 object，来满足你的`record of intent`。详细的可以参考[understanding kubernetes objects](https://kubernetes.io/docs/concepts/overview/working-with-objects/#understanding-kubernetes-objects)

想要操作 kubernetes object，比如创建、修改或者删除，就需要 [Kubernetes API](https://kubernetes.io/docs/concepts/overview/kubernetes-api/)，可以使用 command line，通过`kubectl`调用 API，也可以造程序里使用[Client Libraries](https://kubernetes.io/docs/reference/using-api/client-libraries/)调用 API。

每个 kubernetes object 都包含两个嵌套对象字段，用于控制对象的配置：对象规范和对象状态。您必须提供描述了对象所需状态的规范 - 对象具有的特征。状态描述对象的实际状态，由 Kubernetes 系统提供和更新。在任何给定时间，Kubernetes 控制平面都会主动管理对象的实际状态，以匹配您提供的所需状态。

例如，Kubernetes Deployment 是一个表示在群集上运行的应用程序的对象。创建 Deployment 时设置 Deployment 规范，希望该应用程序运行三个副本。 Kubernetes 系统读取 Deployment 规范并启动所需应用程序的三个实例 - 更新状态以符合 Deployment 规范。如果这些实例中的任何一个失败（状态改变），Kubernetes 系统通过进行校正来响应规范和状态之间的差异 - 在这种情况下，启动替换实例。

一般通过 API 操作 object，需要在 request body 中提供一个 JSON 用于描述你的 object spec(规范)，但大多数情况下是指定一个`.yaml`文件，`kubectl`会在请求的时候将它转换成 JSON。一个`.yaml`例子：

```yaml
# 其中 apiVersion、kind、metadata、spec 是必须的字段
apiVersion: apps/v1 # for versions before 1.9.0 use apps/v1beta2
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 2 # tells deployment to run 2 pods matching the template
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.7.9
        ports:
        - containerPort: 80
```       

每种类型 object 的规范在定义上是有区别的，比如有些 object 会包含特有的字段，所有 object 的规范格式都可以在这里找到[Kubernetes API Reference](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.11/)

可以通过下面的命令来将`.yaml`作为参数传递
```shell
$ kubectl create -f https://k8s.io/examples/application/deployment.yaml --record
```
                                                                                                                                                 
基本的 kubernetes objects 包括：[Pod](https://kubernetes.io/docs/concepts/workloads/pods/pod-overview/)、[Service](https://kubernetes.io/docs/concepts/services-networking/service/)、[Volume](https://kubernetes.io/docs/concepts/storage/volumes/)、[Namespace](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)，下面分别简单介绍下。

### Pod
Pod 是 kubernetes 最基本的构建块 - 你在 kubernetes object model 中能够创建或者发布的最小、最简单的单元。它是一个在你的集群上运行的一个进程。

Pod 封装了单个 container 或者多个紧密耦合的 containers、存储资源(a set of shared storage volumes)、一个唯一的 IP 地址和一些控制 containers 应该怎么运行的 options。启动一个 Pod，可以将其理解为：为一个给定的 Application 启动一个实例。同一个 Pod 里的多个 container 共享存储资源、共享同一个 Network Namespace，可以使用 localhost 互相通信。很少会直接在 kubernetes 中创建 Pod 实例，因为 Pod 被设计为相对短暂的一次性实体。当Pod（由您直接创建或由Controller间接创建）时，它将被安排在群集中的 Node 上运行。 Pod 保留在该节点上，除非进程终止，Pod 对象被删除，Pod 因资源不足而被驱逐，或者 Node 挂掉。

Pod 本身不会自我修复，尽管可以直接使用 Pod，但在 kubernetes 中使用 Controller 是更常见的方式，它是更高级别的抽象，用来处理和管理相对一次性的 Pod 实例。

* 如果 Pod 是短暂的，那么我怎么才能持久化容器数据使其能够跨重启而存在呢？Kubernetes 支持卷(Volume)的概念，因此可以使用持久化的卷类型。
* 是否手动创建 Pod，如果想要创建同一个容器的多份拷贝，需要一个个分别创建出来么？可以手动创建单个 Pod，但是也可以使用 Replication Controller 的 Pod 模板创建出多份拷贝，下文会详细介绍。
* 如果 Pod 是短暂的，那么重启时IP地址可能会改变，那么怎么才能从前端容器正确可靠地指向后台容器呢？这时可以使用 Service，下文会详细介绍。

### Service
假设我们创建了一组 Pod 的副本，那么在这些副本上如何进行负载均衡？答案就是 Service

如果 Pods 是短暂的，那么重启时 IP 地址可能会改变，怎么才能从前端容器正确可靠地指向后台容器呢？答案同样是 Service

Service 是定义一系列 Pod 以及访问这些 Pod 的策略的一层抽象。Service 通过 Label 找到 Pod 组。因为 Service 是抽象的，所以在图表里通常看不到它们的存在，这也就让这一概念更难以理解。

现在，假定有 2 个后台 Pod，并且定义后台 Service 的名称为`backend-service`，label 选择器为`(tier=backend, app=myapp)`。`backend-service`的 Service 会完成如下两件重要的事情：
1. 为 Service 创建一个本地集群的 DNS 入口，因此前端 Pod 只需要 DNS 解析`backend-service`就能够得到前端应用程序可用的 IP 地址。
2. 前端得到后台服务的 IP 地址后，但是它应该访问 2 个后台 Pod 的哪一个呢？Service 在这 2 个后台 Pod 之间提供透明的负载均衡，会将请求分发给其中的任意一个（如下面的动画所示）。通过每个 Node 上运行的代理（kube-proxy）完成。

![有帮助的截图]({{ site.url }}/assets/kubernetes-service.gif)

### Volume
卷

### Namespace

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


### Label and Selectors
Label 是 attach 到 Pod 的一个键/值对，用来传递用户定义的属性。比如，你可能创建了一个`tier`和`app`标签，通过Label（tier=frontend, app=myapp）来标记前端Pod容器，Label（tier=backend, app=myapp）标记后台Pod。然后可以使用 Selectors 选择带有特定 Label 的一组 Pods，并且将 Service 或者 Replication Controller 应用到匹配到的这组 Pods 上面。

## Container                                                                                                           

## kubectl
### 使用 kubectl 与kubernetes 集群交互
[安装 kubectl client](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-kubectl)

### kubectl-commands
[official reference](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands)
