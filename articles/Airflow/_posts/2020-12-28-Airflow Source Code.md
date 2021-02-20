---
layout: post
title: Airflow Source Code
tag:  Airflow
---

## Java 实现 AirflowDagFileLocHash
```java
package com.sensetime.airflow.sidecar.util;

import org.apache.commons.codec.digest.DigestUtils;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * @author zhangqiang
 * @since 2021/1/15 15:17
 */
public class CommonUtil {

    /**
     * Byte Array to HexString
     *
     * @param b
     * @return
     */
    public static String byteArrayToHexString(byte[] b) {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < b.length; i++) {
            result.append(Integer.toString((b[i] & 0xff) + 0x100, 16).substring(1));
        }
        return result.toString();
    }

    /**
     * Python 的 Java 实现
     *
     * <code>
     * * import hashlib
     * *
     * * def dag_fileloc_hash(full_filepath: str) -> int:
     * *    """Hashing file location for indexing.
     * *
     * *    :param full_filepath: full filepath of DAG file
     * *    :return: hashed full_filepath
     * *    """
     * *    # Only 7 bytes because MySQL BigInteger can hold only 8 bytes (signed).
     * *    # '>Q' 表示按高位字节序解析成 unsigned long long
     * *    return struct.unpack('>Q', hashlib.sha1(full_filepath.encode('utf-8')).digest()[-8:])[0] >> 8
     * </code>
     *
     * <p>
     * 在计算机系统中，数值一律用补码来表示（存储）。 主要原因：使用补码，可以将符号位和其它位统一处理；同时，
     * 减法也可按加法来处理。
     * <li>
     * 机器数：一个数在计算机中的二进制表示形式, 叫做这个数的机器数。机器数是带符号的，在计算机用一个数的最高位
     * 存放符号, 正数为 0, 负数为 1.
     * <li>
     * 真值：因为第一位是符号位，所以机器数的形式值就不等于真正的数值。例如有符号数 10000011，其最高位 1 代表负，
     * 其真正数值是 -3 而不是形式值 131（10000011 转换成十进制等于 131）。所以，为区别起见，将带符号位的机器数
     * 对应的真正数值称为机器数的真值。
     * <li>
     * 原码：原码就是符号位加上真值的绝对值, 即用第一位表示符号, 其余位表示值.
     * <li>
     * 反码：反码的表示方法是：正数的反码是其本身，负数的反码是在其原码的基础上, 符号位不变，其余各个位取反.
     * <li>
     * 补码：补码的表示方法是：正数的补码就是其本身，负数的补码是在其原码的基础上, 符号位不变, 其余各位取反,
     * 最后 +1. (即在反码的基础上 +1)
     *
     * <p>
     * 在 Java 中，是采用补码来表示数据的，但是由于 Java byte 的范围是 [-128, 127]，所以对于 128+ 的数会变
     * 成负数，BigInteger 可以有无限多个 bit，按 big-endian 字节序去解析 byte[]，当你的补码的第一个字节是
     * 128，在 Java 用 byte 表示会变成 -128，本来是个正整数，现在被误认为负的了，导致错误的解析，正常可以用
     * int a = ((byte) 128) & 0xff 解决这个问题。在 {@link BigInteger#BigInteger(int, byte[])} )}，第一
     * 个参数 signum 代表改对象的符号，signum = 1，代表当前的数应该是个正数，-1 代表是负数，0 就是 0。这样
     * BigInteger 就能正确的解析当前的数了。
     *
     * @param fileLoc
     * @return
     */
    public static BigInteger airflowDagFileLocHash(String fileLoc) {
        byte[] strBytes = fileLoc.getBytes(StandardCharsets.UTF_8);
        byte[] sha1DigestBytes = DigestUtils.sha1(strBytes);
        byte[] cBytes = Arrays.copyOfRange(sha1DigestBytes,
                sha1DigestBytes.length - 8, sha1DigestBytes.length);
        return new BigInteger(1, cBytes).shiftRight(8);
    }

}

```