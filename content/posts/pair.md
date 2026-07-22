---
title: "给自己看的pair用法"
date: 2026-07-20
draft: false
categories: ["技术"]
tags: ["C++", "NOI", "自用"]
mainSections: ["posts"] 
---

# 主要内容
## Pair
### 语法
默认用法
```cpp
pair<类型,类型>变量名;
```
结合vector的用法
```cpp
vector<pair<类型,类型>>变量名(大小)
```


### e.g:
```cpp
cin>>n ;
vector<pair<int, int>>farmers(n);
```
## 排序(我指vector pair的sort排序)
### 语法
默认（从小到大）
```cpp
sort(变量名.begin(),变量名.end());
```
从大到小
```cpp
sort(变量名.begin(),变量名.end(),greater<pair<int,int>>());
```
**注意！默认排序按 first 升序，若 first 相等则按 second 升序。**

按照pair中的数据进行排序

①按second升序
```cpp
sort(变量名.begin(),变量名.end(),[](auto &a, auto &b)
{
    return a.second<b.second;
});
```
②按second降序
```cpp
sort(变量名.begin(),变量名.end(),[](auto &a, auto &b)
{
    return a.second>b.second;
});
```

# 相关内容
## 结构化绑定
### 语法
```cpp
for(auto[x,y]:v)
{
    //使用x和y
}
```
### 结合pair的结构化绑定e.g
```cpp
  vector<pair<int,string>>v={{1,"apple"},{2,"banana"},{3,"cherry"}};
  for(auto [x,y] :v)
{
        cout<<x<< ": "<<y<<endl;
    // 输出：
    // 1: apple
    // 2: banana
    // 3: cherry
}
```