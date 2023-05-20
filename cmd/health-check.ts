#!/usr/bin/env -S deno run -A
import * as flags from "std/flags/mod.ts";
import {
  guessStatusSrc,
  WebringData,
  WebringStatusData,
} from "#/lib/webring.ts";

const args = flags.parse(Deno.args, {
  boolean: ["help", "check-webring"],
  string: ["webring-input", "status-output"],
  alias: {
    help: "h",
    "webring-input": "i",
    "status-output": "o",
  },
  default: {
    "webring-input": "webring.json",
    "check-webring": true,
  },
});

if (args.help) {
  console.log(
    `
Usage: health-check.ts [options]
Options:
  -h, --help
    Show this help message and exit.
  -i, --webring-input <path>
    Path to the webring input file. (default: webring.json)
  -o, --status-output <path>
    Path to the status output file. (default: webring.status.json)
  --check-webring
    Check if a page contains the same webring element (not recommended).
`.trim()
  );
  Deno.exit(0);
}

if (!args["status-output"]) {
  args["status-output"] = guessStatusSrc(args["webring-input"] as string);
}

const dataFile = await Deno.readTextFile(args["webring-input"] as string);
const data = JSON.parse(dataFile) as WebringData;

const statuses = await Promise.all(
  data.ring.map(async (link) => {
    try {
      const url = link.link.includes("://")
        ? link.link
        : `https://${link.link}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`unexpected response ${resp.status}`);
      }
      console.debug(`${link.link} reachable`);
      return true;
    } catch (err) {
      console.log(`${link.link} unreachable: ${err}`);
      return false;
    }
  })
);

const anomalies: WebringStatusData["anomalies"] = {};
for (const [i, link] of data.ring.entries()) {
  const status = statuses[i];
  if (status) {
    continue;
  }

  anomalies[link.link] = {
    dead: true,
  };
}

const statusData: WebringStatusData = {
  version: 1,
  anomalies,
  lastUpdated: new Date().toISOString(),
};

const statusFile = JSON.stringify(statusData, null, 2);
await Deno.writeTextFile(args["status-output"] as string, statusFile);
