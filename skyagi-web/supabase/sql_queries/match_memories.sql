-- Create a function to search for memories
drop function if exists match_memories;
create or replace function match_memories (
  match_count int,
  query_embedding vector(1536),
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
    id,
    content,
    metadata,
    (power((1 - 0.01), EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - (to_timestamp(metadata->>'last_access_time', 'YYYY-MM-DDTHH24:MI:SS.MS') AT TIME ZONE 'America/Los_Angeles')))/3600))
      + (metadata->>'importance')::float
      + (1 - (embedding <=> query_embedding)) AS score
  from memory
  where metadata @> filter 
  order by score desc
  limit match_count;
end;
$$;