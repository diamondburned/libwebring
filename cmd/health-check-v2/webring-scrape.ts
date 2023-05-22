import * as puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

export enum Result {
  OK = "OK",
  Dead = "Dead",
  MissingWebring = "MissingWebring",
}

export class Scraper {
  #browser: Promise<puppeteer.Browser> | null = null;

  constructor() {}

  async scrapeForWebring(
    url: string,
    webringSrc: string,
    { timeout = 2000 }
  ): Promise<Result> {
    const browser = await this.browser();
    const page = await browser.newPage();
    try {
      await page.goto(url);
    } catch (err) {
      console.log(`${url} unreachable: ${err}`);
      return Result.Dead;
    }

    try {
      await page.waitForRequest(webringSrc, { timeout });
    } catch (err) {
      console.log(`${url} missing webring: ${err}`);
      return Result.MissingWebring;
    }

    return Result.OK;
  }

  async close() {
    if (this.#browser) {
      const browser = await this.#browser;
      this.#browser = null;
      await browser.close();
    }
  }

  private async browser(): Promise<puppeteer.Browser> {
    if (!this.#browser) {
      this.#browser = puppeteer.default.launch({
        product: "chrome",
        headless: true,
        executablePath: "google-chrome-headless",
      });
    }
    return await this.#browser;
  }
}
