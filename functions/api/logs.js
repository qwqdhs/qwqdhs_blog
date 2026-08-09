export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response(JSON.stringify({ error: '缺少 userId 参数' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const UNIVERSE_ID = env.UNIVERSE_ID || '9787384742';
  const API_KEY = env.LOG_API_KEY;
  const DATASTORE_NAME = 'ActionLogs';

  if (!API_KEY) {
    console.error('环境变量未设置: LOG_API_KEY');
    return new Response(JSON.stringify({ error: '服务器配置错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiUrl = `https://apis.roblox.com/datastores/v1/universes/${UNIVERSE_ID}/standard-datastores/datastore/entries/entry?datastoreName=${DATASTORE_NAME}&entryKey=${userId}&scope=global`;

  try {
    console.log(`[Logs] 查询玩家 ${userId} 的日志...`);
    const response = await fetch(apiUrl, {
      headers: { 'x-api-key': API_KEY },
    });

    if (response.status === 404) {
      console.log(`[Logs] 玩家 ${userId} 暂无日志`);
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

    // 直接解析返回的数组（不是 Base64 编码！）
    const logs = await response.json();
    console.log(`[Logs] 成功获取玩家 ${userId} 的日志，共 ${Array.isArray(logs) ? logs.length : 0} 条`);

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