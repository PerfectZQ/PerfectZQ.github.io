---
layout: post
title: Java Design Patterns
tag: Java
---

## Builder 模式
### 参考
[Java Builder 模式,你搞懂了么?](https://juejin.im/post/5c2088205188251920598d85)

### 使用场景
当一个类的成员变量很多的时候，往往需要重载很多构造方法，这些方法一般都是特定需求的情况下指定的，可能每增加一个需求，就需要添加一种成员变量的组合重载一个新的构造方法，灵活性很差，而且调用构造方法需要传的参数非常多，而且需要按顺序传参，可读性很差。

给个眼神自己体会一下:
```java
public Car(String carBody, String tyre, String engine, String aimingCircle, String decoration) {
    this.carBody = carBody;
    this.tyre = tyre;
    this.engine = engine;
    this.aimingCircle = aimingCircle;
    this.decoration = decoration;
}

public static void main(String[] args){
    Car car = new Car("a", "b", "c", "d", "e");
}
```

这时候，就需要 Builder 模式。

## Proxy 模式

### 参考
[详解 Java 中的三种代理模式](https://mp.weixin.qq.com/s?__biz=MzI3ODcxMzQzMw==&mid=2247486759&idx=2&sn=6769d8ff9d163babe726b6213c6d15e4&chksm=eb538811dc240107bcf2a6e65b5381b2a68175af8ff12f4e2c1b0a06f7d16850db4acb64a18e&scene=21#wechat_redirect)

### 介绍
代理模式主要作用：在委托(原)对象的基础上提供额外的拓展功能。这里使用到编程中的一个思想: 不要随意去修改别人已经写好的代码或者方法，如果需改修改，可以通过代理的方式来扩展该方法。

客户端通过调用代理对象中的方法，来间接调用委托对象中的方法。在代理对象的方法中可以扩展额外的功能。

例如：一个普通人(委托对象)想打赢一场官司，但他对法律知识却知之甚少，因此需要请一个律师(代理对象)来替他打官司。

在Java中代理模式大致有三种实现方式：静态代理、动态代理、子类代理。下面分别来介绍并实现一下。
### 静态代理
使用静态代理，需要有一个接口或者父类，被委托类和代理类同时继承或实现，并且代理类需要包含委托类对象(保证委托类对象原来的功能)。

以委托人委托律师打官司为例，UML图如下：
![有帮助的截图]({{ site.url }}/assets/proxy_pattern_uml.png)

Java实现：
```java
/**
 * 委托类接口：人
 */
interface Person {
    void litigation();
}

/**
 * 委托类：案件委托人
 */
class CaseClient implements Person {

    @Override
    public void litigation() {
        System.out.println("打官司");
    }
}

/**
 * 代理类：律师
 */
class Lawyer implements Person {
    private CaseClient caseClient;

    public Lawyer(CaseClient caseClient) {
        this.caseClient = caseClient;
    }

    @Override
    public void litigation() {
        // 调用委托对象方法
        caseClient.litigation();
        // 扩展功能
        System.out.println("了解案情");
        System.out.println("收集证据");
        System.out.println("辩护");
        System.out.println("打赢官司");
    }
}

public class StaticProxyPattern {

    public static void main(String[] args) {
        // 通过调用代理对象来间接调用委托对象
        Lawyer lawyer = new Lawyer(new CaseClient());
        lawyer.litigation();
    }
}
```
从上面可以看出，对于每一个委托对象，都需要有一个委托接口，并且**需要创建一个相应的实现委托接口的代理类**。当有很多委托类的情况下，需要编写大量的实现对应接口的代理类，并且当委托类中添加新的方法时，对应的代理类也要跟着修改代码。这会造成代码臃肿

静态代理也就适用于委托类比较少的情况下。

### 动态代理
动态代理，代理类无需实现委托接口，而是通过Java反射机制，利用委托接口直接动态的在内存中生成代理对象，因此**动态代理**也被称为**接口代理**。这样就克服了静态代理的缺点。

JDK 中生成代理对象的 API 所在包，`java.lang.reflect.Proxy`，JDK 实现代理使用`static Object newProxyInstance(ClassLoader loader, Class[] interfaces, InvocationHandler h)`方法，三个参数分别代表:
* `ClassLoader loader`: 指定当前目标对象所使用类加载器，获取加载器的方法是固定的
* `Class[] interfaces`: 目标对象实现的接口的类型，使用泛型方式确认类型
* `InvocationHandler h`: 事件处理，执行目标对象的方法时，会触发事件处理器的方法，会把当前执行目标对象的方法作为参数传入

下面编写一个代理工厂类:
```java
/**
 * 创建动态代理对象
 * 动态代理不需要实现接口，但是需要指定接口类型
 */
public class ProxyFactory {

    // 维护一个目标对象
    private Object target;

    public ProxyFactory(Object target) {
        this.target = target;
    }

    // 给目标对象生成代理对象
    public Object getProxyInstance() {
        return Proxy.newProxyInstance(
                // 指定目标对象的类加载器
                target.getClass().getClassLoader(),
                // 指定目标对象所实现的接口
                target.getClass().getInterfaces(),
                // 当调用目标对象指定方法时候的事件处理函数
                (proxy, method, args) -> {
                    System.out.println("开始调用 target 对象方法");
                    // 执行目标对象方法，并获取返回值
                    Object returnValue = method.invoke(target, args);
                    System.out.println("完成调用 target 对象方法");
                    return returnValue;
                }
        );
    }
}
```

测试一下:
```java
public class DynamicProxyDemo {    
    public static void main(String[] args) {
        Person caseClient = new CaseClient();
        Person lawyer = (Person) new ProxyFactory(caseClient).getProxyInstance();
        lawyer.litigation();
    }
}
```

>代理对象不需要实现接口，但是委托(目标)对象一定要实现接口，否则不能用动态代理

### Cglib 代理(子类代理)
**静态代理**和**动态代理**模式都是**要求目标对象是至少实现了一个接口的目标对象**，但是有时候目标对象并没有实现任何的接口，这个时候就可以使用: **Cglib 代理**，它会在内存中构建一个委托(目标)对象的子类对象从而实现对目标对象功能的扩展。

Cglib 是一个强大的高性能的代码生成包，它可以在运行期(Runtime)扩展 Java 类与实现 Java 接口。它广泛的被许多 AOP 的框架使用，例如 Spring AOP和 synaop，为他们提供方法的 interception(拦截)。

Cglib 包的底层是通过使用一个小而快的字节码处理框架 ASM 来转换字节码并生成新的类。不鼓励直接使用 ASM，因为它要求你必须对 JVM 内部结构包括 class 文件的格式和指令集都很熟悉。

实现 Cglib 子类代理:
* 需要引入 cglib 的 jar 文件，但是 Spring 的 core 包中已经包括了 Cglib 功能，所以直接引入 spring-core-xxx.jar 即可在内存中动态构建子类。
* 代理类不能为`final`，否则报错
* 目标对象的方法如果为`final/static`，方法就不会被拦截，因此就不会执行目标对象额外的业务逻辑。

```java
/**
 * Cglib子 类代理工厂
 */
public class ProxyFactory implements MethodInterceptor{
   //维护目标对象
   private Object target;

   public ProxyFactory(Object target) {
       this.target = target;
   }

   //给目标对象创建一个代理对象
   public Object getProxyInstance(){
       // 增强类
       Enhancer en = new Enhancer();
       // 设置父类
       en.setSuperclass(target.getClass());
       // 设置回调函数
       en.setCallback(this);
       // 创建子类(代理对象)
       return en.create();
   }

   @Override
   public Object intercept(Object obj, Method method, Object[] args, MethodProxy proxy) throws Throwable {
       System.out.println("开始调用 target 对象方法");
       // 执行目标对象方法，并获取返回值
       Object returnValue = method.invoke(target, args);
       System.out.println("完成调用 target 对象方法");
       return returnValue;
   }
}
```
