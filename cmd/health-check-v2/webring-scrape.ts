import * as puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

export enum Result {
  OK,
  Dead,
  MissingWebring,
}

export class Scraper {
  #browser: Promise<puppeteer.Browser> | null = null;

  constructor(readonly timeout: number) {}

  async scrapeForWebring(url: string, webringSrc: string): Promise<Result> {
    const browser = await this.browser();
    const page = await browser.newPage();
    const result = await this.#scrapeForWebring(page, url, webringSrc);
    await page.close();
    return result;
  }

  async #scrapeForWebring(
    page: puppeteer.Page,
    url: string,
    webringSrc: string
  ): Promise<Result> {
    const opts = { timeout: this.timeout };
    const start = Date.now();
    const since = () => `+${Date.now() - start}ms`;

    // Fire this off before going to the page, so that we don't miss it.
    const requestPromise = page
      .waitForRequest((r) => {
        console.debug(`${since()}: ${url} is fetching ${r.url()}`);
        return r.url() == webringSrc;
      }, opts)
      .then(() => Result.OK)
      .catch((err) => {
        console.log(`${since()}: ${url} is missing webring: ${err}`);
        return Result.MissingWebring;
      });

    try {
      await page.goto(url, opts);
    } catch (err) {
      console.log(`${since()}: ${url} is dead: ${err}`);
      return Result.Dead;
    }

    return await requestPromise;
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
