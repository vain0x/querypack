# querypack

Code generator from SQL files.

Prerequisites: Node.js

## Install

Not released yet.

## Cheatsheet

Pragmas:

```sql
-- name: queryName :one
-- param paramName: paramType
-- field fieldName: fieldType
```

Modes:

- `:one`, `:many`, `:exec`, `:execresult`, `:noemit`

Run:

```sh
querypack src/queries -o target/queries
```

## Basic usage

- Create a SQL file with pragmas

The query below is a simple select query that retrieves all users. If `enabledOnly: true`, disabled users aren't retrieved.

```sql
-- name: findUsers :many
-- param enabledOnly: boolean

SELECT
    -- field id: number
    users.id,
    -- field name: string
    users.name,
    -- field is_enabled: boolean
    users.is_enabled
FROM users
WHERE (:enabledOnly = 0 OR users.is_enabled = 1)
```

- Run querypack to generate code

```sh
# to process src/queries/**/*.sql
querypack src/queries -o target/queries
```

- Generated code looks roughly like this (simplified):
    - .d.ts: Types
    - .js: Values and function definitions

```ts
// file: target/queries/queries.d.ts
export interface findUsers_Params {
    enabledOnly: boolean
}
export interface findUsers_DataRow {
    id: number; name: string; is_enabled: boolean
}
export function findUsers(client: QueryPack.DbClient, params: findUsers_Params): Promise<findUsers_DataRow[]>
```

```js
// file: target/queries/queries.js
export const findUsers_Query = `
    SELECT
        users.id,
        users.name,
        users.is_enabled
    FROM users
    WHERE (:enabledOnly = 0 OR users.is_enabled = 1)`

export async function findUsers(client, params) {
    const rows = await client.many(findUsers_Query, params)
    return rows.map(function decodeRow(row) {
        return {
            id: row["id"],
            name: row["name"],
            is_enabled: !!(row["is_enabled"])
        }
    })
}
```

- Implement a `DbClient` adapter for your database client:

```ts
export class MyDbClient implements QueryPack.DbClient {
    async many(sql: string, params: any) {
        //...
    }
    // and one, exec, execresult
}
```

- Use the generated function from application code

```ts
import { findUsers } from "queries/generated"
import { withDbClient } from "./your_db_connector"

async function app() {
    await withDbClient(async (client: QueryPack.DbClient) => {
        const users = await findUsers(client, { enabledOnly: true })
        //    ^~~~~ typed

        console.log(users.map(u => `${u.id}: ${u.name}`))
    })
}
```

### Modification statements (INSERT/UPDATE/DELETE)

Use `:exec` (or `:execresult`) mode.

```sql
-- name: deleteUser :exec
-- param id: number
DELETE FROM users WHERE id = :id
```

```ts
    await deleteUser(client, { id })
```

### Specification

See [docs/spec.md](docs/spec.md) for details
