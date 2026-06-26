const OpenAI = require('openai');
const { loadKnowledgeBase } = require('./knowledge');
const { retrieveRelevantChunks } = require('./rag');
const { logChat } = require('./chatLog');

const MODEL = 'gpt-5.4-mini';
const MAX_HISTORY = 10;

function buildSystemPrompt(relevantChunks) {
  const context = relevantChunks
    ? relevantChunks.map((c) => `[${c.source}]\n${c.content}`).join('\n\n---\n\n')
    : loadKnowledgeBase() || '(등록된 문서가 없습니다)';

  return `당신은 "너즐 도우미"라는 이름의 너즐퍼즐(Nuzzle Puzzle) 공식 챗봇입니다. 너즐퍼즐은 B2B 프리미엄 반려동물 식품 브랜드입니다.

답변 규칙:
1. 자기소개나 일상적인 대화형 질문(이름이 뭔지, 무엇을 하는 챗봇인지 등)에는 "너즐 도우미"로서 자연스럽고 친근하게 답하세요.
2. 서비스·제품·정책 관련 질문에는 아래 [참고 문서]에 담긴 내용만 근거로 답하세요. 문서에 없는 내용이면 추측하지 말고 "정확한 답변을 위해 무료 상담을 신청해 주세요. (b2b@nuzzlepuzzle.co.kr)"라고 안내하세요.
3. 서비스와 무관한 질문(날씨, 일반 상식, 다른 주제 등)에는 "죄송하지만 너즐퍼즐 서비스 관련 질문에만 답변드릴 수 있어요."라고 안내하세요.
4. [참고 문서]에 없는 정보는 절대로 창작하거나 추측해서 답변하지 마세요.
5. 답변은 한국어로, 간결하고 친절한 말투로 작성하세요.

[참고 문서 시작]
${context}
[참고 문서 끝]`;
}

async function getChatResponse(messages, sessionId) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
  }

  const trimmedHistory = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY);

  const lastUserMessage = [...trimmedHistory].reverse().find((m) => m.role === 'user')?.content || '';

  // Supabase 미설정/검색 결과 없음/오류 시 retrieveRelevantChunks가 null을 반환 →
  // buildSystemPrompt가 uploads/ 전체 파일 주입으로 자동 폴백한다.
  const relevantChunks = lastUserMessage ? await retrieveRelevantChunks(lastUserMessage) : null;

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'system', content: buildSystemPrompt(relevantChunks) }, ...trimmedHistory],
    temperature: 0.4,
  });

  const reply = completion.choices[0]?.message?.content?.trim() || '';

  logChat(sessionId, lastUserMessage, reply);

  return reply;
}

module.exports = { getChatResponse };
