-- Supabase SQL Editor에서 그대로 실행하세요.

-- pgvector 확장 활성화
create extension if not exists vector;

-- 문서 청크 + 임베딩 (text-embedding-3-small = 1536차원)
create table if not exists documents (
  id bigserial primary key,
  source text not null,
  chunk_index int not null default 0,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

-- 유사도 검색 함수 (코사인 거리 기준 top-N)
create or replace function match_documents(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id bigint,
  source text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.source,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;

-- 문서 양이 많아지면(수천 건 이상) 아래 인덱스를 데이터 적재 후에 생성하세요.
-- 적은 양에서는 순차 스캔이 더 빠르고 정확합니다.
-- create index if not exists documents_embedding_idx
--   on documents using ivfflat (embedding vector_cosine_ops)
--   with (lists = 100);

-- 상담 신청 리드
create table if not exists leads (
  id bigserial primary key,
  name text,
  contact text,
  channel text,
  message text,
  created_at timestamptz not null default now()
);

-- 대화 로그 (질문/답변 기록)
create table if not exists chat_logs (
  id bigserial primary key,
  session_id text,
  question text,
  answer text,
  created_at timestamptz not null default now()
);

-- RLS 활성화: anon/public 키로는 직접 접근 불가, 서버의 service_role 키만 우회 접근
alter table documents enable row level security;
alter table leads enable row level security;
alter table chat_logs enable row level security;
