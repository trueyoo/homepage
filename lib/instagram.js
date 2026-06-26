const GRAPH_VERSION = 'v19.0';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10분 캐시 (Graph API 호출 빈도 제한 대비)
const FETCH_LIMIT = 18; // 6개씩 3페이지 분량을 미리 가져와 "더 보기" 화살표로 스크롤

let cache = { data: null, fetchedAt: 0 };

async function fetchInstagramFeed() {
  const now = Date.now();
  if (cache.data && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igUserId = process.env.INSTAGRAM_USER_ID;

  if (!accessToken || !igUserId) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN 또는 INSTAGRAM_USER_ID가 설정되지 않았습니다.');
  }

  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/media?fields=${fields}&limit=${FETCH_LIMIT}&access_token=${accessToken}`;

  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error?.message || 'Instagram Graph API 요청에 실패했습니다.');
  }

  const items = (json.data || []).map((item) => ({
    id: item.id,
    caption: item.caption || '',
    permalink: item.permalink,
    mediaType: item.media_type,
    imageUrl: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url,
    timestamp: item.timestamp,
  }));

  cache = { data: items, fetchedAt: now };
  return items;
}

module.exports = { fetchInstagramFeed };
