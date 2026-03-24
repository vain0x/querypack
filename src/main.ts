#!/usr/bin/env node
import fs from "node:fs"
import { join, resolve } from "node:path"
import { parseArgs } from "node:util"
import { generator } from "./generator.ts"
import { parsePragmas, type ParseOutput, type ParserContext } from "./parser.ts"

const VERSION = "v0.1.0"

const HELP = `querypack [OPTIONS] <INPUT>

Args:
    INPUT                   Specify input directory

Options:
    -o, --output <DIR>      Specify output directory (defaults to input)
    -h, --help              Print help
    -V, --version           Print version`

const config = {
  verbose: false
}

const logger = {
  debug(message: string, ...args: unknown[]) {
    if (config.verbose) {
      console.log(`DEBUG: ${message}`, ...args)
    }
  },
  log(message: string, ...args: unknown[]) {
    console.log(message, ...args)
  },
  warn(message: string) {
    process.stderr.write(`WARN: ${message}\n`)
  },
  error(reason: unknown) {
    if (config.verbose) {
      console.error("ERROR:", reason)
    } else {
      process.stderr.write(`ERROR: ${reason}\n`)
    }
  }
}

async function main() {
  try {
    // Parse args.
    const parsed = parseArgs({
      allowPositionals: true,
      options: {
        help: {
          type: "boolean",
          short: "h"
        },
        version: {
          type: "boolean",
          short: "V"
        },
        verbose: {
          type: "boolean",
          short: "v"
        },
        output: {
          type: "string",
          short: "o"
        },
      }
    })

    if (parsed.values.help || parsed.positionals.at(0) === "help" || process.argv.length === 2) {
      printHelp()
      return
    }

    if (parsed.values.version || parsed.positionals.at(0) === "version") {
      printVersion()
      return
    }

    if (parsed.values.verbose) {
      config.verbose = true
    }

    const inputDir = parsed.positionals.shift()
    if (!inputDir) {
      console.error("input directory required")
      process.exit(1)
    }
    const resolvedInputDir = resolve(inputDir)

    const outputDir = parsed.values.output ?? inputDir

    // Read inputs.
    const queries: { name: string; parsed: ParseOutput }[] = []
    {
      for await (const filename of fs.promises.glob("**.sql", {
        cwd: resolvedInputDir,
        exclude: value => !value.includes("node_modules")
      })) {
        const filepath = join(resolvedInputDir, filename)
        const content = await fs.promises.readFile(filepath, "utf-8")

        const ctx: ParserContext = {
          warn(lineIndex, message) {
            logger.warn(`${filename}:${lineIndex + 1}: ${message}`)
          }
        }
        const parsed = parsePragmas(ctx, content)
        queries.push({ name: filename, parsed })
      }
    }

    const generated = generator(queries)

    // Write files.
    {
      const outputDts = join(outputDir, "queries.d.ts")
      const outputJs = join(outputDir, "queries.js")
      logger.debug("writing to", { dts: outputDts, js: outputJs })
      await Promise.all([
        fs.promises.writeFile(outputDts, generated.dts),
        fs.promises.writeFile(outputJs, generated.js),
      ])
    }

    const affected = queries.length
    logger.log(`querypack: generated (${affected} queries)`)
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
}

function printHelp() {
  process.stdout.write(`${HELP}\n`)
}

function printVersion() {
  process.stdout.write(`querypack ${VERSION}\n`)
}

main()
