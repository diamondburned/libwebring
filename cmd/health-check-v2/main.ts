#!/usr/bin/env -S deno run -A
import * as flags from "std/flags/mod.ts";
import { Result, Scraper } from "./webring-scrape.ts";
import { checkAlive } from "./webring-fetch.ts";
import {
  guessStatusSrc,
  WebringData,
  WebringLinkStatus,
  WebringStatusData,
} from "#/lib/webring.ts";

const args = flags.parse(Deno.args, {
  boolean: ["help"],
  string: [
    "webring-input",
    "status-output",
    "remote-source",
    "scrape-for-webring-src",
    "scrape-timeout",
  ],
  alias: {
    help: "h",
    "webring-input": "i",
    "status-output": "o",
  },
  default: {
    "webring-input": "webring.json",
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
  --scrape-for-webring-src <url>
      Scrape the page for the given URL to a webring source. This is used to
      fill in the "missingWebring" field in the status output.
  --scrape-timeout <ms>
      Timeout for the scrape request. (default: 10000)
`.trim()
  );
  Deno.exit(0);
}

const webringInput = args["webring-input"] as string;
const statusOutput =
  (args["status-output"] as string) || guessStatusSrc(webringInput);

const dataFile = await Deno.readTextFile(webringInput);
const data = JSON.parse(dataFile) as WebringData;

const scrapeForWebringSrc = args["scrape-for-webring-src"] as string;
const scrapeTimeout = Number(args["scrape-timeout"] || 2000);
const scraper: Scraper | null = scrapeForWebringSrc ? new Scraper() : null;

const statuses: (WebringLinkStatus | null)[] = await Promise.all(
  data.ring.map(async (link) => {
    const url = link.link.includes("://") ? link.link : `https://${link.link}`;
    if (scrapeForWebringSrc) {
      const result = await scraper.scrapeForWebring(url, scrapeForWebringSrc, {
        timeout: scrapeTimeout,
      });
      switch (result) {
        case Result.OK:
          return null;
        case Result.Dead:
          return { dead: true };
        case Result.MissingWebring:
          return { missingWebring: true };
      }
    } else {
      const status = await checkAlive(url);
      return status ? null : { dead: true };
    }
  })
);

if (scraper) {
  scraper.close();
}

const anomalies: WebringStatusData["anomalies"] = {};
for (const [i, link] of data.ring.entries()) {
  const status = statuses[i];
  if (status != null) {
    anomalies[link.link] = status;
  }
}

const statusData: WebringStatusData = {
  version: 1,
  anomalies,
};

const statusFile = JSON.stringify(statusData, null, 2);
await Deno.writeTextFile(statusOutput, statusFile);
