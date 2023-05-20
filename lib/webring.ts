import { html } from "https://deno.land/x/literal_html@1.1.0/mod.ts";

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
    readonly src: string,
    readonly opts: {
      name?: string; // override the name of the link to use
      statusSrc?: string;
      data?: WebringData;
      statusData?: WebringStatusData;
      // excludeMissingWebringSites returns true if sites that don't have a
      // webring link should be excluded from the webring. readonly
      excludeMissingWebringSites?: boolean;
    }
  ) {
    this.#data = opts.data || null;
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
        if (this.opts.excludeMissingWebringSites && anomaly.missingWebring) {
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
        await this.initStatusData(
          this.opts.statusSrc || guessStatusSrc(this.src)
        );
      } catch (err) {
        console.error("Failed to fetch status data", err);
      }
    }
  }

  private async initData(src: string) {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Failed to fetch webring data: ${response.status}`);
    }

    this.#data = await response.json();
    if (this.#data.version != 1) {
      throw new Error(
        `Unsupported webring format version: ${this.#data.version}`
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
          `Unsupported status format version: ${this.#statusData.version}`
        );
      }
    }
  }
}

export class WebringElement extends HTMLElement {
  readonly webring: Webring;

  constructor() {
    super();

    const src = this.attributes["src"]?.value;
    if (!src) {
      console.error("Not rendering webring: missing src attribute");
      this.setVisible(false);
      return;
    }

    this.webring = new Webring(src, {
      name: this.attributes["name"]?.value,
      statusSrc: this.attributes["status-src"]?.value,
      excludeMissingWebringSites: this.hasAttribute(
        "exclude-missing-webring-sites"
      ),
    });

    if (elementIsEmpty(this)) {
      this.innerHTML = html`
        <p class="ring-info">
          <a href="#" class="ring" target="_blank"></a> webring
        </p>
        <p class="ring-body">
          <a class="left" href="#" target="_blank"></a>
          <span class="middle"></span>
          <a class="right" href="#" target="_blank"></a>
        </p>
      `;
    }
  }

  connectedCallback() {
    this.update();
  }

  // update asynchronously updates the webring data and re-renders the element.
  update() {
    this.webring.update().then(() => this.render());
  }

  private render() {
    for (const k in this.dataset) {
      delete this.dataset[k];
    }

    const surroundingLinks = this.webring.surroundingLinks();
    if (!surroundingLinks) {
      this.setVisible(false);
      return;
    }

    this.dataset.ringName = this.webring.data.name;
    this.dataset.linkName = this.webring.link.name;
    this.dataset.leftLinkName = surroundingLinks.left.name;
    this.dataset.rightLinkName = surroundingLinks.right.name;

    this.$<HTMLAnchorElement>(".left", (a) => {
      a.href = linkURL(surroundingLinks.left);
      a.textContent = surroundingLinks.left.name;
    });

    this.$<HTMLAnchorElement>(".ring", (a) => {
      a.href = this.webring.data.root || this.webring.src;
      a.textContent = this.webring.data.name || "";
    });

    this.$(".middle", (span) => {
      span.textContent = this.webring.link.name || "";
    });

    this.$<HTMLAnchorElement>(".right", (a) => {
      a.href = linkURL(surroundingLinks.right);
      a.textContent = surroundingLinks.right.name;
    });

    this.setVisible(true);
  }

  private setVisible(visible: boolean) {
    this.setAttribute("style", visible ? "" : "display: none;");
  }

  private $<T = HTMLElement>(selector: string, f: (_: T) => void) {
    const el = this.querySelector(selector);
    if (!el) {
      throw new Error(`Element not found: ${selector}`);
    }
    f(el as T);
  }
}

// domainIncludes returns true if matchingDomain is a subdomain of domain.
function domainIncludes(domain: string, matchingDomain: string): boolean {
  return domain == matchingDomain || matchingDomain.endsWith(`.${domain}`);
}

function linkURL(link: WebringLink): string {
  if (link.link.includes("://")) {
    return link.link;
  }
  return `https://${link.link}`;
}

function elementIsEmpty(el: HTMLElement): boolean {
  return el.innerHTML.trim() == "";
}

function guessStatusSrc(src: string): string {
  // webring.json -> webring.status.json
  const parts = src.split(".");
  parts[parts.length - 1] = "status." + parts[parts.length - 1];
  return parts.join(".");
}

customElements.define("webring-element", WebringElement);