import { deepStrictEqual, strictEqual } from "node:assert"
import { describe, test } from "node:test"
import { parsePragmas, type ParserContext } from "../parser.ts"

class TestParserContext implements ParserContext {
  warnings: string[] = []
  warn(lineIndex: number, message: string) {
    this.warnings.push(`${lineIndex + 1}: ${message}`)
  }
}

describe("parsePragmas", () => {
  test("basic", () => {
    const INPUT = `-- name: findEntries :one
  -- param pattern: string
  -- param since: Date

  SELECT
    -- field id: number
    id,
    -- field value: string
    value
  FROM entries
  WHERE
    value LIKE :pattern
    AND updated_at >= :since
  `

    const ctx = new TestParserContext()
    const parsed = parsePragmas(ctx, INPUT)
    deepStrictEqual(ctx.warnings, [])
    strictEqual(parsed.name, "findEntries")
    strictEqual(parsed.mode, "one")
    deepStrictEqual(parsed.params, [
      { name: "pattern", type: "string" },
      { name: "since", type: "Date" }
    ])
    deepStrictEqual(parsed.fields, [
      { name: "id", type: "number" },
      { name: "value", type: "string" },
    ])
  })

  describe("warning", () => {
    const withWarning = (cb: (ctx: ParserContext) => void): string[] => {
      const ctx = new TestParserContext()
      cb(ctx)
      return ctx.warnings
    }

    test("duplicated mode", () => {
      deepStrictEqual(withWarning(ctx => {
        parsePragmas(ctx, `-- name: queryName :one
-- name: anotherName :one
        `)
      }), [
        "2: name already defined"
      ])
    })

    // TODO: add more tests
  })
})
