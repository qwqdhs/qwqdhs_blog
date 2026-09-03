---
title: "文件下载"
date: 2026-09-01
sticky: true
draft: false
categories: ["其他"]
tags: ["下载"]
weight: 1
mainSections: ["posts"] 
cover: "/images/999.jpg"
---

# 📦 文件下载

{{< download_list >}}

<script>
document.addEventListener('DOMContentLoaded', function() {
  const downloadBtns = document.querySelectorAll('a.download-btn');

  downloadBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      const hash = this.dataset.passwordHash;
      if (!hash) return;

      e.preventDefault();

      const filename = this.dataset.filename || '文件';
      const userPwd = prompt(`请输入 “${filename}” 的下载密码：`);

      if (userPwd === null) return;

      crypto.subtle.digest('SHA-512', new TextEncoder().encode(userPwd))
        .then(buffer => {
          const hashArray = Array.from(new Uint8Array(buffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          if (hashHex === hash) {
            window.location.href = this.href;
          } else {
            alert('密码错误！');
          }
        })
        .catch(err => {
          alert('计算哈希失败，请重试。');
          console.error(err);
        });
    });
  });
});
</script>