const { saveLead } = require('../lib/leads');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { name, contact, channel, message } = body;

    if (!name || !contact) {
      res.status(400).json({ error: '이름과 연락처는 필수입니다.' });
      return;
    }

    await saveLead({ name, contact, channel, message });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('리드 저장 오류:', err);
    res.status(500).json({ error: err.message || '상담 신청 저장 중 오류가 발생했습니다.' });
  }
};
