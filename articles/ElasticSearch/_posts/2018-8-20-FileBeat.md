---
layout: post
title: FileBeat
tag: ElasticSearch
---
## 原理
FileBeat 由两个重要的组件构成，`inputs`和`harvesters`，这两个组件从尾部读取数据，然后将数据发送到指定的`outputs`

### harvesters
`harvesters`负责逐行读取单个文件的内容，并将读取的数据发送到`output`。每个文件都会启动一个`harvesters`，并由`harvesters`负责打开和关闭文件。由于文件描述符在`harvesters`运行时会一直保持在打开状态，因此，如果文件在被收集时被删除或者重命名，FileBeat 仍然会读取该文件，即在`harvesters`被关闭之前，磁盘上的空间仍然被`harvesters`占用着。默认情况下，FileBeat 会保持文件处于打开状态，直到达到`close_inactive`。

* 如果文件在被`harvesters`读取文件时删除，关闭文件处理程序才会释放底层资源。
* 关闭`harvesters`后，只有在`scan_frequency`(指定扫描目录中文件的频率,[details](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-input-log.html#filebeat-input-log-scan-frequency))结束后才会再次启动文件的收集。
* 如果在`harvesters`关闭时移动或移除文件，则不会继续收集文件。

使用`close_ *`配置选项控制`harvesters`何时关闭。

### inputs
`input`负责管理`harvesters`并查找所有要读取的源。

例如输入类型时`log`，则`input`会查找磁盘上所有能匹配上的文件，并为每个文件启动`harvester`。

FileBeat 目前支持多种输入类型。每种输入类型都可以定义多次。日志输入检查每个文件以查看是否需要启动收集器，是否已经运行，或者是否可以忽略该文件（参考[ignore_older](https://www.elastic.co/guide/en/beats/FileBeat/current/FileBeat-input-log.html#FileBeat-input-log-ignore-older)）。如果自`harvesters`关闭后文件的大小发生变化，则只会收集新行。

FileBeat 会保存每个文件的状态，并经常将状态刷新到磁盘中的注册表文件。状态用于记住`harvester`正在读取的最后一个偏移量并确保发送所有日志行。如果无法访问`output`(Elasticsearch/Logstash)，FileBeat 会跟踪发送的最后一行，并在`output`再次可用时继续读取文件。在 FileBeat 运行时，状态信息也会保存在内存中。重新启动 FileBeat 时，会读取注册表文件的数据来重建状态，FileBeat 会在最后一个已知位置继续运行每个收集器。

对于每个`input`，FileBeat 保存它找到的每个文件的状态。由于可以重命名或移动文件，因此文件名和路径不足以标识文件。对于每个文件，FileBeat 存储唯一标识符以检测先前是否读取过文件。

FileBeat 保证事件将至少一次(At least once)传递到配置的`output`，并且不会丢失数据。 FileBeat 能够实现此行为，因为它将每个事件的传递状态存储在注册表文件中。在已定义的`output`被阻止且尚未确认所有事件的情况下，FileBeat 将继续尝试发送事件，直到`output`确认已收到事件。如果 FileBeat 在发送事件的过程中关闭，它不会等待`output`确认所有事件。重新启动 FileBeat 时，将再次发送所有已经发送到`output`但在 FileBeat 关闭之前未确认的事件，确保每个事件至少发送一次，但最终可能会将重复事件发送到输出。可以通过设置`shutdown_timeout`将 FileBeat 配置为在关闭之前等待特定时间。

> Note: 涉及日志轮换和旧文件的删除时，FileBeat 的至少一次交付保证有一个限制。如果日志文件写入磁盘的速度超过 FileBeat 可以处理的速度，或者在`output`不可用时删除文件，数据有可能会丢失。在 Linux 上，FileBeat 也可能因为 inode 重用而跳过行。

[FileBeat input 所有 input 配置项介绍](https://www.elastic.co/guide/en/beats/filebeat/current/configuration-filebeat-options.html)

[FileBeat input log input 相关配置项介绍](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-input-log.html)


## 安装
注意安装换对应平台的 FileBeat，以防出现`can not exec bianary file`的异常

[FileBeat 目录结构](https://www.elastic.co/guide/en/beats/FileBeat/current/directory-layout.html)

## 启动
```shell
# 运行 FileBeats
# -e 日志输出到 stderr 并禁用 syslog/file 输出
# -c 指定配置文件
# -d 启用对指定选择器的调试，publish 可以看到完整的 event 信息
sudo nohup filebeat -e -c filebeat.yml -d "publish" >filebeat.log 2>&1 &

# FileBeat 会在注册表中存储每个文件收集的状态，
# 想强制 FileBeat 从日志的最开始重新读取，可以直接删除注册表文件
sudo rm data/registry
# deb/rpm 安装路径
sudo rm /var/lib/filebeat/registry

# 查看 filebeat 运行日志，发送的事件格式
tail -100f /var/log/filebeat/filebeat
```

## 配置文件格式
[Config file format](https://www.elastic.co/guide/en/beats/libbeat/6.4/config-file-format.html)

[YAML](http://yaml.org/)

## filebeat.yml 各配置项详细介绍
[Configure filebeat.yml](https://arch-long.cn/articles/elasticsearch/FileBeat-Configuration.html)

## Filter and enhance the exported data
由 filebeat 导出的数据，你可能希望过滤掉一些数据并增强一些数据(比如添加一些额外的 metadata)。filebeat提供了一系列的工具来做这些事。

下面简单介绍一些方法，详细的可以参考[Filter and enhance the exported data](https://www.elastic.co/guide/en/beats/filebeat/current/filtering-and-enhancing-data.html)

### Processors
在将 event 发送到 output 之前，你可以在配置文件中[define processors](https://www.elastic.co/guide/en/beats/filebeat/current/defining-processors.html)去处理 event。processor 可以完成下面的任务：

* 减少导出的字段
* 添加其他的 metadata
* 执行额外的处理和解码

每个 processor 会接收一个 event，将一些定义好的行为应用到 event，然后返回 event，如果你在配置文件中定义了一系列 processors，那么他会按定义的顺序依次执行。

### Add Kubernetes metadata
除了自己定义 processor 之外，filebeat 还提供了一些已经定义好的 processor，例如 add_kubernetes_metadata processor

add_kubernetes_metadata processor 根据 event 源自哪一个 kubernetes pod，使用相关 metadata 为每个 event 添加 annotations，包括：

* Pod Name
* Pod UID
* Namespace
* Labels

`add_kubernetes_metadata`processor 有两个基本构建块。`Indexers`和`Matchers`。

`Indexers` 接收pod元数据并根据pod元数据构建索引。例如：`ip_port`indexer可以使用kubernetes pod并根据所有`pod_ip:container_port`组合、索引元数据。

`Matchers` 用于构造查询索引的查找键。例如：当字段匹配器将`["metricset.host"]`作为查找字段时，它将用字段`metricset.host`的值构造一个查找键。

每个 Beat 都可以定义自己的默认`Indexers`和`Matchers`，新定义的`Indexers`和`Matchers`默认是开启的。例如启用`container`indexer，它会根据所有containerID索引pod元数据，以及`logs_path`matcher，它接收source filed，提取container ID，并使用它来检索元数据。

让 filebeat 作为 Kubernetes 中的 pod运行：
```yaml
processors:
- add_kubernetes_metadata:
    in_cluster: true
```

让 filebeat 作为 Kubernetes Node 上的进程运行：
```yaml
processors:
- add_kubernetes_metadata:
    in_cluster: false
    host: <hostname>
    kube_config: ${HOME}/.kube/config
```

禁用默认的`Indexers`和`Matchers`，并启用感兴趣的`Indexers`和`Matchers`。
```yaml
processors:
- add_kubernetes_metadata:
    in_cluster: false
    host: <hostname>
    kube_config: ~/.kube/config
    default_indexers.enabled: false
    default_matchers.enabled: false
    indexers:
      - ip_port:
    matchers:
      - fields:
          lookup_fields: ["metricset.host"]
```

举个栗子：
```yaml
- add_kubernetes_metadata:
          in_cluster: true
          include_labels:
            - app
            - k8s-app
            - k8s-ns
          include_annotations:
            - k8s.cloud/controller-kind
          matchers:
            - logs_path:
                logs_path: /var/log/containers
```

输出结果
```json
{
        "@timestamp": "2018-07-23T07:18:59.712Z",
        "@metadata": {
            "beat": "filebeat",
            "type": "doc",
            "version": "6.3.0"
        },
        "source": "/var/log/containers/infra-wayne-7b6786958f-tcsxk_default_wayne-a5113b31cd75d50fc93ae48ecf7c790e100c91f5fbe12850e465dd2de3d2282c.log",
        "offset": 74902,
        "log": "\u001b[0m\n",
        "stream": "stdout",
        "type": "k8s-log",
        "cluster": "shbt",
        "hostname": "docker4081",
        "prospector": {
            "type": "log"
        },
        "input": {
            "type": "log"
        },
        "kubernetes": {
            "container": {
                "name": "wayne"
            },
            "pod": {
                "name": "infra-wayne-7b6786958f-tcsxk"
            },
            "node": {
                "name": "docker4081"
            },
            "namespace": "default",
            "labels": {
                "k8s-app": "infra",
                "k8s-ns": "infra",
                "app": "infra-wayne"
            },
            "annotations": {
                "k8s": {
                    "cloud/controller-kind": "deployment"
                }
            }
        },
        "host": {
            "name": "kube-filebeat-wn2w6"
        },
        "time": "2018-07-23T07:18:58.099250606Z"
    }
```

其中`k8s.cloud/controller-kind`是在Pod Template 的 annotation中添加的。

这样我们可以得到以下信息，PodName、ContainerName、AppName、Namespace和ControllerKind，以便于日志分析。

更加详细的内容可以参考[add kubernetes metadata](https://www.elastic.co/guide/en/beats/filebeat/current/add-kubernetes-metadata.html)

## Manage Multiline Message
FileBeat 默认是一行一行的处理日志的，但是对于类似 Java 异常栈这种多行的 message 怎么处理呢？这就需要配置`filebeat.yml`中的`multiline`去指出哪些行是属于同一事件。

> Note: Logstash 中使用 Logstash multiline codec 实现多行事件处理可能会导致流和损坏数据的混合。因此尽量在事件数据发送到 Logstash 之前先处理多行事件。

[examples of configuring multiline message](https://www.elastic.co/guide/en/beats/filebeat/current/multiline-examples.html)

* `multiline.pattern`: 正则表达式，用于匹配行
* `multiline.negate`: `true`或`false`，匹配或不匹配，默认是 false。
* `multiline.match`: `before`或者`after`。

例如：
```shell
# 将匹配的行添加到不匹配的行后面，例如：
# a
# b
# b
multiline.pattern: ^b
multiline.negate: false
multiline.match: after

# 将匹配的行添加到不匹配的行前面，例如：
# b
# b
# a
multiline.pattern: ^b
multiline.negate: false
multiline.match: before

# 将不匹配的行添加到匹配的行后面，例如：
# b
# a
# a
multiline.pattern: ^b
multiline.negate: true
multiline.match: after

# 将不匹配的行添加到匹配的行前面，例如：
# a
# a
# b
multiline.pattern: ^b
multiline.negate: true
multiline.match: before
```

## Filebeat input - docker

注意 Filebeat 6.3+ 才有这个插件，并且这个插件目前只是实验性的，未来可能会完全更改或者删除，酌情使用。[reference](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-input-docker.html#filebeat-input-docker)

```shell
filebeat.inputs:
- type: docker
  containers.ids: 
    - '28b843cc25a683a4add4d911127d1aaa3326d9620c49f838ac03dfa477af14de'
```

注意`containers.ids`必须是完全的`id`，而`docker ps`命令显示的`container.id`是省略的`id`。因为这个插件会默认读取`${containers.path}/${containers.ids}/*.log`

```shell
less /var/log/filebeat/filebeat
:/Configured paths
```

![有帮助的截图]({{ site.url }}/assets/filebeat-docker1.png)

`containers.path`默认为`/var/lib/docker/containers`，即 docker 默认镜像存储的位置。让我们进目录看一下

![有帮助的截图]({{ site.url }}/assets/filebeat-docker2.png)

了解了原理之后，docker 插件同样的可以使用 log 插件实现，方式如下：
```yaml
filebeat.prospectors:
- type: log
  paths:
   - '/var/lib/docker/containers/*/*.log'
  json.message_key: log
  json.keys_under_root: true
  processors:
  - add_docker_metadata: ~
```

## Filebeat output - logstash
如果要使用 Logstash 对 FileBeat 收集的数据执行其他处理，首先需要配置`filebeat.yml`中的`output.logstash`，并注释掉`output.elasticsearch`。
```shell
vim /etc/FileBeat/filebeat.yml
FileBeat.prospectors:
- type: log
  paths:
    - /var/lib/logstash-tutorial.log 
output.logstash:
  hosts: ["hostname:5044"]

# 注意需要将 output.elasticsearch 注释掉
```

发送到 Logstash 的每个事件都包含一些元数据字段(metadata)，这样就可以在 Logstash 中使用这些字段进行索引或者过滤。

除了元数据字段之外，如果还想添加额外的自定义的信息给`output`，可以使用`fields`，这样`output`就可以更方便的通过字段过滤或者区分日志。字段可以是标量值，数组，字典或这些的任何嵌套组合。 默认情况下，在此处指定的字段会被分组到`output`文档中`fields`的下一级。 要将自定义字段存储为顶级字段，需要将`fields_under_root`选项设置为`true`。 如果在常规配置中声明了重复字段，此处声明的值优先级更高。
                                   
```yaml
filebeat.prospectors:
- type: log
  enabled: true
  paths:
    - /var/log/hadoop-yarn/hadoop-cmf-yarn-NODEMANAGER-cdh1.log.out
  fields:
    topic_id: yarn_log
- type: log
  enabled: true
  paths:
    - /var/log/spark2/spark2-history-server-cdh1.log
  fields:
    topic_id: spark_log

output.logstash:
  hosts: ["cdh3:5044"]
```

FileBeat 发送给`output`的事件如下：
```shell
...
2018-08-23T11:23:25.014+0800    DEBUG   [publish]       pipeline/processor.go:275       Publish event: {
  "@timestamp": "2018-08-23T03:23:25.014Z",
  "@metadata": {
    "beat": "filebeat",
    "type": "doc",
    "version": "6.2.3"
  },
  "beat": {
    "name": "cdh1",
    "hostname": "cdh1",
    "version": "6.2.3"
  },
  "source": "/var/log/hadoop-yarn/hadoop-cmf-yarn-NODEMANAGER-cdh1.log.out",
  "offset": 15771466,
  "message": "2018-05-31 13:13:25,414 INFO org.apache.hadoop.yarn.server.nodemanager.containermanager.logaggregation.LogAggregationService: org.apache.hadoop.yarn.server.nodemanager.containermanager.logaggregation.LogAggregationService waiting for pending aggregation during exit",
  "prospector": {
    "type": "log"
  },
  "fields": {
    "topic_id": "yarn_log"
  }
}
...
```


## Running Filebeat on Kubernetes
[official reference](https://www.elastic.co/guide/en/beats/filebeat/current/running-on-kubernetes.html)

```shell
$ curl -L -O https://raw.githubusercontent.com/elastic/beats/6.4/deploy/kubernetes/filebeat-kubernetes.yaml
```

内容如下:
```yaml
# 有些注释是我额外添加的，原始文件是没有的
---
# 定义一个`name=filebeat-config`的configMap，用于指定 filebeat output
apiVersion: v1
kind: ConfigMap
# 标准 object 的元数据
metadata:
  name: filebeat-config
  namespace: kube-system
  labels:
    k8s-app: filebeat
data:
  filebeat.yml: |-
    filebeat.config:
      inputs:
        # Mounted `filebeat-inputs` configmap:
        path: ${path.config}/inputs.d/*.yml
        # Reload inputs configs as they change:
        reload.enabled: false
      modules:
        path: ${path.config}/modules.d/*.yml
        # Reload module configs as they change:
        reload.enabled: false

    # To enable hints based autodiscover, remove `filebeat.config.inputs` configuration and uncomment this:
    #filebeat.autodiscover:
    #  providers:
    #    - type: kubernetes
    #      hints.enabled: true

    processors:
      - add_cloud_metadata:

    cloud.id: ${ELASTIC_CLOUD_ID}
    cloud.auth: ${ELASTIC_CLOUD_AUTH}

    output.elasticsearch:
      hosts: ['${ELASTICSEARCH_HOST:elasticsearch}:${ELASTICSEARCH_PORT:9200}']
      username: ${ELASTICSEARCH_USERNAME}
      password: ${ELASTICSEARCH_PASSWORD}
---
# 定义一个`name=filebeat-inputs`的configMap，用于指定 filebeat input
apiVersion: v1
kind: ConfigMap
metadata:
  name: filebeat-inputs
  namespace: kube-system
  labels:
    k8s-app: filebeat
data:
  kubernetes.yml: |-
    - type: docker
      containers.ids:
      - "*"
      processors:
        # 为每个 event 添加来自哪个 pod 的注解
        - add_kubernetes_metadata:
            # true: filebeat 将运行在 pod 中，否则以进程方式运行在节点上
            in_cluster: true
---
# 将 filebeat 配置为 DaemonSet
apiVersion: extensions/v1beta1
kind: DaemonSet
metadata:
  name: filebeat
  namespace: kube-system
  labels:
    k8s-app: filebeat
# DaemonSetSpec
spec:
  template:
    metadata:
      labels:
        k8s-app: filebeat
    # PodSpec
    spec:
      # 指定运行在当前 pod 的 Service Account
      serviceAccountName: filebeat
      # 优雅的终止pod所需要的时间，单位秒(0表示立即删除，nil表示使用默认宽限期)
      # 宽限期是向pod中运行的进程发送终止信号到进程被终止的时间。
      # 需要设置此值的时间大于你的进程的预期清理时间。默认为30秒
      terminationGracePeriodSeconds: 30
      # 配置运行在pod中的container
      containers:
      - name: filebeat
        image: docker.elastic.co/beats/filebeat:6.4.0
        # 向入口点传送的参数，如果没有设置则使用docker images 的 CMD
        args: [
          "-c", "/etc/filebeat.yml",
          "-e",
        ]
        # 配置环境变量，在其他配置里面可以通过 ${VAR} 获取到
        env:
        - name: ELASTICSEARCH_HOST
          value: elasticsearch
        - name: ELASTICSEARCH_PORT
          value: "9200"
        - name: ELASTICSEARCH_USERNAME
          value: elastic
        - name: ELASTICSEARCH_PASSWORD
          value: changeme
        - name: ELASTIC_CLOUD_ID
          value:
        - name: ELASTIC_CLOUD_AUTH
          value:
        # securityContext定义Pod或Container的权限和访问控制设置
        securityContext:
          # UID 用于运行容器进程的入口点。
          # 如果没有指定，默认为镜像指定的用户。如果`SecurityContext`和
          # `PodSecurityContext`都指定了，以`SecurityContext`为准
          runAsUser: 0
        # 分配容器所需的资源
        resources:
          # 设置允许的最大资源
          limits:
            # 内存: 可以使用的单位E、P、T、G、M、K，另外 Mi 和 M 的含义相同
            memory: 200Mi
          # 设置所需的最小资源，如果省略该配置项则默认为 limits
          requests:
            # 转换为 millicore 值并乘以100。
            # 容器每100毫秒可以使用的cpu时间总量。
            cpu: 100m
            memory: 100Mi
        # 把 volume mount 到 container 的 filesystem
        volumeMounts:
        # 将 name=`config` 的 volume mount 到 container 的 /etc/filebeat.yml，并设为只读
        - name: config
          mountPath: /etc/filebeat.yml
          readOnly: true
          # 应安装容器卷的卷内路径，默认为""(卷的根路径)
          subPath: filebeat.yml
        - name: inputs
          mountPath: /usr/share/filebeat/inputs.d
          readOnly: true
        - name: data
          mountPath: /usr/share/filebeat/data
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      # 属于该 pod 的容器可以 mount 的 volume 列表
      volumes:
      # 给 volume 取个名字
      - name: config
        # 引用一个 configMap object 填充 volume
        configMap:
          # 设置创建文件时默认的文件读写权限
          # 必须是0～0777之间的值。默认为 0644
          defaultMode: 0600
          # 要引用的 configMap object 的 name
          name: filebeat-config
      - name: varlibdockercontainers
        # 宿主机直接暴露给 container 的预先存在的文件或目录。
        hostPath:
          # 宿主机上的路径，如果是链接文件，它会找到真实的文件路径。
          path: /var/lib/docker/containers
      - name: inputs
        configMap:
          defaultMode: 0600
          name: filebeat-inputs
      # data folder stores a registry of read status for all files, so we don't send everything again on a Filebeat pod restart
      - name: data
        hostPath:
          path: /var/lib/filebeat-data
          # 默认为""，在 mount hostPath volume 之前不会执行任何检查
          # DirectoryOrCreate 代表如果给定路径中不存在，则会根据需要创建一个空目录(0755)，
          # 并与 Kubelet 具有相同的组和所有权
          # 其他的 type 参考：https://kubernetes.io/docs/concepts/storage/volumes/#hostpath
          type: DirectoryOrCreate
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRoleBinding
metadata:
  name: filebeat
# 主题包含对该角色适用的对象的引用
subjects:
- kind: ServiceAccount
  name: filebeat
  namespace: kube-system
# 只能引用全局 namespace 中的 clusterRole。如果无法解析 roleRef，则 Authorizer 一定会返回错误。
roleRef:
  kind: ClusterRole
  name: filebeat
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRole
metadata:
  name: filebeat
  labels:
    k8s-app: filebeat
# 此 ClusterRole 的所有策略规则
rules:
  # 包含 resources 的 apiGroup 的名字，如果指定了多个 apiGroup，
  # 那么对于任何一个 apiGroup 资源请求的任何操作都会允许
  # "" indicates the core API group
- apiGroups: [""]
  # 此 rule 适用的资源列表，`ResourceAll`代表所有资源
  resources:
  - namespaces
  - pods
  # 此 rule 适用的所有资源类型和属性限制的动词列表，`VerbAll`代表所有动词
  verbs:
  - get
  - watch
  - list
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: filebeat
  namespace: kube-system
  labels:
    k8s-app: filebeat
---
```

## Auto discover
当应用程序运行在容器中，对于监控系统来说，他们就变成了移动的目标。auto discover 提供 track 功能，并在发生变化时调整设置。[official reference](https://www.elastic.co/guide/en/beats/filebeat/current/configuration-autodiscover.html#_providers)

在`filebeat.yml`的`filebeat.autodiscover`部分定义一些`providers`来启用 auto discover。当运行 filebeat 时，auto discover 子系统就会开始监听服务。

### Providers
auto discover providers 会观察系统上的 event，并将这些 event 转换为具有通用格式的内部 auto discover event，这样在配置 provider template 的时候就可以获取 auto discover event 中的某些字段的值，当满足条件时就启用某些特定的配置(比如获取 docker.container.name = "my_redis" 的日志)。

一开始，filebeat 会扫描所有现有容器并为他们启动合适的配置，然后它会持续观察新的容器的开始/停止事件。
 
### Docker auto discover
Docker auto discover provider 会监视 docker containers 的开始和结束 event，然后转换成 auto discover event，每个 auto discover event 的可用字段如下。

* host
* port
* docker.container.id
* docker.container.image
* docker.container.name
* docker.container.labels

例如一个具体的 docker auto discover event 如下
```json
{
  "host": "10.4.15.9",
  "port": 6379,
  "docker": {
    "container": {
      "id": "382184ecdb385cfd5d1f1a65f78911054c8511ae009635300ac28b4fc357ce51"
      "name": "redis",
      "image": "redis:3.2.11",
      "labels": {
        "io.kubernetes.pod.namespace": "default"
        ...
      }
    }
  }
}
```

在 providers 中可以定义一组配置模版，以便在条件与事件匹配的时候应用。模版用于定义与 auto discover event 匹配的条件，以及当条件匹配成功时要执行的配置列表。

在配置模版中使用 auto discover event 的内容，可以通过`data`命名空间获取。如访问`host`字段信息：`${data.host}`会得到结果`10.4.15.9`。

下面举一个实际的例子，收集`docker.container.image`包含`redis`的所有 containers 的 docker logs

filebeat 支持`inputs`(默认)和`modules`的`templates`。
```yaml
filebeat.autodiscover:
  providers:
    - type: docker
      templates:
          # 匹配条件
        - condition:
            contains:
              docker.container.image: redis
          # 条件匹配成功时要执行的配置列表
          config:
            - type: docker
              containers.ids:
                - "${data.docker.container.id}"
              exclude_lines: ["^\\s+[\\-`('.|_]"]  # drop asciiart lines
```

如果使用`modules`，可以使用`docker input`重写`default input`
```yaml
filebeat.autodiscover:
  providers:
    - type: docker
      templates:
        - condition:
            contains:
              docker.container.image: redis
          config:
            - module: redis
              log:
                input:
                  type: docker
                  containers.ids:
                    - "${data.docker.container.id}"
```

>Note:在读取多个容器的日志的时候需要注意，例如想读取/mnt/logs/\<container_id>/*.log，下面的写法就会出现问题，它会多次重复(每个nginx container一次)读取路径下的日志
```yaml
autodiscover.providers:
  - type: docker
    templates:
      - condition.contains:
          docker.container.image: nginx
        config:
          - type: log
            paths:
              - "/mnt/logs/*/*.log"
```

>正确的写法
```yaml
autodiscover.providers:
  - type: docker
    templates:
      - condition.contains:
          docker.container.image: nginx
        config:
          - type: log
            paths:
              - "/mnt/logs/${data.docker.container.id}/*.log"
```

对于多条件的条件匹配
```yaml
filebeat.autodiscover:
  providers:
    - type: docker
      templates:
        # 多条件匹配(且), and 需要接收一个 list
        - condition.and:
            - contains: 
                docker.container.image: "**SOMETHING**"
            - not.contains:
                docker.container.image: "**SOMETHING_ELSE**"
          # 条件匹配成功时要执行的配置列表
          config:
            - type: docker
              containers.ids:
                - "${data.docker.container.id}"
              exclude_lines: ["^\\s+[\\-`('.|_]"]  # drop asciiart lines
```

### Kubernetes auto discover
Kubernetes auto discover provider 会监视 kubernetes pods 的开始、更新和结束事件，并转换成标准的 auto discover event，每个 auto discover event 的可用字段如下

* host
* port
* kubernetes.container.id
* kubernetes.container.image
* kubernetes.container.name
* kubernetes.labels
* kubernetes.namespace
* kubernetes.node.name
* kubernetes.pod.name

如果将`include_annotations`配置添加到 providers，则会将 config 中存在的注解列表添加到 event 中。例如：

```json
{
  "host": "172.17.0.21",
  "port": 9090,
  "kubernetes": {
    "container": {
      "id": "bb3a50625c01b16a88aa224779c39262a9ad14264c3034669a50cd9a90af1527",
      "image": "prom/prometheus",
      "name": "prometheus"
    },
    "labels": {
      "project": "prometheus",
      ...
    },
    "namespace": "default",
    "node": {
      "name": "minikube"
    },
    "pod": {
      "name": "prometheus-2657348378-k1pnh"
    }
  }
}
```

kubernetes provider 有如下配置项：
* in_cluster: (optional)在kubernetes客户端的集群设置中使用，默认为`true`
* host: (optional)标记filebeat运行节点的host，以防无法正确检测到。如在host network mode下运行filebeat时。
* kube_config: (optional)使用给定的配置文件作为kubernetes客户端的配置。

下面看一下具体的templates配置，如收集所有`kubernetes.namespace=kube-system`的 pods 的所有 containers 的日志
```yaml
filebeat.autodiscover:
  providers:
    - type: kubernetes
      templates:
        - condition:
            equals:
              kubernetes.namespace: kube-system
          config:
            - type: docker
              containers.ids:
                - "${data.kubernetes.container.id}"
              exclude_lines: ["^\\s+[\\-`('.|_]"]  # drop asciiart lines
```

如果使用 modules，可以使用 docker input 重写 default input
```yaml
filebeat.autodiscover:
  providers:
    - type: kubernetes
      templates:
        - condition:
            equals:
              kubernetes.container.image: "redis"
          config:
            - module: redis
              log:
                input:
                  type: docker
                  containers.ids:
                    - "${data.kubernetes.container.id}"
```

### 实战
使用 Kubernetes auto discover 进行日志收集
```yaml

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: filebeat-config
  namespace: default
  labels:
    k8s-app: filebeat
data:
  filebeat.yml: |-
    # k8s 自动发现
    # To enable hints based autodiscover, remove `filebeat.config.inputs` configuration and uncomment this:
    filebeat.autodiscover:
      providers:
        - type: kubernetes
          # 开启基于提供程序提示的自动发现，它会在kubernetes pod注释或去具有前缀co.elastic.logs的docker标签中查找提示
          # hints.enabled: true
          templates:
            - condition.and:
                - equals:
                    kubernetes.namespace: default
                - contains:
                    kubernetes.container.image: mysql
              config:
                # inputs
                - type: docker
                  containers.ids:
                    - "${data.kubernetes.container.id}"
                  fields:
                    log_type: "${data.kubernetes.container.name}"
    # filter and enhance fields
    processors:
      - add_kubernetes_metadata:
          in_cluster: true
    # config elasticsearch index template
    setup.template.name: "logs"
    setup.template.overwrite: true
    setup.template.pattern: "logs-*"
    setup.template.settings:
      index.number_of_shards: 3
      index.codec: best_compression
      # 必须启用！默认模版会把 event 信息放到 _source 字段下
      _source.enabled: true
    # 设置 elasticsearch output
    output.elasticsearch:
      hosts: ["http://192.168.51.81:9200", "http://192.168.51.82:9200"]
      index: "logs-%{[fields.log_type]}-%{+yyyy.MM.dd}"
    # =========== filebeat 运行日志 =========== 
    path.logs: /usr/share/filebeat/logs
    # =========== debug logging =========== 
    logging.level: info
    # Enable debug output for selected components，可用的选项 "beat", "publish", "service"
    logging.selectors: ["*"]
    # 可以通过 docker logs 查看 debug 日志
    # logging.to_syslog: true
    # 改为 true 启用写到指定 file 文件
    logging.to_files: true
    logging.files:
      path: /usr/share/filebeat/logs
      name: filebeat
    logging.json: false
---
apiVersion: extensions/v1beta1
kind: DaemonSet
metadata:
  name: filebeat
  namespace: default
  labels:
    k8s-app: filebeat
spec:
  template:
    metadata:
      labels:
        k8s-app: filebeat
    spec:
      # 指定运行在当前 pod 的 Service Account
      serviceAccountName: filebeat
      terminationGracePeriodSeconds: 30
      containers:
      # docker compose
      - name: filebeat
        image: 192.168.51.35:5000/filebeat:6.4.0
        args: [
          "-c", "/etc/filebeat.yml",
          "-e",
        ]
        env:
        - name: ES_HOST
          value: "192.168.51.81"
        - name: ES_PORT
          value: "9200"
        securityContext:
          runAsUser: 0
        resources:
          limits:
            memory: 200Mi
          requests:
            cpu: 100m
            memory: 100Mi
        # 将指定 volumes mount 到容器内的路径
        volumeMounts:
        - name: config
          mountPath: /etc/filebeat.yml
          readOnly: true
          subPath: filebeat.yml
        # registry 文件路径，用于记录 filebeat 读取本节点文件的 status
        - name: data
          mountPath: /usr/share/filebeat/data
        - name: logs
          mountPath: /usr/share/filebeat/logs
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      # 创建 volumes
      volumes:
      - name: config
        configMap:
          defaultMode: 0600
          name: filebeat-config
      # data folder stores a registry of read status for all files, so we don't send everything again on a Filebeat pod restart
      - name: data
        hostPath:
          path: /var/lib/filebeat-data
          type: DirectoryOrCreate
      - name: logs
        hostPath:
          path: /var/lib/filebeat-logs
          type: DirectoryOrCreate
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRoleBinding
metadata:
  name: filebeat
# 主题包含对该角色适用的对象的引用
subjects:
- kind: ServiceAccount
  name: filebeat
  namespace: default
# 只能引用全局 namespace 中的 clusterRole。如果无法解析 roleRef，则 Authorizer 一定会返回错误。
roleRef:
  kind: ClusterRole
  name: filebeat
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRole
metadata:
  name: filebeat
  labels:
    k8s-app: filebeat
# 此 ClusterRole 的所有策略规则
rules:
  # 包含 resources 的 apiGroup 的名字，如果指定了多个 apiGroup，
  # 那么对于任何一个 apiGroup 资源请求的任何操作都会允许
  # "" indicates the core API group
- apiGroups: [""]
  # 此 rule 适用的资源列表，`ResourceAll`代表所有资源
  resources:
  - namespaces
  - pods
  # 此 rule 适用的所有资源类型和属性限制的动词列表，`VerbAll`代表所有动词
  verbs:
  - get
  - watch
  - list
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: filebeat
  namespace: default
  labels:
    k8s-app: filebeat
---
```