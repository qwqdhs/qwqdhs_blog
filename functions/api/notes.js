// 随手记 API —— 基于 Cloudflare KV 的多房间笔记存储
// GET  /api/notes?room=111  获取该码下的笔记列表
// POST /api/notes?room=111  发布一条笔记 { text, images: [dataURL] }
// 需要在 Cloudflare Pages 项目绑定 KV 命名空间，变量名 Notes_kv

const ROOM_RE = /^[a-zA-Z0-9]{1,32}$/;
const MAX_TEXT = 5000;
const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 1.2 * 1024 * 1024; // 单张 base64 上限约 1.2MB
const MAX_BODY = 6 * 1024 * 1024; // 整个请求体上限 6MB
const MAX_NOTES = 200; // 每个码最多保留的笔记条数

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function getRoom(request) {
  const room = new URL(request.url).searchParams.get('room') || '';
  return ROOM_RE.test(room) ? room : null;
}

function loadNotes(kv, key) {
  return kv.get(key).then((raw) => {
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const kv = env.Notes_kv;

  if (!kv) {
    return json({ error: '服务端未绑定 KV 存储（Notes_kv），请在 Cloudflare 控制台配置' }, 500);
  }

  const room = getRoom(request);
  if (!room) {
    return json({ error: '码格式无效（仅限 1-32 位字母数字）' }, 400);
  }
  const key = `notes:${room}`;

  if (request.method === 'GET') {
    const notes = await loadNotes(kv, key);
    return json({ notes });
  }

  if (request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: '请求体无效' }, 400);
    }

    const text = (typeof body.text === 'string' ? body.text : '').slice(0, MAX_TEXT).trim();
    let images = Array.isArray(body.images) ? body.images : [];
    images = images.filter(
      (img) => typeof img === 'string' && img.startsWith('data:image/') && img.length <= MAX_IMAGE_SIZE
    );
    if (images.length > MAX_IMAGES) images = images.slice(0, MAX_IMAGES);

    if (!text && images.length === 0) {
      return json({ error: '内容不能为空' }, 400);
    }

    let notes = await loadNotes(kv, key);
    notes.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      time: Date.now(),
      text,
      images,
    });
    if (notes.length > MAX_NOTES) notes = notes.slice(0, MAX_NOTES);

    try {
      await kv.put(key, JSON.stringify(notes));
    } catch (e) {
      return json({ error: '保存失败，内容可能过大' }, 500);
    }
    return json({ ok: true });
  }

  return json({ error: '方法不支持' }, 405);
}
