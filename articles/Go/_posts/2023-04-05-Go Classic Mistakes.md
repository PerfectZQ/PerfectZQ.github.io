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
> 这其实是因为协程闭包里面引用的是变量 batchFiles 的**内存地址**，即 `&batchFiles`，当协程启动后，协程内的代码可能还没有执行，for 循环就已经执行过多次循环了，也就是 `&batchFiles` 中的数据已经变化过好几次了，导致协程真正执行的时候可能只拿到了最后一次循环的数据

> 先验知识: Golang 里面只有值传递，所谓"引用传递"也不过是传递了指针的地址值，实际上还是值传递，和 Java 一样

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
		    // 闭包 = 函数 + 环境(引用函数外的相关变量..)
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

实际输出
```
common_test.go:15: Common - i_0: 0xc000c029b8, e_A:, 0xc000581820, tmp_A: 0xc000581830
common_test.go:15: Common - i_1: 0xc000c029b8, e_B:, 0xc000581820, tmp_B: 0xc000581890
common_test.go:15: Common - i_2: 0xc000c029b8, e_C:, 0xc000581820, tmp_C: 0xc0005818f0
common_test.go:17: GoClosure - i_1: 0xc000c029b8, e_B:, 0xc000581820, tmp_A: 0xc000581830
common_test.go:25: GoParam - i_2: 0xc000c029b8, e_C:, 0xc000581820, param_C: 0xc000581950
common_test.go:17: GoClosure - i_2: 0xc000c029b8, e_C:, 0xc000581820, tmp_C: 0xc0005818f0
common_test.go:17: GoClosure - i_2: 0xc000c029b8, e_C:, 0xc000581820, tmp_B: 0xc000581890
common_test.go:25: GoParam - i_2: 0xc000c029b8, e_C:, 0xc000581820, param_A: 0xc00018a010
common_test.go:25: GoParam - i_2: 0xc000c029b8, e_C:, 0xc000581820, param_B: 0xc00010e2b0
```

分组格式化输出
```
# 可以看到 for 声明的变量 i 和 e 的内存地址没有发生过变化，而 tmp_* 变量每次都会初始化一块新的内存存储数据
common_test.go:15: Common - i_0: 0xc000c029b8, e_A:, 0xc000581820, tmp_A: 0xc000581830
common_test.go:15: Common - i_1: 0xc000c029b8, e_B:, 0xc000581820, tmp_B: 0xc000581890
common_test.go:15: Common - i_2: 0xc000c029b8, e_C:, 0xc000581820, tmp_C: 0xc0005818f0

# 闭包内 tmp 变量指向的内存中的数据没有发生过变化，所以可以正常输出 A,B,C
# 而 i, e 变量只拿到了后两次循环的值 1,2 和 B,C
common_test.go:17: GoClosure - i_1: 0xc000c029b8, e_B:, 0xc000581820, tmp_A: 0xc000581830
common_test.go:17: GoClosure - i_2: 0xc000c029b8, e_C:, 0xc000581820, tmp_C: 0xc0005818f0
common_test.go:17: GoClosure - i_2: 0xc000c029b8, e_C:, 0xc000581820, tmp_B: 0xc000581890

# 形参也是值传递，将 string A,B,C 的值赋值给了行参变量 param，开辟了新的内存空间，所以这种也没问题
# 而 i, e 变量只拿到了最后一次循环的值 2 和 C
common_test.go:25: GoParam - i_2: 0xc000c029b8, e_C:, 0xc000581820, param_C: 0xc000581950
common_test.go:25: GoParam - i_2: 0xc000c029b8, e_C:, 0xc000581820, param_A: 0xc00018a010
common_test.go:25: GoParam - i_2: 0xc000c029b8, e_C:, 0xc000581820, param_B: 0xc00010e2b0
```

测试指针类型
```golang
type Person struct {
	Name string
}

func TestCommonPtr(t *testing.T) {
	a := &Person{Name: "A"}
	t.Logf("Person_A - arg_loc(实参地址): %p, var_loc(变量地址): %p", a, &a)
	b := &Person{Name: "B"}
	t.Logf("Person_B - arg_loc(实参地址): %p, var_loc(变量地址): %p", b, &b)
	c := &Person{Name: "C"}
	t.Logf("Person_C - arg_loc(实参地址): %p, var_loc(变量地址): %p", c, &c)

	elems := []*Person{a, b, c}
	wg := sync.WaitGroup{}
	wg.Add(len(elems))
	for i, e := range elems {
		// 形参
		go func(param *Person) {
			// Parameter 是形参，在函数定义时放在小括号里，占位使用
			// Argument 是实参，在函数调用时放在小括号里
			// 其实，形参的原本英文是 Formal Parameter, 实参的原本英文是 Actual Argument
			t.Logf("GoParam - i_%v: %v, e_%v: %v, value: %v arg_loc(实参地址): %p, param_loc(形参地址): %v", i, &i, e, &e, param, param, &param)
			wg.Done()
		}(e)
	}
	wg.Wait()
}
```

输出
```
common_test.go:55: Person_A - arg_loc(实参地址): 0xc000308d30, var_loc(变量地址): 0xc0004beb30
common_test.go:57: Person_B - arg_loc(实参地址): 0xc000308dc0, var_loc(变量地址): 0xc0004beb38
common_test.go:59: Person_C - arg_loc(实参地址): 0xc000308e60, var_loc(变量地址): 0xc0004beb40
common_test.go:70: GoParam - i_2: 0xc000c069f0, e_&{C}: 0xc0004beb48, value: &{C} arg_loc(实参地址): 0xc000308e60, param_loc(形参地址): 0xc0004beb50
common_test.go:70: GoParam - i_2: 0xc000c069f0, e_&{C}: 0xc0004beb48, value: &{A} arg_loc(实参地址): 0xc000308d30, param_loc(形参地址): 0xc00033e010
common_test.go:70: GoParam - i_2: 0xc000c069f0, e_&{C}: 0xc0004beb48, value: &{B} arg_loc(实参地址): 0xc000308dc0, param_loc(形参地址): 0xc000010028
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
