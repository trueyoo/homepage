const { getSupabaseClient } = require('./supabaseClient');

// best-effort 기록: 실패해도 챗봇 응답 흐름에는 영향을 주지 않는다.
async function logChat(sessionId, question, answer) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase.from('chat_logs').insert({
      session_id: sessionId || null,
      question: question || null,
      answer: answer || null,
    });
    if (error) throw error;
  } catch (err) {
    console.error('대화 로그 저장 실패(무시됨):', err.message);
  }
}

module.exports = { logChat };
