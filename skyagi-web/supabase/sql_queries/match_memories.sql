-- Create a function to search for memories
drop function if exists match_memories;
create function match_memories (
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
    e.id,
    e.content,
    e.metadata,
    ((1 - 0.01) ^ EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - e.metadata->>'last_access_time')::timestamp)/3600)
      + (e.metadata->>'importance')::float
      + (1 - (e.embedding <=> query_embedding)) AS score
  from memory AS e
  where metadata @> filter
  order by score desc
  limit match_count;
end;
$$;