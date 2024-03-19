import { html } from "https://deno.land/x/literal_html@1.1.0/mod.ts";
import { Webring, type WebringData, type WebringLink } from "./webring.ts";

export class WebringElement extends HTMLElement {
  webring: Webring;

  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  // update asynchronously updates the webring data and re-renders the element.
  update() {
    this.webring.update().then(() => this.render());
  }

  get src(): string {
    return this.attributes["src"]?.value;
  }

  set src(src: string) {
    this.setAttribute("src", src);
    this.init();
  }

  get name(): string {
    return this.attributes["name"]?.value;
  }

  set name(name: string) {
    this.setAttribute("name", name);
    this.init();
  }

  get data(): string {
    return this.attributes["data"]?.value;
  }

  set data(data: string | WebringData) {
    const str = typeof data === "string" ? data : JSON.stringify(data);
    this.setAttribute("data", str);
    this.init();
  }

  get statusSrc(): string {
    return this.attributes["status-src"]?.value;
  }

  set statusSrc(statusSrc: string) {
    this.setAttribute("status-src", statusSrc);
    this.init();
  }

  get includeMissingWebringSites(): boolean {
    return this.attributes["include-missing-webring-sites"]?.value != null;
  }

  set includeMissingWebringSites(includeMissingWebringSites: boolean) {
    if (includeMissingWebringSites) {
      this.setAttribute("include-missing-webring-sites", "");
    } else {
      this.removeAttribute("include-missing-webring-sites");
    }
    this.init();
  }

  private init() {
    try {
      if (!this.src && !this.data) {
        throw new Error("missing src or data attribute");
      }
      if (this.src && this.data) {
        throw new Error("both src and data attributes are set");
      }
      if (this.data && !JSON.parse(this.data)) {
        throw new Error("invalid JSON in data attribute");
      }
    } catch (e) {
      console.error("Not rendering webring:", e);
      this.setVisible(false);
      return;
    }

    const src = this.data ? (JSON.parse(this.data) as WebringData) : this.src;
    this.webring = new Webring(src, {
      name: this.name,
      statusSrc: this.statusSrc,
      includeMissingWebringSites: this.includeMissingWebringSites,
    });

    this.update();
  }

  private render() {
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

    for (const k in this.dataset) {
      delete this.dataset[k];
    }

    const surroundingLinks = this.webring.surroundingLinks();
    if (!surroundingLinks) {
      console.warn(
        "Not rendering webring: no surrounding links found " +
          "(maybe you're not in the ring?)",
      );
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
      a.href =
        this.webring.data.root ||
        (typeof this.src === "string" ? this.src : "");
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

function elementIsEmpty(el: HTMLElement): boolean {
  return el.innerHTML.trim() == "";
}

function linkURL(link: WebringLink): string {
  if (link.link.includes("://")) {
    return link.link;
  }
  return `https://${link.link}`;
}

customElements.define("webring-element", WebringElement);
