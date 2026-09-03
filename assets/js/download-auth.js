document.addEventListener('DOMContentLoaded', function() {
  const downloadBtns = document.querySelectorAll('a.download-btn');

  downloadBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      const hash = this.dataset.passwordHash;
      // 如果没有密码哈希，直接放行（正常下载）
      if (!hash) return;

      e.preventDefault(); // 阻止默认下载行为

      const filename = this.dataset.filename || '文件';
      const userPwd = prompt(`请输入 “${filename}” 的下载密码：`);

      // 用户取消输入
      if (userPwd === null) return;

      // 计算 SHA-512
      crypto.subtle.digest('SHA-512', new TextEncoder().encode(userPwd))
        .then(buffer => {
          const hashArray = Array.from(new Uint8Array(buffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          if (hashHex === hash) {
            // 密码正确，触发下载
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