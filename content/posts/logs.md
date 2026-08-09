---
title: "操作日志"
date: 2026-08-09
draft: false
sitemap:
  exclude: true
build:
  list: false      # 不在列表（首页、归档、分类等）中显示
  render: true     # 仍然生成页面文件
  publishResources: true
---

<style>
/* 页面样式，不影响博客主体 */
.logs-container {
  max-width: 900px;
  margin: 60px auto;
  padding: 0 20px;
  font-family: monospace;
}
.logs-container h1 {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 20px;
}
.logs-input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.logs-input-group input {
  flex: 1;
  min-width: 200px;
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background: rgba(255,255,255,0.8);
}
.logs-input-group button {
  padding: 10px 24px;
  background: #00bfff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.logs-input-group button:hover {
  background: #0099cc;
}
#logs-output {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(4px);
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.3);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  white-space: pre-wrap;
  max-height: 600px;
  overflow: auto;
  font-size: 0.9rem;
  line-height: 1.6;
}
#logs-output.loading {
  color: #888;
}
</style>

<div class="logs-container">
  <h1>📋 操作日志</h1>
  <div class="logs-input-group">
    <input type="text" id="userIdInput" placeholder="输入玩家 UserId" />
    <button onclick="fetchLogs()">查询</button>
  </div>
  <div id="logs-output" class="loading">输入玩家 ID 后点击查询</div>
</div>

<script>
async function fetchLogs() {
  const userId = document.getElementById('userIdInput').value.trim();
  const output = document.getElementById('logs-output');
  
  if (!userId) {
    output.textContent = '⚠️ 请输入玩家 UserId';
    output.className = '';
    return;
  }

  output.textContent = '🔄 加载中...';
  output.className = 'loading';

  try {
    const res = await fetch(`/api/logs?userId=${userId}`);
    const data = await res.json();
    
    if (data.error) {
      output.textContent = '❌ ' + data.error;
    } else if (data.data && Array.isArray(data.data)) {
      output.textContent = data.data.map(item => 
        `[${new Date(item.time * 1000).toLocaleString()}] ${item.action}${item.details ? ' - ' + item.details : ''}`
      ).join('\n') || '暂无操作记录';
    } else {
      output.textContent = JSON.stringify(data, null, 2);
    }
    output.className = '';
  } catch (e) {
    output.textContent = '❌ 加载失败: ' + e.message;
    output.className = '';
  }
}

// 按回车键触发查询
document.getElementById('userIdInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') fetchLogs();
});
</script>