---
layout: post
title: Golang Generics
tag: Go
---

## Reference
* [Type Parameters Proposal](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.md#type-inference)
* [Tutorial: Getting started with generics](https://go.dev/doc/tutorial/generics)

## Example
* 版本: Golang 1.17

```golang
package main

import (
	"xxx/gopkg/lang/conv"
	"fmt"
)

// Golang 1.18 默认实现了
type any interface{}

// 泛型语法 [T1 constrain, T2 constrain]，T1 和 T2 代表泛型类型， constrain 表示类型限定

func mapIter[This any, That any](arr []This, fn func(t This) That) []That {
	result := make([]That, 0)
	for _, elem := range arr {
		result = append(result, fn(elem))
	}
	return result
}

func foreach[T any](arr []T, fn func(t T)) {
	for _, elem := range arr {
		fn(elem)
	}
}

func reduce[E any](arr []E, fn func(e1, e2 E) E) E {
	var result E
	if arr == nil || len(arr) == 0 {
		return result
	}
	result = arr[0]
	for i := 1; i < len(arr); i++ {
		result = fn(result, arr[i])
	}
	return result
}

func main() {
	arr := []string{"1", "2"}
	
	intArr := mapIter(arr, func(t string) int { return conv.IntDefault(t, 0) })
	fmt.Println(fmt.Sprintf("%T, %v", intArr, intArr))
	
	foreach(arr, func(e string) { fmt.Println(e) })
	
	fmt.Println(reduce(arr, func(e1, e2 string) string { return fmt.Sprintf("%v, %v", e1, e2) }))
}

```

运行
```shell
$ go run -gcflags=-G=3 /Users/xxx/GolandProjects/pkg/functional/map_reduce_main.go
[]int, [1 2]
1
2
1, 2
```