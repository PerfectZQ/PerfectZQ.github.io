---
layout: post
title: Golang Classic Mistakes
tag: Go
---

## loop variable captured by go func literal
### 问题还原
```golang
var batchGroups [][]*FileInfo = BatchGroup(fileInfos, batchSize)
group := new(errgroup.Group)
for batchId, batchFiles := range batchGroups {
    // 这里进入 go 协程并发执行 
    group.Go(func() error {
        ...
        // 这里直接读取 for 循环中的变量 batchFiles
        for _, file := range batchFiles {
            if !file.IsDir() && file.Size() > 0 {
                ...
                // 将文件同步写入到另一个地方
                syncFileToAnothorPlace(file)
                ...
            }
        }
        ...
    })
}
// for 循环执行完后，预期是同步 100 个文件，结果只同步了部分文件，而且也没有报错
if err := group.Wait(); err != nil {
    return err
}
```

### 问题原因
> 这其实是因为闭包协程里面引用的是变量 batchFiles 的内存地址，即 &batchFiles，当协程启动后，协程内的代码可能还没有执行，for 循环就已经执行过多次循环了，也就是 &batchFiles 中的数据已经变化过好几次了，导致协程真正执行的时候可能只拿到了最后一次循环的数据

简单验证一下
```golang
import (
	"sync"
	"testing"
)

func TestCommon(t *testing.T) {
	elems := []string{"A", "B", "C"}
	wg := sync.WaitGroup{}
	wg.Add(len(elems) * 2)
	// 循环输出，期待输出 A, B, C
	for i, e := range elems {
		// 闭包
		tmp := e
		t.Logf("Common - i_%v: %v, e_%v:, %v, tmp_%v: %v", i, &i, e, &e, tmp, &tmp)
		go func() {
			t.Logf("GoClosure - i_%v: %v, e_%v:, %v, tmp_%v: %v", i, &i, e, &e, tmp, &tmp)
			wg.Done()
		}()
		// 形参
		go func(param string) {
			// Parameter 是形参，在函数定义时放在小括号里，占位使用
			// Argument 是实参，在函数调用时放在小括号里
			// 其实，形参的原本英文是 Formal Parameter, 实参的原本英文是 Actual Argument
			t.Logf("GoParam - i_%v: %v, e_%v:, %v, param_%v: %v", i, &i, e, &e, param, &param)
			wg.Done()
		}(e)
	}
	wg.Wait()
}
```

输出
```
# 实际输出
common_test.go:15: Common - i_0: 0xc000c029b8, e_A:, 0xc000581820, tmp_A: 0xc000581830
common_test.go:15: Common - i_1: 0xc000c029b8, e_B:, 0xc000581820, tmp_B: 0xc000581890
common_test.go:15: Common - i_2: 0xc000c029b8, e_C:, 0xc000581820, tmp_C: 0xc0005818f0
common_test.go:17: GoClosure - i_1: 0xc000c029b8, e_B:, 0xc000581820, tmp_A: 0xc000581830
common_test.go:25: GoParam - i_2: 0xc000c029b8, e_C:, 0xc000581820, param_C: 0xc000581950
common_test.go:17: GoClosure - i_2: 0xc000c029b8, e_C:, 0xc000581820, tmp_C: 0xc0005818f0
common_test.go:17: GoClosure - i_2: 0xc000c029b8, e_C:, 0xc000581820, tmp_B: 0xc000581890
common_test.go:25: GoParam - i_2: 0xc000c029b8, e_C:, 0xc000581820, param_A: 0xc00018a010
common_test.go:25: GoParam - i_2: 0xc000c029b8, e_C:, 0xc000581820, param_B: 0xc00010e2b0

# 分组格式化看下

# 可以看到 for 声明的变量 i 和 e 的内存地址没有发生过变化，而 tmp_* 变量每次都会初始化一块新的内存存储数据
# Golang 里面只有值传递，闭包传递 tmp_* 参数也都是传递的指针地址
common_test.go:15: Common - i_0: 0xc000c029b8, e_A:, 0xc000581820, tmp_A: 0xc000581830
common_test.go:15: Common - i_1: 0xc000c029b8, e_B:, 0xc000581820, tmp_B: 0xc000581890
common_test.go:15: Common - i_2: 0xc000c029b8, e_C:, 0xc000581820, tmp_C: 0xc0005818f0

common_test.go:17: GoClosure - i_1: 0xc000c029b8, e_B:, 0xc000581820, tmp_A: 0xc000581830
common_test.go:17: GoClosure - i_2: 0xc000c029b8, e_C:, 0xc000581820, tmp_C: 0xc0005818f0
common_test.go:17: GoClosure - i_2: 0xc000c029b8, e_C:, 0xc000581820, tmp_B: 0xc000581890

# 形参也是值传递，将 string A,B,C 的值赋值给了行参变量 param，开辟了新的内存空间，所以这种也没问题
common_test.go:25: GoParam - i_2: 0xc000c029b8, e_C:, 0xc000581820, param_C: 0xc000581950
common_test.go:25: GoParam - i_2: 0xc000c029b8, e_C:, 0xc000581820, param_A: 0xc00018a010
common_test.go:25: GoParam - i_2: 0xc000c029b8, e_C:, 0xc000581820, param_B: 0xc00010e2b0
```

### 解决方案
```golang
var batchGroups [][]*FileInfo = BatchGroup(fileInfos, batchSize)
group := new(errgroup.Group)
for batchId, batchFiles := range batchGroups {
    // fix GO loop variable captured by go func literal
    tmpBatchFiles := batchFiles
    group.Go(func() error {
        ...
        // 这里改为读取临时变量 tmpBatchFiles
        for _, file := range tmpBatchFiles {
            if !file.IsDir() && file.Size() > 0 {
                ...
                // 将文件同步写入到另一个地方
                syncFileToAnothorPlace(file)
                ...
            }
        }
        ...
    })
}
if err := group.Wait(); err != nil {
    return err
}
```
