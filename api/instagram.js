const { fetchInstagramFeed } = require('../lib/instagram');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const items = await fetchInstagramFeed();
    res.status(200).json({ items });
  } catch (err) {
    console.error('인스타그램 피드 조회 오류:', err);
    res.status(500).json({ error: '인스타그램 피드를 불러오지 못했습니다.' });
  }
};
