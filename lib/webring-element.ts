import { html } from "https://deno.land/x/literal_html@1.1.0/mod.ts";
import { Webring, WebringLink } from "./webring.ts";

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
