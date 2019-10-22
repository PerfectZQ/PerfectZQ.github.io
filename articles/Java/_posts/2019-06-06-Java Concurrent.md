---
layout: post
title: Java Concurrent
tag: Java
---

## Introduction
本篇主要整理 Java 并发编程中的知识点

## Terminology
### Thread.State
* 版本: oracle jdk1.8

```java
package java.lang;

public
class Thread implements Runnable {
    ...

    /**
     * A thread state.  A thread can be in one of the following states:
     * <ul>
     * <li>{@link #NEW}<br>
     *     A thread that has not yet started is in this state.
     *     </li>
     * <li>{@link #RUNNABLE}<br>
     *     A thread executing in the Java virtual machine is in this state.
     *     </li>
     * <li>{@link #BLOCKED}<br>
     *     A thread that is blocked waiting for a monitor lock
     *     is in this state.
     *     </li>
     * <li>{@link #WAITING}<br>
     *     A thread that is waiting indefinitely for another thread to
     *     perform a particular action is in this state.
     *     </li>
     * <li>{@link #TIMED_WAITING}<br>
     *     A thread that is waiting for another thread to perform an action
     *     for up to a specified waiting time is in this state.
     *     </li>
     * <li>{@link #TERMINATED}<br>
     *     A thread that has exited is in this state.
     *     </li>
     * </ul>
     *
     * <p>
     * A thread can be in only one state at a given point in time.
     * These states are virtual machine states which do not reflect
     * any operating system thread states.
     *
     * @since   1.5
     * @see #getState
     */
    public enum State {
        /**
         * Thread state for a thread which has not yet started.
         * --------------------------------------------------------------
         * 还没有调用 Thread.start() 的线程
         */
        NEW,

        /**
         * Thread state for a runnable thread.  A thread in the runnable
         * state is executing in the Java virtual machine but it may
         * be waiting for other resources from the operating system
         * such as processor.
         * --------------------------------------------------------------
         * 可执行: 正在 JVM 中执行，但是需要等待其他操作系统资源(比如 cpu)的线程
         */
        RUNNABLE,

        /**
         * Thread state for a thread blocked waiting for a monitor lock.
         * A thread in the blocked state is waiting for a monitor lock
         * to enter a synchronized block/method or
         * reenter a synchronized block/method after calling
         * {@link Object#wait() Object.wait}.
         * --------------------------------------------------------------
         * 阻塞: 在等待锁去进入(或重新进入)一个 synchronized 块/方法
         */
        BLOCKED,

        /**
         * Thread state for a waiting thread.
         * A thread is in the waiting state due to calling one of the
         * following methods:
         * <ul>
         *   <li>{@link Object#wait() Object.wait} with no timeout</li>
         *   <li>{@link #join() Thread.join} with no timeout</li>
         *   <li>{@link LockSupport#park() LockSupport.park}</li>
         * </ul>
         *
         * <p>A thread in the waiting state is waiting for another thread to
         * perform a particular action.
         *
         * For example, a thread that has called <tt>Object.wait()</tt>
         * on an object is waiting for another thread to call
         * <tt>Object.notify()</tt> or <tt>Object.notifyAll()</tt> on
         * that object. A thread that has called <tt>Thread.join()</tt>
         * is waiting for a specified thread to terminate.
         * --------------------------------------------------------------
         * 等待: 在执行下面三个方法后线程会进入该状态
         * <ul>
         *   <li>{@link Object#wait() Object.wait} with no timeout</li>
         *   <li>{@link #join() Thread.join} with no timeout</li>
         *   <li>{@link LockSupport#park() LockSupport.park}</li>
         * </ul>
         * 
         * 该状态的线程在等待其他线程执行一个特定的操作去唤醒它
         */
        WAITING,

        /**
         * Thread state for a waiting thread with a specified waiting time.
         * A thread is in the timed waiting state due to calling one of
         * the following methods with a specified positive waiting time:
         * <ul>
         *   <li>{@link #sleep Thread.sleep}</li>
         *   <li>{@link Object#wait(long) Object.wait} with timeout</li>
         *   <li>{@link #join(long) Thread.join} with timeout</li>
         *   <li>{@link LockSupport#parkNanos LockSupport.parkNanos}</li>
         *   <li>{@link LockSupport#parkUntil LockSupport.parkUntil}</li>
         * </ul>
         * --------------------------------------------------------------
         * 有期限的等待: 处于等待状态的线程需要其他线程执行特定操作才能被唤醒，但是其他线程
         * 可能因为若干原因阻塞而迟迟不能执行特定操作，因此给定一个时间限制，超了时间就不等了
         */
        TIMED_WAITING,

        /**
         * Thread state for a terminated thread.
         * The thread has completed execution.
         * --------------------------------------------------------------
         * 终止: 线程已经执行完了
         */
        TERMINATED;
    }
    ...
}
```

### Synchronized & Asynchronized 
**同步**和**异步**的概念对于很多人来说是一个模糊的概念，是一种似乎只能意会不能言传的东西。其实我们的生活中存在着很多同步异步的例子。比如：你叫我去吃饭，我听到了就立刻和你去吃饭，如果我没听见，你就会一直叫我，直到我听见和你一起去吃饭，这个过程叫同步；异步过程指你叫我去吃饭，然后你就去吃饭了，而不管我是否和你一起去吃饭。而我得到消息后可能立即就走，也可能过段时间再走。如果我请你吃饭，就是同步，如果你请我吃饭就用异步，这样你比较省钱。哈哈哈。。。
#### 同步和异步的区别
在计算机领域，同步就是指一个进程在执行某个请求的时候，若该请求需要一段时间才能返回信息，那么这个进程将会一直等待下去，直到收到返回信息才继续执行下去；异步是指进程不需要一直等下去，而是继续执行下面的操作，不管其他进程的状态。当有消息返回时系统会通知进程进行处理，这样可以提高执行的效率。
#### 实现同步的机制
* 临界区：通过对多线程的串行化来访问公共资源或一段代码，速度快，适合控制数据访问。在任意时刻只允许一个线程对共享资源进行访问，如果有多个线程试图访问公共资 源，那么在有一个线程进入后，其他试图访问公共资源的线程将被挂起，并一直等到进入临界区的线程离开，临界区在被释放后，其他线程才可以抢占。
* 互斥量：采用互斥对象机制。 只有拥有互斥对象的线程才有访问公共资源的权限，因为互斥对象只有一个，所以能保证公共资源不会同时被多个线程访问。互斥不仅能实现同一应用程序的公共资源安全共享，还能实现不同应用程序的公共资源安全共享 .互斥量比临界区复杂。因为使用互斥不仅仅能够在同一应用程序不同线程中实现资源的安全共享，而且可以在不同应用程序的线程之间实现对资源的安全共享。
* 信号量：它允许多个线程在同一时刻访问同一资源，但是需要限制在同一时刻访问此资源的最大线程数目 。信号量对象对线程的同步方式与前面几种方法不同，信号允许多个线程同时使用共享资源，这与操作系统中的PV操作相同。它指出了同时访问共享资源的线程最大数目。它允许多个线程在同一时刻访问同一资源，但是需要限制在同一时刻访问此资源的最大线程数目。
* 事件：通过通知操作的方式来保持线程的同步，还可以方便实现对多个线程的优先级比较的操作。

## Demos
### 多线程加 1
多个线程同时对变量`i`加一，保证结果正确。
```scala
object Test {

  def main(args: Array[String]): Unit = {
    var i = 0
    val runnable = new Runnable {
      override def run(): Unit = {
        // 用来模拟一顿操作猛如虎
        Thread.sleep(200)
        // Note: this 是指当前 object Test，而不是 Thread 对象
        this.synchronized {
          i += 1
        }
      }
    }
    val threads = Range(0, 10000).map { _ => new Thread(runnable) }
    /**
     * Note: 多个线程的 start()、join() 要全部分开写，如果 
     * thread1.start(); thread1.join();
     * thread2.start(); thread2.join();
     * 这样写的话，虽然你创建了多个线程，但还是串行执行的，并没有并发。
     */
    threads.foreach(thread => thread.start())
    // 等所有线程都加完了(join)再输出，否则输出结果不对
    threads.foreach(thread => thread.join())
    println(i)
  }

}
```