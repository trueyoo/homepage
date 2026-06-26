const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

function loadKnowledgeBase() {
  let combined = '';
  let files = [];
  try {
    files = fs.readdirSync(UPLOADS_DIR).filter((f) => f.toLowerCase().endsWith('.md'));
  } catch (err) {
    console.error('uploads 폴더를 읽을 수 없습니다:', err.message);
    return combined;
  }

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(UPLOADS_DIR, file), 'utf-8');
      combined += `\n\n--- 문서: ${file} ---\n${content}`;
    } catch (err) {
      console.error(`문서를 읽는 중 오류 발생 (${file}):`, err.message);
    }
  }

  return combined;
}

module.exports = { loadKnowledgeBase };
