WITH deleted_conversations AS (
    DELETE FROM "conversation"
    WHERE "status" = 'PENDING' AND "createdAt" < NOW() - INTERVAL '1 day'
    RETURNING *
),
deleted_memories AS (
    DELETE FROM "memory"
    WHERE "status" = 'PENDING' AND "createdAt" < NOW() - INTERVAL '1 day'
    RETURNING *
)
SELECT 'conversation' AS table_name, count(*) AS deleted_count FROM deleted_conversations
UNION ALL
SELECT 'memory' AS table_name, count(*) AS deleted_count FROM deleted_memories;
