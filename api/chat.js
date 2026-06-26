const { getChatResponse } = require('../lib/chat');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { messages, sessionId } = body;

    if (!Array.isArray(messages)) {
      res.status(400).json({ error: 'messages 배열이 필요합니다.' });
      return;
    }

    const reply = await getChatResponse(messages, sessionId);
    res.status(200).json({ reply });
  } catch (err) {
    console.error('챗봇 처리 오류:', err);
    res.status(500).json({ error: '챗봇 응답 생성 중 오류가 발생했습니다.' });
  }
};
