# Specification

TODO

## Pragma syntax

Use SQL line comments

- `-- name: <NAME> [MODE]` (e.g. `-- name: searchPosts :many`)
    - MODE:
        - `:many`: retrieve multiple rows (default)
        - `:one`: retrieve single row (`SELECT` or `INSERT ... RETURNING`)
        - `:exec`: execute a statement (insert/update/delete)
        - `:execresult`: execute an insert statement returning its result (for MySQL)
        - `:noemit`: only query text and type definitions
- `param <NAME>: <TYPE>` (e.g. `-- param id: number`)
    - defines a query's parameter
- `field <NAME>: <TYPE>` (e.g. `-- field name: string`)
    - defines a field of output rows

Note pragma comments must be at the start of each line.

## Generated declarations and definitions

```ts
// file: generated/queries.d.ts
export interface queryname_Params {
    // (foreach param)
    paramName: ParamType
}

export interface queryname_DataRow {
    // (foreach field)
    fieldName: FieldType
}

export function queryname_decodeRow(row: any): queryname_DataRow
```

```js
// file: generated/queries.js

// the SQL query text
export const queryname_Query = "..."

export function queryname_decodeRow(row): queryname_DataRow {
    return {
        field1: decode(row.field1),
        ...
    }
}
```

decoding expressions

- type `boolean`: `!!expr`
- type `bigint`: `BigInt(expr)`

## DbClient

```ts
declare global {
    namespace QueryPack {
        interface DbClient {
            // methods for each mode
            one(sql: string, params: any): Promise<any>
            many(sql: string, params: any): Promise<any[]>
            exec(sql: string, params: any): Promise<{ affectedRows: number }>
            execresult(sql: string, params: any): Promise<{ insertId: number }>
        }
    }
}
```

## CLI

```
querypack [OPTIONS] <INPUT>

Args:
    INPUT                   Specify input directory

Options:
    -o, --output <DIR>      Specify output directory (defaults to input)
    -h, --help              Print help
    -V, --version           Print version
```

example: Generate code based on `src/queries/**/*.sql`, write to `target/queries/generated.{d.ts,js}`.

```sh
querypack src/queries -o target/queries
```

## comparison with sqlc

querypack is inspired with sqlc (sql-to-code compiler)

- querypack is much simpler
    - no schema, no multiple host language support
- querypack is not type-safe
