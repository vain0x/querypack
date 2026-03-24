-- name: deleteEntry :exec
DELETE FROM entries
WHERE
    -- param id: number
    id = :id
