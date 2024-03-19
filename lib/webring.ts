export type WebringData = {
  readonly version: 1;
  name?: string;
  root?: string;
  ring: WebringLink[];
};

export type WebringLink = {
  name: string;
  link: string;
};

export type WebringStatusData = {
  readonly version: 1;
  anomalies: Record<string, WebringLinkStatus>;
};

export type WebringLinkStatus = {
  dead?: boolean;
  missingWebring?: boolean;
};

export class Webring {
  #data: WebringData | null = null;
  #link: WebringLink | null = null; // as in chain link
  #statusData: WebringStatusData | null = null;

  constructor(
    readonly src: string | WebringData,
    readonly opts: {
      name?: string; // override the name of the link to use
      statusSrc?: string;
      statusData?: WebringStatusData;
      // includeMissingWebringSites is true if sites that don't have a
      // webring link should be included from the webring.
      // This field is not always effective. See README for details.
      includeMissingWebringSites?: boolean;
    },
  ) {
    this.#data = typeof src === "object" ? src : null;
    this.#statusData = opts.statusData || null;
  }

  // surroundingLinks returns the links to the left and right of the current
  // link, or null if there are no surrounding links.
  surroundingLinks(): { left: WebringLink; right: WebringLink } | null {
    if (!this.available) {
      return null;
    }

    const ix = this.#data.ring.indexOf(this.#link);
    if (ix == -1) {
      return null;
    }

    const leftIx = (ix - 1 + this.#data.ring.length) % this.#data.ring.length;
    const rightIx = (ix + 1) % this.#data.ring.length;

    return {
      left: this.#data.ring[leftIx],
      right: this.#data.ring[rightIx],
    };
  }

  get data(): WebringData {
    return this.#data;
  }

  set data(data: WebringData) {
    this.#data = data;
    this.initLink();
  }

  get statusSrc(): string {
    if (this.opts.statusSrc) {
      return this.opts.statusSrc;
    }
    if (typeof this.src === "string") {
      return guessStatusSrc(this.src);
    }
    return "";
  }

  get statusData(): WebringStatusData {
    return this.#statusData;
  }

  set statusData(statusData: WebringStatusData) {
    this.#statusData = statusData;
  }

  get link(): WebringLink | null {
    return this.#link;
  }

  // available is true if the webring data is available.
  get available(): boolean {
    return !!this.#data && !!this.#link;
  }

  // update updates the webring data. It overrides the existing internal data.
  async update() {
    this.#data = null;
    this.#statusData = null;
    await this.init();
  }

  // includeLink returns true if the link should be included in the webring.
  includeLink(link: WebringLink): boolean {
    if (this.#statusData) {
      const anomaly = this.#statusData.anomalies[link.link];
      if (anomaly) {
        if (anomaly.dead) {
          return false;
        }
        if (anomaly.missingWebring && !this.opts.includeMissingWebringSites) {
          return false;
        }
      }
    }

    return true;
  }

  private async init() {
    if (!this.#data) {
      await this.initData(this.src);
      this.initLink();
    }

    if (!this.#statusData) {
      try {
        await this.initStatusData(this.statusSrc);
      } catch (err) {
        console.error("Failed to fetch status data", err);
      }
    }
  }

  private async initData(src: string | WebringData) {
    if (typeof src === "object") {
      this.#data = src;
    } else {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to fetch webring data: ${response.status}`);
      }
      this.#data = await response.json();
    }

    if (this.#data.version != 1) {
      throw new Error(
        `Unsupported webring format version: ${this.#data.version}`,
      );
    }
  }

  private initLink() {
    if (this.opts.name) {
      this.#link = this.#data.ring.find((l) => l.name === this.opts.name);
    } else {
      const domain = window.location.host;
      this.#link = this.#data.ring.find((l) => domainIncludes(l.link, domain));
    }
  }

  private async initStatusData(statusSrc: string) {
    const response = await fetch(statusSrc);
    if (!response.ok) {
      throw new Error(`Failed to fetch status data: ${response.status}`);
    }

    this.#statusData = await response.json();
    switch (this.#statusData.version) {
      case 1: {
        // Only keep links that are not in the unavailable list.
        this.#data.ring = this.#data.ring.filter((l) => this.includeLink(l));
        break;
      }
      default: {
        throw new Error(
          `Unsupported status format version: ${this.#statusData.version}`,
        );
      }
    }
  }
}

// domainIncludes returns true if matchingDomain is a subdomain of domain.
export function domainIncludes(
  domain: string,
  matchingDomain: string,
): boolean {
  return domain == matchingDomain || matchingDomain.endsWith(`.${domain}`);
}

export function guessStatusSrc(src: string): string {
  // webring.json -> webring.status.json
  const parts = src.split(".");
  parts[parts.length - 1] = "status." + parts[parts.length - 1];
  return parts.join(".");
}
