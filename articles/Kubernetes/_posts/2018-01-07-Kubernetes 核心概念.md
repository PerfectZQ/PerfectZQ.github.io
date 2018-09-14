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

想要操作 kubernetes object，比如创建、修改或者删除，就需要 [Kubernetes API](https://kubernetes.io/docs/concepts/overview/kubernetes-api/)，可以使用 command line，通过`kubectl`调用 API，也可以在应用程序程序中使用[Client Libraries](https://kubernetes.io/docs/reference/using-api/client-libraries/)调用 API。另外所有的 API 公约在[API conventions doc](https://git.k8s.io/community/contributors/devel/api-conventions.md)中有详细的描述。

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
除此之外。kubernetes 还包含一些高级抽象，称为 Controllers。Controllers 基于基本对象构建，并提供一些便利的功能和特性，下面简单介绍下，详细的可以用参考官方文档。

#### ReplicaSet
[ReplicaSet](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/) 是下一代的 Replication Controller，大多数支持 Replication Controllers 的 kubectl 命令也支持 ReplicaSet。目前，他们唯一的区别就是 ReplicaSet 支持新的 set-based selector requirements，而 Replication Controller 仅支持 equality-based selector requirements。

ReplicaSet 保证在任何时候都有指定数量的 pod 副本在运行。

Deployment 是一个更高抽象的概念，它用来管理 ReplicaSet 并为 pod 提供声明式的更新以及很多其他有用的功能。因此，除非需要 custom update orchestration 或者根本不需要更新，更建议使用 Deployment 而不是直接使用 ReplicaSet。

>这实际就意味着可能永远不需要直接操作 ReplicaSet object，而是使用 Deployment，并在 spec 部分定义应用程序。

replicaSet 有这么几个替代方案，Deployment(推荐)、Bare Pods、Job、DaemonSet

#### Replication Controller
[Replication Controller](https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller/)用于创建和复制 Pod，Replication Controller 确保任意时间都有指定数量的 Pod 副本在运行。如果为某个 Pod 创建了 Replication Controller 并且指定 3 个副本，它会创建3个Pod，并且持续监控它们。如果某个 Pod 不响应，那么 Replication Controller 会替换它，保持总数为 3 如下面的动画所示：

![有帮助的截图]({{ site.url }}/assets/kubernetes-replication-controller.gif)

如果之前不响应的Pod恢复了，现在就有4个Pod了，那么Replication Controller会将其中一个终止保持总数为3。如果在运行中将副本总数改为5，Replication Controller会立刻启动2个新Pod，保证总数为5。还可以按照这样的方式缩小Pod，这个特性在执行滚动升级时很有用。

当创建Replication Controller时，需要指定两个东西：

1. Pod 模板：用来创建Pod副本的模板
2. Label：Replication Controller 需要监控的 Pod 的标签。

#### Deployment
[Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) 为 Pod 和 ReplicaSet 提供声明性更新，在 Deployment object 描述一个期望的状态，然后 Deployment controller 就会将实际的状态按照 controller rate 转换成期望的状态。你可以定义 Deployments 来创建一个新的 ReplicaSets，或者删除已经存在的 Deployments 并且用新的 Deployments 更新资源状态。

>应该操作 Deployment object 来涵盖所有的用例，而不是直接管理属于 Deployment 的 ReplicaSet

典型的常用用例

* 创建一个 deployment 来部署 replicaSet
* 通过更新 deployment object 的 spec 来声明 pods 的新状态(更新)，然后按照 controlled rate 创建一个新的 replicaSet，最后将 pods 从旧的 replicaSet 移动到新的 replicaSet，每个新的 replicaSet 都会更新 deployment 的 revision。
* 如果当前状态的 deployment 不稳定，可以回滚到之前的版本
* 扩展 deployment 以增加负载
* 暂停 deployment，将多个修改应用于 PodTemplateSpec，恢复并启动一个新的部署。
* 使用 deployment 的状态作为部署卡住的标志
* 清理不在需要的旧 replicaSet

#### StatefulSet
[StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)是 workload API object，用于管理有状态的应用程序。

>StatefulSet 在 1.9 版本开始稳定(GA - General Availability，软件通用版本)

statefulSet 管理一组 pods 的部署和扩展，并提供这些 pods 排序和唯一性的保证

与 deployment 类似，statefulSet 管理基于相同容器 spec 的 pod。不同的是，statefulSet 为其管理的每个 pod 维护一个粘性标识。这些 pod 是根据相同的 spec 创建的，但是不可以互换：每个 pod 都会保留一个持久的标识符，它可以在重新调度的时候使用。

典型的常用用例：
* 需要稳定、唯一的网络标识符
* 稳定、持久化的存储
* 有序、优雅的部署、扩展、删除和终止
* 有序的自动滚动更新

在上文中，稳定是指可跨 pod 持久性的调度/重新调度。如果应用程序不需要任何稳定标识符或者有序部署、删除或扩展，则应该使用一组无状态的副本的控制器来部署应用程序，例如 Deployment 或 ReplicaSet。 

#### DaemonSet
[DaemonSet](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/) 确保所有(或某些指定的) Node 会运行 Pod 的副本，随着 Node 添加到集群中，他会将 Pod 添加到新的 Node 中，当 Node 从集群中删除时，他也会确保 Pod 会被垃圾收集。删除 DaemonSet 会清除它所创建的 Pod。

DaemonSet 的应用场景：

* 在每个节点上运行集群存储的守护进程，如`glusterd`、`ceph`
* 在每个节点上运行日志收集守护进程，如`fluentd`、`logstash`、`filebeat`
* 在每个节点上运行节点监视的守护进程，如`Prometheus Node Exporter`、`collectd`、`Dynatrace OneAgent`、`Datadog agent`、`New Relic agent`、`Ganglia gmond`

下面写一个 DaemonSet Spec，我们先创建一个`daemonset.yaml`运行 fluentd-elasticsearch Docker image。
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd-elasticsearch
  namespace: kube-system
  labels:
    k8s-app: fluentd-logging
spec:
  selector:
    matchLabels:
      name: fluentd-elasticsearch
  template:
    metadata:
      labels:
        name: fluentd-elasticsearch
    spec:
      tolerations:
      - key: node-role.kubernetes.io/master
        effect: NoSchedule
      containers:
      - name: fluentd-elasticsearch
        image: k8s.gcr.io/fluentd-elasticsearch:1.20
        resources:
          limits:
            memory: 200Mi 
          requests:
            cpu: 100m
            memory: 200Mi
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      terminationGracePeriodSeconds: 30
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
```

#### Garbage Collection
[Garbage Collection](https://kubernetes.io/docs/concepts/workloads/controllers/garbage-collection/)

#### Job-run to completion
[Job-run to completion](https://kubernetes.io/docs/concepts/workloads/controllers/jobs-run-to-completion/)

#### CronJob
[CronJob](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)

### Label and Selectors
Label 是 attach 到 Pod 的一个键/值对，用来传递用户定义的属性。比如，你可能创建了一个`tier`和`app`标签，通过Label（tier=frontend, app=myapp）来标记前端Pod容器，Label（tier=backend, app=myapp）标记后台Pod。然后可以使用 Selectors 选择带有特定 Label 的一组 Pods，并且将 Service 或者 Replication Controller 应用到匹配到的这组 Pods 上面。

## Container                                                                                  

## kubectl
### 使用 kubectl 与kubernetes 集群交互
[安装 kubectl client](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-kubectl)

### kubectl-commands
[official reference](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands)

### kubectl yaml 配置项
[deploying applications](https://kubernetes.io/docs/user-guide/deploying-applications/)、[configuring containers](https://kubernetes.io/docs/tasks/)、[object management using kubectl](https://kubernetes.io/docs/concepts/overview/object-management-kubectl/overview/)

## kubernetes logging
[kubernetes logging architecture](https://kubernetes.io/docs/concepts/cluster-administration/logging/)

### logging at the node level
所有容器化应用程序写入`stderr`和`stdout`的所有内容都会被容器引擎处理并重定向到某个地方。例如: Docker 就会将这两个streams重定向到[logging-driver](https://docs.docker.com/config/containers/logging/configure/)，`logging-driver=json-file`将会把日志以 JSON 的格式写到`/var/lib/docker/containers`下。

但是 docker json logging driver 会按行来区分每一条日志，如果你想处理多条日志，就需要在 logging agent 作处理了。

另一个比较重要的考虑因素是实现日志轮换，以防止日志占用节点所有的存储资源。kubernetes 目前没有实现日志轮换的功能，但是 deployment tool 应该提供一个解决方案来解决这个问题。例如，`kube-up.sh`脚本部署时，有一个`logrotate`工具，可以配置为每小时运行一次；或者在运行 docker container 时指定`log-opt`。第一种方法可以用于任何其他环境，而后一种方法用于 GCP 的 COS 映像。这两种方法默认都会在日志文件超过10M的时候进行轮换。

>Note: 如果某个外部系统已经执行了轮换，则只有最新的日志文件内容可以被`kubectl logs`获得。例如：有一个10M的文件，`logrotate`执行轮转后，就会生成两个文件，一个10M，一个为空，当执行`kubectl logs`时会返回一个空的响应。

#### system component logs
系统组件的日志有两种：运行在容器中的和非运行在容器中的。例如 kubernetes scheduler 和 kube-proxy 就运行在 container 中，而 kubelet 和 docker 就不运行在 container 中。

在有`systemd`的机器上，kubelet 和 docker 会写到`journald`，如果`systemd`不可用就会写到`/var/log`目录下。在容器中的系统组件会把日志直接写在`/var/log`目录下。类似容器日志，在`/var/log`目录下的系统组件日志也会进行轮换，这些日志被`logrotate`配置为每天或者日志文件超过100M时进行轮换。

### logging at cluster level
然而 kubernetes 没有为 cluster-level logging 提供一个原生的解决方案，但是有一些通用的方法可以考虑，例如：

* 在集群的每个节点上运行一个 node-level 的 logging-agent(专门用于将日志推送到后台的工具，如`fluentd`、`logstash`、`filebeat`)
* 在 application pod 中包含一个专门用于日志收集的 sidecar container
* 在应用程序直接将日志推送到后台日志服务器

下面分别来介绍一下这三种方法

#### Using a node-level logging agent
![有帮助的截图]({{ site.url }}/assets/kubernetes-logging-with-node-agent.png)

在每个节点上创建一个有日志目录访问权限的 logging-agent，常规的实现方式

1. 使用 DamonSet Replica
2. 使用 manifest pod
3. 在节点上启动一个专门用于处理日志的原生进程。

但是后两种非常不推荐使用。另外 node-level logging agent 只能处理`standard output`和`standard error`。

#### Using a sidecar container with the logging agent
首先解释一下什么叫 sidecar，sidecar 就是与应用程序一起运行的独立进程，为应用程序提供额外的功能。更多了解可以读一下这篇关于[Service Mesh](https://m.sohu.com/a/198655597_467759/?pvid=000115_3w_a&from=timeline&isappinstalled=0)的文章。

有两种使用 sidecar container 的方式：

* sidecar container 将应用程序日志传输到自己的 stdout/stderr，我们称他为 streaming sidecar container。然后通过 logging-agent-pod 将日志发送到 logging backend。

![有帮助的截图]({{ site.url }}/assets/kubernetes-logging-with-streaming-sidecar.png)

这种方式可以将不同类型的日志进行分流，例如下面的 yaml 所示：
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: counter
spec:
  containers:
  - name: count
    image: busybox
    args:
    - /bin/sh
    - -c
    - >
      i=0;
      while true;
      do
        echo "$i: $(date)" >> /var/log/1.log;
        echo "$(date) INFO $i" >> /var/log/2.log;
        i=$((i+1));
        sleep 1;
      done
    volumeMounts:
    - name: varlog
      mountPath: /var/log
  - name: count-log-1
    image: busybox
    args: [/bin/sh, -c, 'tail -n+1 -f /var/log/1.log']
    volumeMounts:
    - name: varlog
      mountPath: /var/log
  - name: count-log-2
    image: busybox
    args: [/bin/sh, -c, 'tail -n+1 -f /var/log/2.log']
    volumeMounts:
    - name: varlog
      mountPath: /var/log
  volumes:
  - name: varlog
    emptyDir: {}
```

从上面的配置文件可以看到，application container 会输出两种类型的日志文件`/var/log/1.log`和`/var/log/2.log`。然后有两个 sidecar container 分别将两个日志文件分流到自己的 stdout 和 stderr。这样在运行这个 pod 的时候，就可以通过下面的方式单独获取某种类型的日志。

```shell
$ kubectl logs counter count-log-1
0: Mon Jan  1 00:00:00 UTC 2001
1: Mon Jan  1 00:00:01 UTC 2001
2: Mon Jan  1 00:00:02 UTC 2001
...
```

```shell
$ kubectl logs counter count-log-1
0: Mon Jan  1 00:00:00 UTC 2001
1: Mon Jan  1 00:00:01 UTC 2001
2: Mon Jan  1 00:00:02 UTC 2001
...
```

而安装在每个节点的 logging-agent-pod 会自动搜集这些日志，甚至可以直接去读取解析源容器的日志文件，然后将日志发送到 logging backend。

>需要注意的是，使用 streaming sidecar container 将日志流传输到 stdout 会使磁盘使用量增加一倍，如果只是单个的日志文件写入，最好还是直接写到`/dev/stdout`，而不是使用 streaming sidecar container。

最后 sidecar container 还可用于旋转应用程序本身无法旋转的日志文件。 这种方法的一个例子是定期运行 logrotate 的小容器。 但是，建议直接使用 stdout 和 stderr，并将循环和保留策略保留给 kubelet。

* sidecar container 运行日志记录的代理程序，该代理程序会从应用程序容器中读取日志，然后直接将日志发送到后端。
![有帮助的截图]({{ site.url }}/assets/kubernetes-logging-with-sidecar-agent.png)

如果 node level logging-agent 不够灵活，可以创建一个带有单独日志记录功能的 sidecar container，他与主应用程序一起运行。

>注意：在 sidecar container 中使用日志代理会导致大量的资源消耗，并且无法使用 kubectl logs 访问这些日志，因为他们不受 kubelet 控制。

可以使用[Stack driver](https://kubernetes.io/docs/tasks/debug-application-cluster/logging-stackdriver/)，他使用 fluentd 作为 logging agent。可以通过下面的两个配置文件实现这个方法：

第一个文件包含一个用来配置 fluentd 的[ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/)，更多关于配置 fluentd 的信息可以参考[official fluentd documentation](http://docs.fluentd.org/)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluentd.conf: |
    <source>
      type tail
      format none
      path /var/log/1.log
      pos_file /var/log/1.log.pos
      tag count.format1
    </source>

    <source>
      type tail
      format none
      path /var/log/2.log
      pos_file /var/log/2.log.pos
      tag count.format2
    </source>

    <match **>
      type google_cloud
    </match>
```

第二个文件描述了一个包含 fluentd 的 sidecar container，并且该 pod 安装了一个 fluentd 可以获取它配置数据的 volume。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: counter
spec:
  containers:
  - name: count
    image: busybox
    args:
    - /bin/sh
    - -c
    - >
      i=0;
      while true;
      do
        echo "$i: $(date)" >> /var/log/1.log;
        echo "$(date) INFO $i" >> /var/log/2.log;
        i=$((i+1));
        sleep 1;
      done
    volumeMounts:
    - name: varlog
      mountPath: /var/log
  - name: count-agent
    image: k8s.gcr.io/fluentd-gcp:1.30
    env:
    - name: FLUENTD_ARGS
      value: -c /etc/fluentd-config/fluentd.conf
    volumeMounts:
    - name: varlog
      mountPath: /var/log
    - name: config-volume
      mountPath: /etc/fluentd-config
  volumes:
  - name: varlog
    emptyDir: {}
  - name: config-volume
    configMap:
      name: fluentd-config
```

一段时间后，就可以在 stack driver 洁面中找到日志信息。这只是一个示例，实际上可以用任何 logging-agent 替代 fluentd，从应用程序 container 内的任何源读取日志。

#### Exposing logs directly from the application
![有帮助的截图]({{ site.url }}/assets/kubernetes-logging-from-application.png)

这种方式就是直接通过应用程序 container 将日志写到 logging backend，例如配置 log4j 到 kafka、redis、elasticsearch 等等。 但是这种日志机制就超出 kubernetes 的范畴了。


### 日志文件路径
kubernetes 的日志都写在`/var/log/containers`下：
```shell
ls -l /var/log/containers
总用量 68
lrwxrwxrwx 1 root root 90 9月   5 17:05 miami-group-understanding-test-67f55d4775-m4ct7_default_miami-group-understanding-test-7d57ebfab3b2590f06d2994e86e1254064e8d38c96c10d3007e4eddeb5c91178.log -> /var/log/pods/7f3ce883-acc8-11e8-b97b-00163e062f63/miami-group-understanding-test/1484.log
lrwxrwxrwx 1 root root 65 8月   2 18:19 monitoring-influxdb-6c54fbb78-fg64f_kube-system_influxdb-7cf9d0d3dca87e79a6d52eb6584c773801177a9019f80924d19b15b300ef9019.log -> /var/log/pods/3443796f-9637-11e8-9628-00163e08aadb/influxdb/1.log
lrwxrwxrwx 1 root root 65 8月   2 18:20 monitoring-influxdb-6c54fbb78-fg64f_kube-system_influxdb-a4b743d315325410e3b061c96b92c90d377831cfae89bd0126176fa882fdfd5a.log -> /var/log/pods/3443796f-9637-11e8-9628-00163e08aadb/influxdb/2.log
...
```

可以看到这里面的日志都是一些软连接，实际指向`/var/log/pods`下：
```shell
ls -l /var/log/pods/7f3ce883-acc8-11e8-b97b-00163e062f63/miami-group-understanding-test/1484.log
lrwxrwxrwx 1 root root 165 9月   5 17:05 /var/log/pods/7f3ce883-acc8-11e8-b97b-00163e062f63/miami-group-understanding-test/1484.log -> /var/lib/docker/containers/7d57ebfab3b2590f06d2994e86e1254064e8d38c96c10d3007e4eddeb5c91178/7d57ebfab3b2590f06d2994e86e1254064e8d38c96c10d3007e4eddeb5c91178-json.log
```

从上面可以看出最终实际的日志文件在`/var/lib/docker/containers`下面，实质还是 docker container 中的日志文件。

