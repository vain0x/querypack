-- name: insertEntry :execresult
-- param name: string
-- param description: string
INSERT INTO entries (name, description) VALUES (:name, :description)
