---
layout: post
title: Spring Cloud Kubernetes
tag: JavaWeb
---

## Reference
* **[为什么 Kubernetes 天然适合微服务？](https://juejin.im/post/5ad4403af265da23766bc0aa)**，这篇文章讲的非常好强烈推荐
* [Spring Cloud Kubernetes](https://cloud.spring.io/spring-cloud-static/spring-cloud-kubernetes/1.1.2.RELEASE/reference/html/)
* [spring-cloud-kubernetes官方demo运行实战](https://blog.csdn.net/boling_cavalry/article/details/91346780)

## Starters
```xml
<!-- 
It contains 3 dependencies:
    1. 服务发现：spring-cloud-starter-kubernetes
       Discovery Client implementation that resolves service names to Kubernetes Services.
    2. 配置中心：spring-cloud-starter-kubernetes-config: 
       Load application properties from Kubernetes ConfigMaps and Secrets. Reload application properties when a ConfigMap or Secret changes.
    3. 负载均衡：spring-cloud-starter-kubernetes-ribbon: 
       Ribbon client-side load balancer with server list obtained from Kubernetes Endpoints.
 -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-kubernetes-all</artifactId>
</dependency>
```

## Exceptions
### Configured service account doesn't have access
```console
Failure executing: GET at: https://10.43.0.1/api/v1/services. Message: Forbidden!Configured service account doesn't have access. Service account may have been revoked. services is forbidden: User \"system:serviceaccount:dlink-test:default\" cannot list services at the cluster scope.
```
报错信息中可以看到 User`system:serviceaccount:dlink-test:default`没有访问权限，因为没有额外指定 serviceaccount 所以默认使用的`namespace=dlink-test`下的`default`serviceaccount

Spring Cloud Kubernetes Discovery 需要访问API的权限，创建一个拥有权限的角色
```yaml
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: discovery-role
rules:
  - apiGroups: [""]
    resources: ["services", "pods", "configmaps", "endpoints"]
    verbs: ["get", "watch", "list"]
```

在`namespace=dlink-test`创建一个名为`dlink-test`的 ServiceAccount
```shell
$ kubectl create serviceaccount dlink-test --namespace=dlink-test

# 查看所有的 service account
$ kubectl get serviceaccount
NAME         SECRETS   AGE
default      1         61d
dlink-test   1         61d
```

将 ClusterRole 绑定到刚刚创建的 ServiceAccount
```yaml
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: discovery-role-bind
subjects:
  # 指定要绑定角色的 Account 列表
  - kind: ServiceAccount
    name: dlink-test
    namespace: dlink-test
roleRef:
  kind: ClusterRole
  name: discovery-role
  apiGroup: rbac.authorization.k8s.io
```

修改 Deployment，指定 ServiceAccount
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  ...
spec:
  ...
  template:
    ...
    # 注意不要放错位置，在 template 下
    spec:
      serviceAccount: dlink-test
      serviceAccountName: dlink-test
      ...
```

重新发布一下
```shell
$ kubectl apply -f ~/dlink-metadata-test.yml
```

