const OpenAI = require('openai');

const EMBEDDING_MODEL = 'text-embedding-3-small';

async function createEmbedding(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
  }

  const client = new OpenAI({ apiKey });
  const res = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  return res.data[0].embedding;
}

module.exports = { createEmbedding, EMBEDDING_MODEL };
