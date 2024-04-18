import { html } from "https://deno.land/x/literal_html@1.1.0/mod.ts";
import { Webring, type WebringData, type WebringLink } from "./webring.ts";

export class WebringElement extends HTMLElement {
  webring: Webring;

  src?: string;
  name?: string;
  data?: WebringData;
  statusSrc?: string;
  includeMissingWebringSites = false;

  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  // Add new attributes to this array so that attributeChangedCallback is called
  // when any of them change.
  static observedAttributes = [
    "src",
    "data",
    "name",
    "status-src",
    "include-missing-webring-sites",
  ];

  attributeChangedCallback(name: string, oldValue?: string, newValue?: string) {
    if (oldValue === newValue) {
      return;
    }

    switch (name) {
      case "src":
        this.src = newValue || undefined;
        break;
      case "data":
        try {
          this.data = newValue ? JSON.parse(newValue) : undefined;
        } catch (cause) {
          this.error(cause);
          return;
        }
        break;
      case "name":
        this.name = newValue || undefined;
        break;
      case "status-src":
        this.statusSrc = newValue || undefined;
        break;
      case "include-missing-webring-sites":
        this.includeMissingWebringSites = ["true", "1"].includes(newValue);
        break;
    }

    this.init();
  }

  // update asynchronously updates the webring data and re-renders the element.
  update() {
    this.webring.update().then(() => this.render());
  }

  private error(e: unknown, nonError = false) {
    if (nonError) {
      console.debug("Not rendering webring:", e);
    } else {
      console.error("Not rendering webring:", e);
    }
    this.setVisible(false);
  }

  private init() {
    if (!this.src && !this.data) {
      this.error("missing src or data attribute", true);
      return;
    }

    if (this.src && this.data) {
      this.error("both src and data attributes are set");
      return;
    }

    const src = this.data ?? this.src;
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
