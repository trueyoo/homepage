const { createClient } = require('@supabase/supabase-js');

let cachedClient = null;

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
      // Node 20에는 네이티브 WebSocket이 없어 realtime 클라이언트 초기화가
      // 실패한다. 이 프로젝트는 realtime을 쓰지 않지만 ws를 명시해 우회한다.
      realtime: { transport: require('ws') },
    });
  }

  return cachedClient;
}

module.exports = { getSupabaseClient };
