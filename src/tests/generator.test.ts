import { strictEqual } from "node:assert"
import { test } from "node:test"
import { generator, stripTemplate } from "../generator.ts"
import { parsePragmas, type ParserContext } from "../parser.ts"

const success = (input: string) => {
  const ctx: ParserContext = {
    warn(lineIndex, message) {
      throw new Error(`${lineIndex + 1}: ${message}`)
    }
  }
  const parsed = parsePragmas(ctx, input)
  const output = generator([{ name: "", parsed }])

  // function removePrefix(text: string) {
  //   return text.replace(/^\/\/.*\n+(?:const __unescape.*\n)?/, "")
  // }

  function maskQueryText(text: string) {
    return text.replace(/__unescape\(`.*`\)/, "__unescape(\`****\`)")
  }

  output.dts = stripTemplate(output.dts)
  output.js = maskQueryText(stripTemplate(output.js))
  return output
}

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
    AND updated_at >= :since`

  const generated = success(INPUT)
  strictEqual(generated.dts, `export const findEntries_Query: string

export interface findEntries_Params {
  pattern: string
  since: Date
}

export interface findEntries_DataRow {
  id: number
  value: string
}

export function findEntries_decodeRow(row: any): findEntries_DataRow

export function findEntries(client: QueryPack.DbClient, params?: findEntries_Params): Promise<findEntries_DataRow>
`)

  strictEqual(generated.js, `export const findEntries_Query = __unescape(\`****\`)

export function findEntries_decodeRow(row) {
  return {
    id: +row.id,
    value: \`\${row.value}\`
  }
}

export async function findEntries(client, params) {
  return findEntries_decodeRow(await client.one(findEntries_Query, params))
}
`)
})
