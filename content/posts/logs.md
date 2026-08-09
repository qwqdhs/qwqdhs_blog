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
.logs-container {
  max-width: 1000px;
  margin: 60px auto;
  padding: 0 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.logs-container h1 {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 10px;
}
.logs-container .subtitle {
  color: #666;
  margin-bottom: 24px;
  font-size: 0.95rem;
}
.logs-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
.logs-table th {
  background: #f8f9fa;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
}
.logs-table td {
  padding: 10px 16px;
  border-bottom: 1px solid #f1f3f5;
  font-size: 0.95rem;
}
.logs-table tr:hover {
  background: #f8f9fa;
}
.logs-table .action-increase {
  color: #2e7d32;
}
.logs-table .action-decrease {
  color: #c62828;
}
.logs-table .xp-change {
  font-weight: 600;
}
#logs-status {
  text-align: center;
  padding: 40px;
  color: #888;
}
.loading-spinner {
  display: inline-block;
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #00bfff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

<div class="logs-container">
  <h1>📋 操作日志</h1>
  <p class="subtitle">显示所有玩家的 XP 变更记录（最近 500 条）</p>
  
  <div id="logs-container">
    <div id="logs-status">加载中...</div>
  </div>
</div>

<script>
async function fetchAllLogs() {
  const container = document.getElementById('logs-container');
  const statusDiv = document.getElementById('logs-status');

  try {
    const res = await fetch('/api/logs');
    const data = await res.json();

    if (data.error) {
      statusDiv.innerHTML = '❌ ' + data.error;
      return;
    }

    if (!data.data || data.data.length === 0) {
      statusDiv.innerHTML = '📭 暂无操作记录';
      return;
    }

    // 构建表格
    let html = `
      <table class="logs-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>操作者</th>
            <th>目标玩家</th>
            <th>操作</th>
            <th>变化量</th>
            <th>当前 XP</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.data.forEach(log => {
      const time = new Date(log.time * 1000).toLocaleString('zh-CN');
      const actionClass = log.action === '增加' ? 'action-increase' : 'action-decrease';
      const sign = log.amount >= 0 ? '+' : '';
      const emoji = log.action === '增加' ? '📈' : '📉';

      html += `
        <tr>
          <td>${time}</td>
          <td>${log.adminName}</td>
          <td>${log.targetName}</td>
          <td class="${actionClass}">${emoji} ${log.action}</td>
          <td class="xp-change ${actionClass}">${sign}${log.amount}</td>
          <td>${log.currentXP}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;

  } catch (e) {
    statusDiv.innerHTML = '❌ 加载失败: ' + e.message;
  }
}

// 页面加载时自动获取日志
fetchAllLogs();
</script>