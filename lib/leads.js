const { getSupabaseClient } = require('./supabaseClient');

async function saveLead({ name, contact, channel, message }) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('상담 신청 저장소가 설정되지 않았어요. b2b@nuzzlepuzzle.co.kr로 직접 문의해 주세요.');
  }

  const { error } = await supabase.from('leads').insert({
    name: (name || '').trim() || null,
    contact: (contact || '').trim() || null,
    channel: (channel || '').trim() || null,
    message: (message || '').trim() || null,
  });

  if (error) throw error;
}

module.exports = { saveLead };
