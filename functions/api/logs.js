export async function onRequest(context) {
  const { request, env } = context;
  
  const UNIVERSE_ID = env.UNIVERSE_ID || '9787384742';
  const API_KEY = env.LOG_API_KEY;
  const DATASTORE_NAME = 'ActionLogs';
  const LOG_KEY = 'GlobalActionLogs';  // 固定键名

  if (!API_KEY) {
    console.error('环境变量未设置: LOG_API_KEY');
    return new Response(JSON.stringify({ error: '服务器配置错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 构建 Roblox API URL（读取全局日志条目）
  const apiUrl = `https://apis.roblox.com/datastores/v1/universes/${UNIVERSE_ID}/standard-datastores/datastore/entries/entry?datastoreName=${DATASTORE_NAME}&entryKey=${LOG_KEY}&scope=global`;

  try {
    console.log(`[Logs] 正在获取全局操作日志...`);
    const response = await fetch(apiUrl, {
      headers: { 'x-api-key': API_KEY },
    });

    if (response.status === 404) {
      console.log(`[Logs] 暂无日志`);
      return new Response(JSON.stringify({ data: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Logs] Roblox API 错误 (${response.status}): ${errorText}`);
      return new Response(JSON.stringify({ error: `Roblox API 错误: ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 直接解析返回的数组
    const logs = await response.json();
    
    // 按时间倒序排列（最新的在前面）
    if (Array.isArray(logs)) {
      logs.sort((a, b) => b.time - a.time);
    }
    
    console.log(`[Logs] 成功获取日志，共 ${Array.isArray(logs) ? logs.length : 0} 条`);

    return new Response(JSON.stringify({ data: logs }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`[Logs] 异常: ${error.message}\n${error.stack}`);
    return new Response(JSON.stringify({ error: '服务器内部错误: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}