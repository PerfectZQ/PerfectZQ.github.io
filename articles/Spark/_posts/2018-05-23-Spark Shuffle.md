---
layout: post
title: Spark Shuffle
tag: Spark
---

## 参考
[what is shuffle read shuffle write in apache spark](https://stackoverflow.com/questions/27276884/what-is-shuffle-read-shuffle-write-in-apache-spark)

[spark shuffle introduction](https://de.slideshare.net/colorant/spark-shuffle-introduction)

[nsdi spark](http://people.csail.mit.edu/matei/papers/2012/nsdi_spark.pdf)

[一篇文章了解 Spark Shuffle 内存使用](https://mp.weixin.qq.com/s/wB3xDWwl0k-GzIJ9j6nDyw)

[]

## Spark Memory 管理
`Executor`中的内存由`MemoryManager`统一管理，当一个`Task`被分配到某个`Executor`上时，会为该`Task`创建一个`TaskMemoryManager`，`TaskMemoryManager`实际上只对当前`Task`的内存使用进行管理，而真正的内存的申请、分配、释放工作交给`MemoryManager`的实现类去做，`MemoryManager`则又借助`MemoryAllocator`去真正执行内存的分配。一个`Exectutor`的`TaskMemoryManager`由`executor-cores`决定。

Spark 使用抽象类`MemoryConsumer`表示需要使用内存的消费者，其中定义了一些对内存进行具体操作的方法(如`acquireMemory(申请)`、`allocateMemory(分配)`、`freeMemory(释放)`)和接口(如`spill(内存数据溢写到磁盘)`)，实际上`MemoryConsumer`的实现类主要实现`spill`接口，将内存数据溢写到磁盘，对于相关内存的申请、分配、释放工作交给`TaskMemoryManager`来执行。一个`TaskMemoryManager`会包含若干个`MemoryConsumer`

### MemoryConsumer
```scala
package org.apache.spark.memory;

/**
 * A memory consumer of {@link TaskMemoryManager} that supports spilling.
 *
 * Note: this only supports allocation / spilling of Tungsten memory.
 */
public abstract class MemoryConsumer {

  protected final TaskMemoryManager taskMemoryManager;
  private final long pageSize;
  private final MemoryMode mode;
  protected long used;

  protected MemoryConsumer(TaskMemoryManager taskMemoryManager, long pageSize, MemoryMode mode) {
    this.taskMemoryManager = taskMemoryManager;
    this.pageSize = pageSize;
    this.mode = mode;
  }

  protected MemoryConsumer(TaskMemoryManager taskMemoryManager) {
    this(taskMemoryManager, taskMemoryManager.pageSizeBytes(), MemoryMode.ON_HEAP);
  }

  /**
   * Spill some data to disk to release memory, which will be called by TaskMemoryManager
   * when there is not enough memory for the task.
   *
   * This should be implemented by subclass.
   *
   * Note: In order to avoid possible deadlock, should not call acquireMemory() from spill().
   *
   * Note: today, this only frees Tungsten-managed pages.
   *
   * @param size the amount of memory should be released
   * @param trigger the MemoryConsumer that trigger this spilling
   * @return the amount of released memory in bytes
   * @throws IOException
   */
  // 需要实现类实现
  public abstract long spill(long size, MemoryConsumer trigger) throws IOException;

  /**
   * Allocate a memory block with at least `required` bytes.
   *
   * @throws OutOfMemoryError
   */
  protected MemoryBlock allocatePage(long required) {
    // 实际交给 taskMemoryManager 执行
    MemoryBlock page = taskMemoryManager.allocatePage(Math.max(pageSize, required), this);
    if (page == null || page.size() < required) {
      throwOom(page, required);
    }
    used += page.size();
    return page;
  }

  /**
   * Free a memory block.
   */
  protected void freePage(MemoryBlock page) {
    used -= page.size();
    // 实际交给 taskMemoryManager 执行
    taskMemoryManager.freePage(page, this);
  }

  /**
   * Allocates memory of `size`.
   */
  public long acquireMemory(long size) {
    // 实际交给 taskMemoryManager 执行
    long granted = taskMemoryManager.acquireExecutionMemory(size, this);
    used += granted;
    return granted;
  }
  
}
```

### MemoryManager
```scala
package org.apache.spark.memory

/**
 * An abstract memory manager that enforces how memory is shared between execution and storage.
 *
 * In this context, execution memory refers to that used for computation in shuffles, joins,
 * sorts and aggregations, while storage memory refers to that used for caching and propagating
 * internal data across the cluster. There exists one MemoryManager per JVM.
 */
private[spark] abstract class MemoryManager(
    conf: SparkConf,
    numCores: Int,
    onHeapStorageMemory: Long,
    onHeapExecutionMemory: Long) extends Logging {

}
```

### TaskMemoryManager
```java
package org.apache.spark.memory;

/**
 * Manages the memory allocated by an individual task.
 * <p>
 * Most of the complexity in this class deals with encoding of off-heap addresses into 64-bit longs.
 * In off-heap mode, memory can be directly addressed with 64-bit longs. In on-heap mode, memory is
 * addressed by the combination of a base Object reference and a 64-bit offset within that object.
 * This is a problem when we want to store pointers to data structures inside of other structures,
 * such as record pointers inside hashmaps or sorting buffers. Even if we decided to use 128 bits
 * to address memory, we can't just store the address of the base object since it's not guaranteed
 * to remain stable as the heap gets reorganized due to GC.
 * <p>
 * Instead, we use the following approach to encode record pointers in 64-bit longs: for off-heap
 * mode, just store the raw address, and for on-heap mode use the upper 13 bits of the address to
 * store a "page number" and the lower 51 bits to store an offset within this page. These page
 * numbers are used to index into a "page table" array inside of the MemoryManager in order to
 * retrieve the base object.
 * <p>
 * This allows us to address 8192 pages. In on-heap mode, the maximum page size is limited by the
 * maximum size of a long[] array, allowing us to address 8192 * (2^31 - 1) * 8 bytes, which is
 * approximately 140 terabytes of memory.
 */
public class TaskMemoryManager {
    
  /** The number of bits used to address the page table. */
  private static final int PAGE_NUMBER_BITS = 13;

  /** The number of bits used to encode offsets in data pages. */
  @VisibleForTesting
  static final int OFFSET_BITS = 64 - PAGE_NUMBER_BITS;  // 51

  /** The number of entries in the page table. */
  private static final int PAGE_TABLE_SIZE = 1 << PAGE_NUMBER_BITS;

  /**
   * Maximum supported data page size (in bytes). In principle, the maximum addressable page size is
   * (1L &lt;&lt; OFFSET_BITS) bytes, which is 2+ petabytes. However, the on-heap allocator's
   * maximum page size is limited by the maximum amount of data that can be stored in a long[]
   * array, which is (2^31 - 1) * 8 bytes (or about 17 gigabytes). Therefore, we cap this at 17
   * gigabytes.
   */
  public static final long MAXIMUM_PAGE_SIZE_BYTES = ((1L << 31) - 1) * 8L;

  /** Bit mask for the lower 51 bits of a long. */
  private static final long MASK_LONG_LOWER_51_BITS = 0x7FFFFFFFFFFFFL;

  /**
   * Similar to an operating system's page table, this array maps page numbers into base object
   * pointers, allowing us to translate between the hashtable's internal 64-bit address
   * representation and the baseObject+offset representation which we use to support both in- and
   * off-heap addresses. When using an off-heap allocator, every entry in this map will be `null`.
   * When using an in-heap allocator, the entries in this map will point to pages' base objects.
   * Entries are added to this map as new data pages are allocated.
   */
  private final MemoryBlock[] pageTable = new MemoryBlock[PAGE_TABLE_SIZE];

  /**
   * Bitmap for tracking free pages.
   */
  private final BitSet allocatedPages = new BitSet(PAGE_TABLE_SIZE);

  private final MemoryManager memoryManager;

  private final long taskAttemptId;

  /**
   * Tracks whether we're in-heap or off-heap. For off-heap, we short-circuit most of these methods
   * without doing any masking or lookups. Since this branching should be well-predicted by the JIT,
   * this extra layer of indirection / abstraction hopefully shouldn't be too expensive.
   */
  final MemoryMode tungstenMemoryMode;

  /**
   * Tracks spillable memory consumers.
   */
  @GuardedBy("this")
  private final HashSet<MemoryConsumer> consumers;

  /**
   * The amount of memory that is acquired but not used.
   */
  private volatile long acquiredButNotUsed = 0L;
  
  /**
   * Construct a new TaskMemoryManager.
   */
  public TaskMemoryManager(MemoryManager memoryManager, long taskAttemptId) {
    this.tungstenMemoryMode = memoryManager.tungstenMemoryMode();
    this.memoryManager = memoryManager;
    this.taskAttemptId = taskAttemptId;
    this.consumers = new HashSet<>();
  }

  /**
   * Acquire N bytes of memory for a consumer. If there is no enough memory, it will call
   * spill() of consumers to release more memory.
   *
   * @return number of bytes successfully granted (<= N).
   */
  public long acquireExecutionMemory(long required, MemoryConsumer consumer) {
    assert(required >= 0);
    assert(consumer != null);
    MemoryMode mode = consumer.getMode();
    // If we are allocating Tungsten pages off-heap and receive a request to allocate on-heap
    // memory here, then it may not make sense to spill since that would only end up freeing
    // off-heap memory. This is subject to change, though, so it may be risky to make this
    // optimization now in case we forget to undo it late when making changes.
    synchronized (this) {
      // 向 MemoryManager 申请内存 
      long got = memoryManager.acquireExecutionMemory(required, taskAttemptId, mode);

      // Try to release memory from other consumers first, then we can reduce the frequency of
      // spilling, avoid to have too many spilled files.
      if (got < required) {
        // Call spill() on other consumers to release memory
        // Sort the consumers according their memory usage. So we avoid spilling the same consumer
        // which is just spilled in last few times and re-spilling on it will produce many small
        // spill files.
        TreeMap<Long, List<MemoryConsumer>> sortedConsumers = new TreeMap<>();
        for (MemoryConsumer c: consumers) {
          if (c != consumer && c.getUsed() > 0 && c.getMode() == mode) {
            long key = c.getUsed();
            List<MemoryConsumer> list =
                sortedConsumers.computeIfAbsent(key, k -> new ArrayList<>(1));
            list.add(c);
          }
        }
        while (!sortedConsumers.isEmpty()) {
          // Get the consumer using the least memory more than the remaining required memory.
          Map.Entry<Long, List<MemoryConsumer>> currentEntry =
            sortedConsumers.ceilingEntry(required - got);
          // No consumer has used memory more than the remaining required memory.
          // Get the consumer of largest used memory.
          if (currentEntry == null) {
            currentEntry = sortedConsumers.lastEntry();
          }
          List<MemoryConsumer> cList = currentEntry.getValue();
          MemoryConsumer c = cList.remove(cList.size() - 1);
          if (cList.isEmpty()) {
            sortedConsumers.remove(currentEntry.getKey());
          }
          try {
            // MemoryConsumer 实现类将内存数据写入磁盘以释放内存
            long released = c.spill(required - got, consumer);
            if (released > 0) {
              logger.debug("Task {} released {} from {} for {}", taskAttemptId,
                Utils.bytesToString(released), c, consumer);
              got += memoryManager.acquireExecutionMemory(required - got, taskAttemptId, mode);
              if (got >= required) {
                break;
              }
            }
          } catch (ClosedByInterruptException e) {
            // This called by user to kill a task (e.g: speculative task).
            logger.error("error while calling spill() on " + c, e);
            throw new RuntimeException(e.getMessage());
          } catch (IOException e) {
            logger.error("error while calling spill() on " + c, e);
            throw new SparkOutOfMemoryError("error while calling spill() on " + c + " : "
              + e.getMessage());
          }
        }
      }

      // call spill() on itself
      if (got < required) {
        try {
          // MemoryConsumer 实现类将内存数据写入磁盘以释放内存
          long released = consumer.spill(required - got, consumer);
          if (released > 0) {
            logger.debug("Task {} released {} from itself ({})", taskAttemptId,
              Utils.bytesToString(released), consumer);
            got += memoryManager.acquireExecutionMemory(required - got, taskAttemptId, mode);
          }
        } catch (ClosedByInterruptException e) {
          // This called by user to kill a task (e.g: speculative task).
          logger.error("error while calling spill() on " + consumer, e);
          throw new RuntimeException(e.getMessage());
        } catch (IOException e) {
          logger.error("error while calling spill() on " + consumer, e);
          throw new SparkOutOfMemoryError("error while calling spill() on " + consumer + " : "
            + e.getMessage());
        }
      }

      consumers.add(consumer);
      logger.debug("Task {} acquired {} for {}", taskAttemptId, Utils.bytesToString(got), consumer);
      return got;
    }
  }

  /**
   * Allocate a block of memory that will be tracked in the MemoryManager's page table; this is
   * intended for allocating large blocks of Tungsten memory that will be shared between operators.
   *
   * Returns `null` if there was not enough memory to allocate the page. May return a page that
   * contains fewer bytes than requested, so callers should verify the size of returned pages.
   *
   * @throws TooLargePageException
   */
  public MemoryBlock allocatePage(long size, MemoryConsumer consumer) {
    assert(consumer != null);
    assert(consumer.getMode() == tungstenMemoryMode);
    if (size > MAXIMUM_PAGE_SIZE_BYTES) {
      throw new TooLargePageException(size);
    }

    long acquired = acquireExecutionMemory(size, consumer);
    if (acquired <= 0) {
      return null;
    }

    final int pageNumber;
    synchronized (this) {
      pageNumber = allocatedPages.nextClearBit(0);
      if (pageNumber >= PAGE_TABLE_SIZE) {
        releaseExecutionMemory(acquired, consumer);
        throw new IllegalStateException(
          "Have already allocated a maximum of " + PAGE_TABLE_SIZE + " pages");
      }
      allocatedPages.set(pageNumber);
    }
    MemoryBlock page = null;
    try {
      // tungstenMemoryAllocator() 返回 MemoryAllocator
      page = memoryManager.tungstenMemoryAllocator().allocate(acquired);
    } catch (OutOfMemoryError e) {
      logger.warn("Failed to allocate a page ({} bytes), try again.", acquired);
      // there is no enough memory actually, it means the actual free memory is smaller than
      // MemoryManager thought, we should keep the acquired memory.
      synchronized (this) {
        acquiredButNotUsed += acquired;
        allocatedPages.clear(pageNumber);
      }
      // this could trigger spilling to free some pages.
      return allocatePage(size, consumer);
    }
    page.pageNumber = pageNumber;
    pageTable[pageNumber] = page;
    if (logger.isTraceEnabled()) {
      logger.trace("Allocate page number {} ({} bytes)", pageNumber, acquired);
    }
    return page;
  }
}
```