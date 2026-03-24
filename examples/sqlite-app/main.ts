#!/usr/bin/env node
import { deepEqual, strictEqual } from "node:assert"
import { DatabaseSync } from "node:sqlite"
import { insertEntry, selectEntries } from "./queries/queries.ts"

class SqliteClient implements QueryPack.DbClient {
  db: DatabaseSync

  constructor(db: DatabaseSync) {
    this.db = db
  }

  async one(text: string, params: any): Promise<any> {
    const stmt = this.db.prepare(text)
    return stmt.get(params)
  }

  async many(text: string, params: any): Promise<any> {
    const stmt = this.db.prepare(text)
    return [...stmt.iterate(params)]
  }

  async exec(text: string, params: any): Promise<QueryPack.ExecOutput> {
    const stmt = this.db.prepare(text)
    const changes = stmt.run(params)
    return { affectedRows: changes.changes as number }
  }

  async execresult(text: string, params: any): Promise<QueryPack.ExecResultOutput> {
    const stmt = this.db.prepare(text)
    const changes = stmt.run(params)
    return { insertId: changes.lastInsertRowid as number }
  }
}

async function main() {
  // in-memory database
  const database = new DatabaseSync(":memory:")
  try {
    // Create table.
    database.exec(`
      CREATE TABLE entries(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT
      )
    `)

    // Insert new data.
    const data: { id: number | undefined; name: string; description: string }[] = [
      { id: undefined, name: "Node.js", description: "JS runtime environment" },
      { id: undefined, name: "TypeScript", description: "Statically-typed alt-JS language" },
      { id: undefined, name: "querypack", description: "some code generator" }
    ]

    const client = new SqliteClient(database)

    for (const entry of data) {
      entry.id = (await insertEntry(client, {
        name: entry.name,
        description: entry.description
      })).insertId
    }

    // Retrieve rows.
    const searched = await selectEntries(client, {
      pattern: "%JS%"
    })

    strictEqual(searched.length, 2)
    deepEqual(searched.map(e => e.name), [
      "Node.js",
      "TypeScript"
    ])
    console.log(searched)

    console.log("finish")
  } finally {
    database.close()
  }
}

main()
