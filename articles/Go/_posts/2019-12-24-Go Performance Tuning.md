---
layout: post
title: Go Performance Tuning
tag: Go
---

## Reference
* [Go pprof性能调优](https://www.cnblogs.com/nickchen121/p/11517452.html)
* [gopherchina-2019 profiling](https://dave.cheney.net/high-performance-go-workshop/gopherchina-2019.html#profiling)

## 采集性能数据
GoLang 内置了获取程序运行时数据的标准库[pprof](https://pkg.go.dev/runtime/pprof#hdr-Profiling_a_Go_program)，每隔一段时间(10ms)就会收集程序的堆栈数据，记录各个函数占用内存和CPU情况，最后对这些采样数据进行分析生成报告
* [runtime/pprof](https://pkg.go.dev/runtime/pprof): 用来采集工具类的程序，只运行一次就结束。
* [net/http/pprof](https://pkg.go.dev/net/http/pprof): 用来采集服务类的程序，这种程序往往会一直运行。

> 采集性能数据最好在负载比较高的情况下进行，不然采集出的数据可能没有意义

### 工具类程序性能数据采集
```go
import (
	"github.com/dgrijalva/jwt-go"
	"os"
	"runtime/pprof"
	"testing"
)

func TestBenchmarkGenerateSignature(t *testing.T) {
	size := 1000000
	
	cpuFile, _ := os.Create("cpu_pprof")
	// 开始记录程序 CPU Profile，将采集数据写到 cpuFile
	_ = pprof.StartCPUProfile(cpuFile)
	defer pprof.StopCPUProfile()
	
	for i := 0; i < size; i++ {
		claim := &jwt.StandardClaims{
			Subject: "Product_CLoud_SLA_Test",
		}
		_, _ = myjwt.GenerateSignature(*claim)
	}
	
	memoryFile, _ := os.Create("memory_pprof")
	// 将当前的 MemoryHeap 数据写到 memoryFile
	_ = pprof.WriteHeapProfile(memoryFile)
}
```

### 服务类程序性能数据采集
```go
import "net/http/pprof"

// 注册 Handler 函数，访问相应的链接会执行相应的 Profiling，并生成 profile 文件以供下载
r.HandleFunc("/debug/pprof/", pprof.Index)
r.HandleFunc("/debug/pprof/cmdline", pprof.Cmdline)
r.HandleFunc("/debug/pprof/profile", pprof.Profile)
r.HandleFunc("/debug/pprof/symbol", pprof.Symbol)
r.HandleFunc("/debug/pprof/trace", pprof.Trace)
```

### 测试直接输出 Profile 数据
`go test`命令直接支持输出 Profile 数据，不需要写上面那些代码，上面只是为了介绍方法
```shell
$ go test -bench . -cpuprofile=./cpu.prof
$ go test -bench . -memprofile=./mem.prof
```

## 分析采集的 profile 数据
使用`go tool pprof`工具分析数据

```shell
# 查看 pprof 说明文档
$ go tool pprof

# 以指定的 format 输出分析结果
# source，必填，代表 profile 数据来源，本地文件或者 http 地址
$ go tool pprof <format> [options] [binary] <source>

# 忽略 format 进入交互式控制台
$ go tool pprof [options] [binary] <source> 
```

使用上面工具类程序性能采集数据，下面看个栗子
```shell
# 进入交互式控制台
$ go tool pprof test/cpu_pprof
Type: cpu
Time: Oct 22, 2021 at 11:46am (CST)
Duration: 5.88s, Total samples = 6.94s (118.12%)
Entering interactive mode (type "help" for commands, "o" for options)
(pprof) 
# 查看占用 cpu 最高的三个函数
# flat: 当前函数占 cpu 的耗时， flat%: 当前函数占 cpu 耗时百分比， sum% 函数累计占用 cpu 耗时百分比（函数被调用多次？）
# cum: 当前函数以及调用该函数的函数占用 cpu 的耗时， cum%: 占总耗时的百分比
(pprof) top3
Showing nodes accounting for 2070ms, 29.83% of 6940ms total
Dropped 121 nodes (cum <= 34.70ms)
Showing top 3 nodes out of 157
      flat  flat%   sum%        cum   cum%
     840ms 12.10% 12.10%      850ms 12.25%  runtime.kevent
     790ms 11.38% 23.49%      790ms 11.38%  crypto/sha256.block
     440ms  6.34% 29.83%     1290ms 18.59%  runtime.mallocgc
# 查看指定函数每行代码的耗时情况
(pprof) list TestBenchmarkGenerateSignature
Total: 6.26s
ROUTINE ======================== code.xxxx.org/eps-platform/cloud_sla/test.TestBenchmarkGenerateSignature in /Users/zhangqiang/GolandProjects/cloud_sla/test/jwt_test.go
         0      3.82s (flat, cum) 61.02% of Total
         .          .     73:
         .          .     74:   for i := 0; i < size; i++ {
         .          .     75:           claim := &jwt.StandardClaims{
         .          .     76:                   Subject: "Product_CLoud_SLA_Test",
         .          .     77:           }
         .      3.82s     78:           _, _ = myjwt.GenerateSignature(*claim)
         .          .     79:   }
         .          .     80:
         .          .     81:   memoryFile, _ := os.Create("memory_pprof")
         .          .     82:   // 将当前的 MemoryHeap 数据写到 memoryFile
         .          .     83:   _ = pprof.WriteHeapProfile(memoryFile)
```

安装图形化工具，Windows 安装自行百度，安装好后可以图形化输出分析结果
```shell
$ brew install graphviz
```

从 web 查看图形化的调用情况，执行后会自动从浏览器显示调用链的图片
```shell
$ go tool pprof test/cpu_pprof
Type: cpu
Time: Oct 22, 2021 at 11:46am (CST)
Duration: 5.88s, Total samples = 6.94s (118.12%)
Entering interactive mode (type "help" for commands, "o" for options) 
(pprof) web
```

## 生成火焰图
生成火焰图，需要事先安装 FlameGraph，FlameGraph 依赖 perl 环境支持
```shell
# 安装 perl，如果没装的话，mac 默认已经装了
$ https://www.perl.org/get.html
# 下载 FlameGraph
$ git clone https://github.com/brendangregg/FlameGraph.git
# 配置环境变量
$ echo 'PATH=$PATH:/Users/zhangqiang/Programs/FlameGraph' >> ~/.zshrc
$ source ~/.zshrc
```

Go1.11+ 之后`pprof`支持火焰图了
```shell
# 该命令会直接启动一个监听 8081 端口的 http 服务
$ go tool pprof -http=":8081" [binary] [profile]
# 访问 http://localhost:8081/ui/flamegraph 即可看到火焰图
$ go tool pprof -http=":8081" test/cpu_pprof

# 每隔 10s 输出一次采样 http://127.0.0.1:9999/ui/flamegraph
$ go tool pprof -seconds=10 -http=:9999 http://10.23.72.26:6790/debug/pprof/heap
```
