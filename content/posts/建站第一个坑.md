---
title: "建站踩的第一个坑"
date: 2026-07-20
draft: false
categories: ["技术"]
tags: ["杂谈", "建站", "CloudFlare"]
mainSections: ["posts"] 
cover: "/images/111.jpeg"   # ← 加上这一行
---

### 前情提要
众所不知，本站是CloudFlare+Hugo+reimu搭建的。
## 正文
在注册CloudFlare时我遇到了一个非常恶心的问题，邮箱收不到验证码，我重发了好几次直到给我锁了一小时。

目前已知outlook和hotmail都收不了，网上也没找到能解决的教程，貌似是cloudflare的发信ip被outlook拉黑了。

我尝试过的方法：

1.[添加安全发件人、创建收件箱规则](https://learn.microsoft.com/zh-cn/answers/questions/4550208/outlook-cloudflare) --无效

2.[添加安全发件人](https://learn.microsoft.com/zh-cn/answers/questions/5542215/outlook) --无效

至于我的解决方法的话，我的解决方法是用gmail邮箱。
## 后续
到本篇文章发布时，该问题并未修复。