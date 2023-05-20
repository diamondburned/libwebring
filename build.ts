#!/usr/bin/env -S deno run -A
import * as esbuild from "https://deno.land/x/esbuild@v0.17.18/mod.js";
import sass from "https://deno.land/x/denosass@1.0.6/mod.ts";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.7.0/mod.ts";

await Deno.remove("dist", { recursive: true }).catch(() => {});
await Deno.mkdir("dist", { recursive: true });

const scssFile = await Deno.readTextFile("lib/webring.scss");
// When will Deno-Rust wrapper libraries ever have actually nice function names?
// Probably never lmfao. They couldn't even be bothered to wrap the functions?
const css = sass(scssFile, { style: "compressed" }).to_string() as string;
await Deno.writeTextFile("dist/webring.css", css);

await esbuild.build({
  plugins: [...denoPlugins()],
  entryPoints: ["lib/webring.ts"],
  outfile: "dist/webring.js",
  format: "esm",
  bundle: true,
  minify: true,
  sourcemap: true,
});

esbuild.stop();
