import * as esbuild from "esbuild"

await esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "node",
  target: "esnext",
  outfile: "bin/querypack.js",
  format: "esm",
  minify: true,
  sourcemap: true,
})
