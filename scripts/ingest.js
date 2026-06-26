require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { createEmbedding } = require('../lib/embeddings');
const { getSupabaseClient } = require('../lib/supabaseClient');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const CHUNK_SIZE = 1000;

function chunkText(text) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks = [];
  let current = '';

  for (const p of paragraphs) {
    const candidate = current ? `${current}\n\n${p}` : p;
    if (candidate.length > CHUNK_SIZE && current) {
      chunks.push(current);
      current = p;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);

  return chunks;
}

async function main() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 .env에 설정되어 있어야 합니다.');
    process.exit(1);
  }

  const files = fs.readdirSync(UPLOADS_DIR).filter((f) => f.toLowerCase().endsWith('.md'));
  if (files.length === 0) {
    console.log('uploads/ 폴더에 .md 파일이 없습니다.');
    return;
  }

  console.log('기존 documents 데이터를 정리합니다...');
  const { error: delError } = await supabase.from('documents').delete().gte('id', 0);
  if (delError) console.error('기존 데이터 삭제 실패:', delError.message);

  for (const file of files) {
    const content = fs.readFileSync(path.join(UPLOADS_DIR, file), 'utf-8');
    const chunks = chunkText(content);
    console.log(`${file}: ${chunks.length}개 청크로 분할`);

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await createEmbedding(chunks[i]);
      const { error } = await supabase.from('documents').insert({
        source: file,
        chunk_index: i,
        content: chunks[i],
        embedding,
      });

      if (error) {
        console.error(`  ✗ 삽입 실패 (#${i}):`, error.message);
      } else {
        console.log(`  ✓ chunk ${i + 1}/${chunks.length} 저장 완료`);
      }
    }
  }

  console.log('임베딩 적재가 완료되었습니다.');
}

main().catch((err) => {
  console.error('적재 스크립트 오류:', err);
  process.exit(1);
});
