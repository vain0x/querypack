export interface ParserContext {
  warn(lineIndex: number, message: string): void
}

export interface ParseOutput {
  name: string
  text: string
  mode: string
  params: { name: string; type: string }[]
  fields: { name: string; type: string }[]
}

export function parsePragmas(ctx: ParserContext, text: string): ParseOutput {
  const output: ParseOutput = {
    name: "",
    text,
    mode: "many",
    params: [],
    fields: []
  }

  for (const [lineIndex, lineText] of text.split(/\r?\n/g).entries()) {
    let line = lineText.trimStart()
    if (!line || !line.startsWith("--")) continue

    const head = line.match(PRAGMA_REGEXP)
    if (!head) continue

    // content of comments (after `--`)
    const pragma = line.slice(head[1]!.length)
    // line == "  -- <keyword> ...: ..."
    const keyword = head[2]!

    switch (keyword) {
      case "name": {
        const m = pragma.match(NAME_REGEXP)
        if (!m) {
          ctx.warn(lineIndex, "invalid pragma syntax: name")
          continue
        }
        if (output.name) {
          ctx.warn(lineIndex, "name already defined")
          continue
        }
        const name = m[1]!
        const mode = m[2] ?? ""
        output.name = name
        output.mode = mode
        continue
      }
      case "param": {
        const m = pragma.match(PARAM_REGEXP)
        if (!m) {
          ctx.warn(lineIndex, "invalid pragma syntax: param")
          continue
        }
        const name = m[1]!, type = m[2]!

        if (output.params.some(p => p.name === name)) {
          ctx.warn(lineIndex, `duplicated param name: '${name}'`)
          continue
        }
        output.params.push({ name, type })
        continue
      }
      case "field": {
        const m = pragma.match(FIELD_REGEXP)
        if (!m) {
          ctx.warn(lineIndex, "invalid pragma syntax: field")
          continue
        }
        const name = m[1]!, type = m[2]!

        if (output.fields.some(p => p.name === name)) {
          ctx.warn(lineIndex, `duplicated field name: '${name}'`)
          continue
        }
        output.fields.push({ name, type })
        continue
      }
    }
  }
  return output
}

const PRAGMA_REGEXP = /^(--\s*)([_\w]+)\b/
const NAME_REGEXP = /^name: ([_\w]+)(?:\s*:([_\w]+))?$/
const PARAM_REGEXP = /^param ([_\w]+):\s*(.*)$/
const FIELD_REGEXP = /^field ([_\w]+):\s*(.*)$/
