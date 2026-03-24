-- name: selectEntries :many
-- field id: number
-- field name: string
-- field description: string
SELECT id, name, description
FROM entries
WHERE
    -- param pattern: string
    description LIKE :pattern
