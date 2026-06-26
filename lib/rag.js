const { getSupabaseClient } = require('./supabaseClient');
const { createEmbedding } = require('./embeddings');

const MATCH_COUNT = 5;

// Supabase 미설정, 검색 결과 없음, 혹은 오류 발생 시 null을 반환해
// 호출 측(lib/chat.js)이 uploads/ 전체 파일 주입으로 폴백하도록 한다.
async function retrieveRelevantChunks(query) {
  const supabase = getSupabaseClient();
  if (!supabase || !query) return null;

  try {
    const embedding = await createEmbedding(query);
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_count: MATCH_COUNT,
    });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return data;
  } catch (err) {
    console.error('RAG 검색 실패, 전체 문서 폴백으로 전환:', err.message);
    return null;
  }
}

module.exports = { retrieveRelevantChunks };
