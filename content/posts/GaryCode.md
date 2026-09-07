---
title: "格雷码"
date: 2026-09-07
draft: false
categories: ["技术"]
tags: ["C++", "NOI", "自用", "教程"]
mainSections: ["posts"] 
cover: "/images/001.png"
---

## 格雷码的介绍
典型的二进制格雷码（Binary Gray Code）简称格雷码，因1953年公开的弗兰克·格雷（Frank Gray，18870913-19690523）专利“Pulse Code Communication”而得名，当初是为了通信，现在则常用于模拟－数字转换和位置－数字转换中。法国电讯工程师波特（Jean-Maurice-Émile Baudot，18450911-19030328）在1880年曾用过的波特码相当于它的一种变形。1941年George Stibitz设计的一种8元二进制机械计数器正好符合格雷码计数器的计数规律。[^baidu]
## 格雷码的转换
### 异或转换
1. 先转换为二进制
2. 最高位直接保留
3. 其余位（从次高位到最低位）每一位与它的左边相邻高位异或
4. 得到格雷码
#### e.g
22<sub>(10)</sub> →  10110<sub>(2)</sub>

![gray](/images/eg/gr.png)

### 码表

![mb](/images/eg/mb.png)

## 参考资料

[^baidu]: [百度百科](https://baike.baidu.com/item/%E6%A0%BC%E9%9B%B7%E7%A0%81/6510858)