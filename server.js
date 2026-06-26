require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const { getChatResponse } = require('./lib/chat');
const { fetchInstagramFeed } = require('./lib/instagram');
const { saveLead } = require('./lib/leads');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function handleChatApi(req, res) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', async () => {
    try {
      const { messages, sessionId } = JSON.parse(body || '{}');
      if (!Array.isArray(messages)) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'messages 배열이 필요합니다.' }));
        return;
      }
      const reply = await getChatResponse(messages, sessionId);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ reply }));
    } catch (err) {
      console.error('챗봇 처리 오류:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: '챗봇 응답 생성 중 오류가 발생했습니다.' }));
    }
  });
}

async function handleInstagramApi(req, res) {
  try {
    const items = await fetchInstagramFeed();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ items }));
  } catch (err) {
    console.error('인스타그램 피드 조회 오류:', err);
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: '인스타그램 피드를 불러오지 못했습니다.' }));
  }
}

function handleLeadApi(req, res) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', async () => {
    try {
      const { name, contact, channel, message } = JSON.parse(body || '{}');
      if (!name || !contact) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: '이름과 연락처는 필수입니다.' }));
        return;
      }
      await saveLead({ name, contact, channel, message });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      console.error('리드 저장 오류:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: err.message || '상담 신청 저장 중 오류가 발생했습니다.' }));
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') {
    handleChatApi(req, res);
    return;
  }
  if (req.method === 'GET' && req.url === '/api/instagram') {
    handleInstagramApi(req, res);
    return;
  }
  if (req.method === 'POST' && req.url === '/api/lead') {
    handleLeadApi(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
