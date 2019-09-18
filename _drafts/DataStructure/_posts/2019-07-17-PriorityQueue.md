---
layout: post
title: PriorityQueue
tag:  DataStructure
---

## PriorityQueue
[参考](https://my.oschina.net/leejun2005/blog/135085)

`PriorityQueue`是从JDK1.5开始提供的新的数据结构接口，它是一种基于**优先级堆**实现的极大优先级队列。优先级队列是不同于先进先出队列的另一种队列。每次从队列中取出的是具有最高优先权的元素。如果不提供`Comparator`的话，优先队列中元素默认按自然顺序排列，也就是数字默认是小的在队列头，字符串则按字典序排列(参阅`Comparable`)，也可以根据`Comparator`来指定，这取决于使用哪种构造方法。优先级队列不允许`null`元素。依靠自然排序的优先级队列还不允许插入不可比较的对象，这样做可能导致`ClassCastException`。

`PriorityQueue`队列的头默认是按指定排序方式的最小元素。如果同时存在多个最小值，随机返回一个。

`poll`、`remove`、`peek`和`element`访问处于队列头的元素。`PriorityQueue`是无界的，但是有一个内部容量，控制着用于存储队列元素的数组的大小。**它总是至少与队列的大小相同，随着不断向优先级队列添加元素，其容量会自动增加，无需指定容量增加策略的细节**。

### 注意事项
* 该队列是用数组实现，但是数组大小可以动态增加，容量无限。
* 不是线程安全的。`PriorityBlockingQueue`是线程安全的。
* 不允许`null`
* 为插入方法`offer`、`poll`、`remove()`和`add`提供`O(log(n))`时间，为`remove(Object)`和`contains(Object)`方法提供线性时间(`O(n)`)，为检索方法`peek`、`element`和`size`提供固定时间(`O(1)`)。
* 方法`iterator()`中提供的迭代器并不保证以有序的方式遍历优先级队列中的元素。如果需要按顺序遍历，请考虑使用`Arrays.sort(pq.toArray())`。`PriorityQueue`及其迭代器实现了`Collection`和`Iterator`接口的所有可选方法。`PriorityQueue`的内部实现是对元素采用堆排序，头是按指定排序方式的最小元素。**堆排序只能保证根(用于实现堆的数组的第一个元素)是最大(最小)，实现堆的数组本身并不是有序的**。方法`iterator()`中提供的迭代器可能只是对整个数组的依次遍历，也就只能保证数组的第一个元素是最小的。

### 取1亿元素中top1000元素
```scala
package com.rich.zq

import java.util
import java.util.{Collections, Comparator, PriorityQueue}

import scala.util.Random

object Top1KFrom1E {

  def main(args: Array[String]): Unit = {
    val currentTime = System.currentTimeMillis()
    val priorityQueue = new FixSizePriorityQueue[java.lang.Long](1000)
    for (i <- 1 to 100000000) {
      priorityQueue.add(new Random().nextInt(i).asInstanceOf[Long])
    }
    import scala.collection.JavaConverters._
    println(s"iterator: ${priorityQueue.iterator.asScala.mkString(",")}")
    println(s"sortedList: ${priorityQueue.sortedList.asScala.mkString(",")}")
    println(s"cost ${System.currentTimeMillis() - currentTime} milliseconds")
  }

  class FixSizePriorityQueue[E <: Comparable[E]](maxSize: Int, isMaxHeap: Boolean = false) {

    if (maxSize < 0) throw new IllegalArgumentException("maxSize must greater than 0")

    val priorityQueue = new PriorityQueue[E](maxSize, new Comparator[E] {
      override def compare(o1: E, o2: E): Int = if (isMaxHeap) o2.compareTo(o1) else o1.compareTo(o2)
    })

    def add(element: E): Unit = {
      if (priorityQueue.size() < maxSize)
        priorityQueue.add(element)
      else {
        if (isMaxHeap) {
          val currentMaxElement = priorityQueue.peek()
          if (currentMaxElement.compareTo(element) > 0) {
            priorityQueue.poll()
            priorityQueue.add(element)
          }
        } else {
          val currentMinElement = priorityQueue.peek()
          if (currentMinElement.compareTo(element) < 0) {
            priorityQueue.poll()
            priorityQueue.add(element)
          }
        }
      }
    }

    def iterator: util.Iterator[E] = priorityQueue.iterator()

    def sortedList: util.ArrayList[E] = {
      val list = new util.ArrayList[E](priorityQueue)
      Collections.sort(list)
      list
    }

  }

}
```

输出结果
```console
iterator: 99554884,99555639,99555092,99556134,99556796,99555454,99555201,99556502,99557176,99557196,99558279,99555567,99557392,99559249,99555579,99564214,99562546,99557564,99559626,99557274,99558133,99560320,99559345,99560132,99563467,99560117,99557556,99561177,99569451,99556493,99556242,99575739,99573180,99566853,99564162,99561408,99564424,99562714,99562839,99575569,99567890,99558371,99571040,99562009,99561454,99562594,99560172,99563243,99571028,99568872,99563956,99588193,99568788,99559129,99563940,99569040,99565588,99575509,99577557,99561108,99560522,99560017,99586379,99578540,99593193,99585607,99578830,99597271,99592742,99571050,99576005,99585608,99597081,99565207,99580909,99563765,99581507,99575708,99604992,99592073,99580886,99583523,99573866,99563214,99568325,99600437,99591616,99565571,99590875,99585529,99579172,99577395,99602180,99569180,99592181,99584268,99567458,99605022,99574051,99597378,99577069,99575886,99575363,99600400,99593720,99576943,99591412,99574166,99573273,99593401,99570065,99578194,99573847,99588127,99578372,99576077,99587736,99586981,99586281,99568361,99588238,99584431,99580306,99574796,99566276,99593134,99595153,99580070,99584122,99666406,99593597,99587342,99636846,99581837,99606276,99630575,99619938,99600883,99601169,99593453,99606489,99612791,99595065,99586757,99587757,99637086,99619975,99570709,99584449,99630622,99582276,99576163,99602795,99669261,99585854,99581902,99580817,99610078,99653798,99595990,99596742,99605531,99600284,99625211,99588085,99617383,99637308,99582403,99575539,99588983,99568793,99678998,99610579,99602261,99619783,99611341,99671653,99604920,99593509,99609128,99667383,99585548,99598748,99580289,99660233,99604316,99602238,99589019,99619315,99594509,99598805,99607048,99610595,99567460,99574869,99606706,99682836,99619372,99616267,99677238,99624196,99592595,99580374,99591147,99625344,99615931,99682086,99604155,99611593,99594347,99627034,99616238,99586519,99608232,99606496,99587580,99629209,99656604,99590876,99593508,99632906,99598888,99611452,99608276,99585098,99602100,99592485,99621699,99602504,99581175,99588921,99593987,99609355,99622903,99591916,99615720,99642094,99594948,99601876,99580378,99658573,99600054,99613597,99651014,99612321,99593552,99592761,99678339,99600293,99568998,99788537,99653667,99603541,99670884,99604178,99632830,99588842,99751483,99644661,99670596,99752477,99637954,99729757,99599191,99666758,99668905,99658438,99631718,99586311,99626562,99618354,99659276,99673831,99653032,99655474,99707446,99601838,99628575,99657300,99603268,99684819,99767221,99616923,99681464,99640571,99620132,99728350,99608407,99612263,99728394,99620060,99700926,99680238,99732692,99654019,99603890,99584193,99639744,99619435,99772064,99631603,99589628,99742890,99696349,99589270,99623060,99606642,99686954,99757901,99681129,99619933,99667923,99603040,99604851,99630602,99704302,99634671,99769040,99713715,99638510,99631507,99665984,99629136,99762884,99655441,99662564,99771209,99844579,99628895,99654168,99619350,99680250,99763201,99753061,99648561,99634358,99603817,99724387,99644071,99633109,99676299,99640622,99573888,99735010,99695613,99639693,99611100,99630507,99643188,99875190,99627048,99633572,99612867,99787490,99704273,99611308,99692301,99785136,99691619,99645982,99624881,99689857,99799981,99595653,99616323,99618048,99648864,99591039,99584556,99680269,99666047,99617495,99753167,99794380,99612032,99599080,99662563,99779606,99654770,99611252,99603758,99607709,99752815,99677247,99660426,99658909,99658309,99605931,99595623,99790775,99646369,99697053,99667229,99688870,99694176,99670086,99666660,99753069,99644200,99699249,99730853,99679351,99625469,99608050,99606996,99637098,99608415,99616131,99653737,99724994,99661440,99661200,99684702,99749207,99716588,99648536,99724625,99676810,99648361,99607760,99772466,99675359,99657136,99643447,99685976,99595624,99586717,99641704,99627898,99609480,99636023,99686922,99641419,99640121,99644549,99708255,99791701,99694168,99643632,99610668,99614670,99656115,99666441,99601113,99647052,99804858,99846233,99673203,99790639,99607009,99655382,99692951,99628223,99655062,99624305,99681232,99638991,99751658,99605816,99602426,99608903,99680372,99750469,99608723,99617982,99623765,99713870,99632979,99625656,99722000,99652744,99659044,99687809,99664898,99692110,99640445,99625343,99697069,99784017,99721690,99624716,99727847,99688673,99604366,99634035,99659426,99615123,99680819,99733679,99684809,99615488,99650333,99795856,99620176,99598804,99700284,99702921,99673593,99611222,99569804,99770258,99862922,99960144,99744277,99765535,99814279,99769842,99743265,99907420,99671700,99798323,99662051,99833213,99950520,99681880,99758544,99905078,99755425,99707137,99899866,99807188,99818919,99817797,99644518,99890577,99768477,99865665,99706885,99834357,99851318,99898675,99689340,99749549,99754328,99827108,99689017,99817677,99939536,99748866,99748679,99774702,99835882,99687095,99964780,99868966,99693370,99709114,99716561,99807479,99831055,99685410,99812135,99722906,99706448,99706475,99766697,99953938,99659657,99665087,99912373,99807257,99785516,99709439,99817617,99808761,99947878,99795103,99856333,99721758,99704131,99770824,99776085,99767844,99929935,99869625,99816011,99771872,99615498,99952571,99753669,99802856,99625486,99764687,99882958,99769601,99806996,99846997,99845899,99752094,99701506,99726490,99899207,99820808,99807864,99707244,99694309,99668079,99758258,99693979,99891002,99957155,99735720,99666578,99734420,99722082,99781176,99770292,99714184,99800011,99724108,99912421,99727902,99878642,99742395,99671997,99720657,99743568,99772969,99760382,99830804,99906547,99744079,99629663,99720221,99877820,99674953,99858303,99853466,99641137,99676432,99749077,99706835,99891157,99752438,99808207,99838780,99778782,99728010,99808658,99803719,99781233,99772402,99766716,99771424,99875682,99951047,99699541,99964024,99897550,99797295,99784507,99850917,99675571,99798043,99962697,99859868,99909877,99640114,99871770,99686471,99940419,99740129,99905845,99801825,99838282,99877514,99825689,99805581,99842788,99746301,99870103,99845851,99780410,99852410,99640477,99752203,99803643,99703131,99872414,99819220,99753470,99821825,99809749,99832630,99738300,99685811,99945112,99751675,99845727,99728713,99880019,99784151,99881071,99825616,99701448,99913916,99724930,99652070,99950054,99875806,99922411,99879903,99745394,99766127,99648497,99721316,99628404,99851837,99849226,99705378,99887972,99743529,99871614,99713195,99852653,99803459,99800527,99923215,99703856,99717537,99694740,99626721,99635696,99930903,99718388,99934921,99864947,99736269,99736596,99714037,99659131,99861706,99798740,99696256,99857765,99638112,99646660,99623025,99670773,99717321,99902394,99737907,99950793,99771457,99676312,99905876,99947784,99817833,99846930,99904452,99623895,99636345,99916675,99700715,99726731,99847325,99935261,99738221,99912146,99906046,99776283,99762659,99646799,99689551,99931412,99821232,99912993,99789862,99706707,99736376,99771124,99871584,99729151,99875170,99916278,99764211,99670438,99651599,99839097,99838052,99837559,99748774,99839227,99723523,99731761,99857234,99688736,99822389,99897615,99878643,99782020,99758794,99845707,99780040,99816535,99754126,99797136,99688521,99900190,99817302,99887579,99739104,99782509,99763973,99762163,99740859,99682286,99660891,99870210,99766908,99611112,99879283,99784230,99833671,99678823,99617871,99721468,99930013,99700647,99902151,99756119,99932178,99681245,99748297,99772134,99740868,99728347,99779792,99795078,99739359,99774879,99711412,99858571,99828839,99762119,99851150,99711610,99811822,99713155,99609800,99833733,99794713,99847993,99732317,99848115,99817821,99931621,99696439,99724255,99732451,99709630,99774171,99705771,99594356,99608530,99818617,99860763,99693517,99862001,99667006,99667356,99850212,99712573,99803537,99742573,99754095,99702772,99653622,99689413,99722353,99880286,99748827,99718176,99852496,99956546,99846200,99765273,99650692,99742701,99824958,99893847,99764614,99815290,99776168,99757561,99814087,99712981,99814657,99669781,99804682,99839384,99883850,99919395,99921290,99940660,99703860,99718765,99868058,99801566,99677841,99636919,99664716,99747131,99701011,99795169,99809951,99663554,99698956,99839751,99762452,99852769,99682609,99705566,99704583,99651101,99831680,99776644,99702842,99793890,99776412,99642440,99713306,99683992,99931130,99709175,99803891,99823416,99704579,99761064,99761851,99692213,99726453,99852567,99818511,99969787,99823092,99710398,99820799,99858389,99832265,99817305,99871671,99664796,99801103,99696474,99721944,99792623,99675240,99709993,99757567,99695151,99665185,99782797,99835352,99675539,99873431,99882318,99961414,99899168,99778623,99786816,99820560,99934560,99792185,99864688,99899283,99774911,99684865,99770623,99678895,99716996,99714470,99779435,99633723,99844993,99718061,99868638,99914048,99757226,99747087,99707124,99658695,99927570,99713097,99722767,99940613,99915524,99879806,99677034,99839363,99764031,99951213,99777422,99723803,99732084,99873100,99961928,99712064,99700308,99573768
sortedList: 99554884,99555092,99555201,99555454,99555567,99555579,99555639,99556134,99556242,99556493,99556502,99556796,99557176,99557196,99557274,99557392,99557556,99557564,99558133,99558279,99558371,99559129,99559249,99559345,99559626,99560017,99560117,99560132,99560172,99560320,99560522,99561108,99561177,99561408,99561454,99562009,99562546,99562594,99562714,99562839,99563214,99563243,99563467,99563765,99563940,99563956,99564162,99564214,99564424,99565207,99565571,99565588,99566276,99566853,99567458,99567460,99567890,99568325,99568361,99568788,99568793,99568872,99568998,99569040,99569180,99569451,99569804,99570065,99570709,99571028,99571040,99571050,99573180,99573273,99573768,99573847,99573866,99573888,99574051,99574166,99574796,99574869,99575363,99575509,99575539,99575569,99575708,99575739,99575886,99576005,99576077,99576163,99576943,99577069,99577395,99577557,99578194,99578372,99578540,99578830,99579172,99580070,99580289,99580306,99580374,99580378,99580817,99580886,99580909,99581175,99581507,99581837,99581902,99582276,99582403,99583523,99584122,99584193,99584268,99584431,99584449,99584556,99585098,99585529,99585548,99585607,99585608,99585854,99586281,99586311,99586379,99586519,99586717,99586757,99586981,99587342,99587580,99587736,99587757,99588085,99588127,99588193,99588238,99588842,99588921,99588983,99589019,99589270,99589628,99590875,99590876,99591039,99591147,99591412,99591616,99591916,99592073,99592181,99592485,99592595,99592742,99592761,99593134,99593193,99593401,99593453,99593508,99593509,99593552,99593597,99593720,99593987,99594347,99594356,99594509,99594948,99595065,99595153,99595623,99595624,99595653,99595990,99596742,99597081,99597271,99597378,99598748,99598804,99598805,99598888,99599080,99599191,99600054,99600284,99600293,99600400,99600437,99600883,99601113,99601169,99601838,99601876,99602100,99602180,99602238,99602261,99602426,99602504,99602795,99603040,99603268,99603541,99603758,99603817,99603890,99604155,99604178,99604316,99604366,99604851,99604920,99604992,99605022,99605531,99605816,99605931,99606276,99606489,99606496,99606642,99606706,99606996,99607009,99607048,99607709,99607760,99608050,99608232,99608276,99608407,99608415,99608530,99608723,99608903,99609128,99609355,99609480,99609800,99610078,99610579,99610595,99610668,99611100,99611112,99611222,99611252,99611308,99611341,99611452,99611593,99612032,99612263,99612321,99612791,99612867,99613597,99614670,99615123,99615488,99615498,99615720,99615931,99616131,99616238,99616267,99616323,99616923,99617383,99617495,99617871,99617982,99618048,99618354,99619315,99619350,99619372,99619435,99619783,99619933,99619938,99619975,99620060,99620132,99620176,99621699,99622903,99623025,99623060,99623765,99623895,99624196,99624305,99624716,99624881,99625211,99625343,99625344,99625469,99625486,99625656,99626562,99626721,99627034,99627048,99627898,99628223,99628404,99628575,99628895,99629136,99629209,99629663,99630507,99630575,99630602,99630622,99631507,99631603,99631718,99632830,99632906,99632979,99633109,99633572,99633723,99634035,99634358,99634671,99635696,99636023,99636345,99636846,99636919,99637086,99637098,99637308,99637954,99638112,99638510,99638991,99639693,99639744,99640114,99640121,99640445,99640477,99640571,99640622,99641137,99641419,99641704,99642094,99642440,99643188,99643447,99643632,99644071,99644200,99644518,99644549,99644661,99645982,99646369,99646660,99646799,99647052,99648361,99648497,99648536,99648561,99648864,99650333,99650692,99651014,99651101,99651599,99652070,99652744,99653032,99653622,99653667,99653737,99653798,99654019,99654168,99654770,99655062,99655382,99655441,99655474,99656115,99656604,99657136,99657300,99658309,99658438,99658573,99658695,99658909,99659044,99659131,99659276,99659426,99659657,99660233,99660426,99660891,99661200,99661440,99662051,99662563,99662564,99663554,99664716,99664796,99664898,99665087,99665185,99665984,99666047,99666406,99666441,99666578,99666660,99666758,99667006,99667229,99667356,99667383,99667923,99668079,99668905,99669261,99669781,99670086,99670438,99670596,99670773,99670884,99671653,99671700,99671997,99673203,99673593,99673831,99674953,99675240,99675359,99675539,99675571,99676299,99676312,99676432,99676810,99677034,99677238,99677247,99677841,99678339,99678823,99678895,99678998,99679351,99680238,99680250,99680269,99680372,99680819,99681129,99681232,99681245,99681464,99681880,99682086,99682286,99682609,99682836,99683992,99684702,99684809,99684819,99684865,99685410,99685811,99685976,99686471,99686922,99686954,99687095,99687809,99688521,99688673,99688736,99688870,99689017,99689340,99689413,99689551,99689857,99691619,99692110,99692213,99692301,99692951,99693370,99693517,99693979,99694168,99694176,99694309,99694740,99695151,99695613,99696256,99696349,99696439,99696474,99697053,99697069,99698956,99699249,99699541,99700284,99700308,99700647,99700715,99700926,99701011,99701448,99701506,99702772,99702842,99702921,99703131,99703856,99703860,99704131,99704273,99704302,99704579,99704583,99705378,99705566,99705771,99706448,99706475,99706707,99706835,99706885,99707124,99707137,99707244,99707446,99708255,99709114,99709175,99709439,99709630,99709993,99710398,99711412,99711610,99712064,99712573,99712981,99713097,99713155,99713195,99713306,99713715,99713870,99714037,99714184,99714470,99716561,99716588,99716996,99717321,99717537,99718061,99718176,99718388,99718765,99720221,99720657,99721316,99721468,99721690,99721758,99721944,99722000,99722082,99722353,99722767,99722906,99723523,99723803,99724108,99724255,99724387,99724625,99724930,99724994,99726453,99726490,99726731,99727847,99727902,99728010,99728347,99728350,99728394,99728713,99729151,99729757,99730853,99731761,99732084,99732317,99732451,99732692,99733679,99734420,99735010,99735720,99736269,99736376,99736596,99737907,99738221,99738300,99739104,99739359,99740129,99740859,99740868,99742395,99742573,99742701,99742890,99743265,99743529,99743568,99744079,99744277,99745394,99746301,99747087,99747131,99748297,99748679,99748774,99748827,99748866,99749077,99749207,99749549,99750469,99751483,99751658,99751675,99752094,99752203,99752438,99752477,99752815,99753061,99753069,99753167,99753470,99753669,99754095,99754126,99754328,99755425,99756119,99757226,99757561,99757567,99757901,99758258,99758544,99758794,99760382,99761064,99761851,99762119,99762163,99762452,99762659,99762884,99763201,99763973,99764031,99764211,99764614,99764687,99765273,99765535,99766127,99766697,99766716,99766908,99767221,99767844,99768477,99769040,99769601,99769842,99770258,99770292,99770623,99770824,99771124,99771209,99771424,99771457,99771872,99772064,99772134,99772402,99772466,99772969,99774171,99774702,99774879,99774911,99776085,99776168,99776283,99776412,99776644,99777422,99778623,99778782,99779435,99779606,99779792,99780040,99780410,99781176,99781233,99782020,99782509,99782797,99784017,99784151,99784230,99784507,99785136,99785516,99786816,99787490,99788537,99789862,99790639,99790775,99791701,99792185,99792623,99793890,99794380,99794713,99795078,99795103,99795169,99795856,99797136,99797295,99798043,99798323,99798740,99799981,99800011,99800527,99801103,99801566,99801825,99802856,99803459,99803537,99803643,99803719,99803891,99804682,99804858,99805581,99806996,99807188,99807257,99807479,99807864,99808207,99808658,99808761,99809749,99809951,99811822,99812135,99814087,99814279,99814657,99815290,99816011,99816535,99817302,99817305,99817617,99817677,99817797,99817821,99817833,99818511,99818617,99818919,99819220,99820560,99820799,99820808,99821232,99821825,99822389,99823092,99823416,99824958,99825616,99825689,99827108,99828839,99830804,99831055,99831680,99832265,99832630,99833213,99833671,99833733,99834357,99835352,99835882,99837559,99838052,99838282,99838780,99839097,99839227,99839363,99839384,99839751,99842788,99844579,99844993,99845707,99845727,99845851,99845899,99846200,99846233,99846930,99846997,99847325,99847993,99848115,99849226,99850212,99850917,99851150,99851318,99851837,99852410,99852496,99852567,99852653,99852769,99853466,99856333,99857234,99857765,99858303,99858389,99858571,99859868,99860763,99861706,99862001,99862922,99864688,99864947,99865665,99868058,99868638,99868966,99869625,99870103,99870210,99871584,99871614,99871671,99871770,99872414,99873100,99873431,99875170,99875190,99875682,99875806,99877514,99877820,99878642,99878643,99879283,99879806,99879903,99880019,99880286,99881071,99882318,99882958,99883850,99887579,99887972,99890577,99891002,99891157,99893847,99897550,99897615,99898675,99899168,99899207,99899283,99899866,99900190,99902151,99902394,99904452,99905078,99905845,99905876,99906046,99906547,99907420,99909877,99912146,99912373,99912421,99912993,99913916,99914048,99915524,99916278,99916675,99919395,99921290,99922411,99923215,99927570,99929935,99930013,99930903,99931130,99931412,99931621,99932178,99934560,99934921,99935261,99939536,99940419,99940613,99940660,99945112,99947784,99947878,99950054,99950520,99950793,99951047,99951213,99952571,99953938,99956546,99957155,99960144,99961414,99961928,99962697,99964024,99964780,99969787
cost 7673 milliseconds
```