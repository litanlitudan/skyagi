-- Create a function to search for documents
drop function if exists match_documents;
create function match_documents (
  query_embedding vector(1536),
  match_count int,
  filter jsonb DEFAULT '{}'
) returns table (
  id uuid,
  content text,
  metadata jsonb,
  score float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    d.id,
    d.content,
    d.metadata,
    ((1 - 0.01) ^ EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - metadata->>'last_access_time')::timestamp)/3600)
      + (metadata->>'importance')::float
      + (1 - (d.embedding <=> query_embedding)) AS score
  from documents AS d
  where metadata @> filter
  order by score desc
  limit match_count;
end;
$$;