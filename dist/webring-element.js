var p=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)};var n=(i,e,t)=>(p(i,e,"read from private field"),t?t.call(i):e.get(i)),h=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},o=(i,e,t,r)=>(p(i,e,"write to private field"),r?r.call(i,t):e.set(i,t),t);function f(i){let e=t=>t.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll("'",i).replaceAll('"',"&quot;");return(t,...r)=>{let a=t[0],b=1;for(let g of r){switch(typeof g){case"string":a+=e(g);break;case"number":a+=g.toString();break;case"object":switch(Object.keys(g)[0]){case"content":a+=g.content.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");break;case"attr":a+=e(g.attr);break;case"scriptString":a+=g.scriptString.replaceAll("\\","\\\\").replaceAll("<","\\x3C").replaceAll('"','\\"');break;case"param":a+=e(encodeURIComponent(g.param));break;case"verbatim":a+=g.verbatim;break}break}a+=t[b++]}return a}}var m=f("&#39;"),T=f("&apos;");var s,u,l,c=class{constructor(e,t){this.src=e;this.opts=t;h(this,s,null);h(this,u,null);h(this,l,null);o(this,s,typeof e=="object"?e:null),o(this,l,t.statusData||null)}surroundingLinks(){if(!this.available)return null;let e=n(this,s).ring.indexOf(n(this,u));if(e==-1)return null;let t=(e-1+n(this,s).ring.length)%n(this,s).ring.length,r=(e+1)%n(this,s).ring.length;return{left:n(this,s).ring[t],right:n(this,s).ring[r]}}get data(){return n(this,s)}set data(e){o(this,s,e),this.initLink()}get statusSrc(){if(this.opts.statusSrc)return this.opts.statusSrc;if(typeof this.src=="string")return y(this.src)}get statusData(){return n(this,l)}set statusData(e){o(this,l,e)}get link(){return n(this,u)}get available(){return!!n(this,s)&&!!n(this,u)}async update(){o(this,s,null),o(this,l,null),await this.init()}includeLink(e){if(n(this,l)){let t=n(this,l).anomalies[e.link];if(t&&(t.dead||t.missingWebring&&!this.opts.includeMissingWebringSites))return!1}return!0}async init(){if(n(this,s)||(await this.initData(this.src),this.initLink()),!n(this,l)&&this.statusSrc)try{await this.initStatusData(this.statusSrc)}catch(e){console.error("Failed to fetch status data",e)}}async initData(e){if(typeof e=="object")o(this,s,e);else{let t=await fetch(e);if(!t.ok)throw new Error(`Failed to fetch webring data: ${t.status}`);o(this,s,await t.json())}if(n(this,s).version!=1)throw new Error(`Unsupported webring format version: ${n(this,s).version}`)}initLink(){if(this.opts.name)o(this,u,n(this,s).ring.find(e=>e.name===this.opts.name));else{let e=window.location.host;o(this,u,n(this,s).ring.find(t=>k(t.link,e)))}}async initStatusData(e){let t=await fetch(e);if(!t.ok)throw new Error(`Failed to fetch status data: ${t.status}`);switch(o(this,l,await t.json()),n(this,l).version){case 1:{n(this,s).ring=n(this,s).ring.filter(r=>this.includeLink(r));break}default:throw new Error(`Unsupported status format version: ${n(this,l).version}`)}}};s=new WeakMap,u=new WeakMap,l=new WeakMap;function k(i,e){return i==e||e.endsWith(`.${i}`)}function y(i){let e=i.split(".");return e[e.length-1]="status."+e[e.length-1],e.join(".")}var d=class extends HTMLElement{constructor(){super();this.includeMissingWebringSites=!1}connectedCallback(){this.init()}attributeChangedCallback(t,r,a){if(r!==a){switch(t){case"src":this.src=a||void 0;break;case"data":try{this.data=a?JSON.parse(a):void 0}catch(b){this.error(b);return}break;case"name":this.name=a||void 0;break;case"status-src":this.statusSrc=a||void 0;break;case"include-missing-webring-sites":this.includeMissingWebringSites=["true","1"].includes(a);break}this.init()}}update(){this.webring.update().then(()=>this.render())}error(t,r=!1){r?console.debug("Not rendering webring:",t):console.error("Not rendering webring:",t),this.setVisible(!1)}init(){if(!this.src&&!this.data){this.error("missing src or data attribute",!0);return}if(this.src&&this.data){this.error("both src and data attributes are set");return}let t=this.data??this.src;this.webring=new c(t,{name:this.name,statusSrc:this.statusSrc,includeMissingWebringSites:this.includeMissingWebringSites}),this.update()}render(){S(this)&&(this.innerHTML=m`
        <p class="ring-info">
          <a href="#" class="ring" target="_blank"></a> webring
        </p>
        <p class="ring-body">
          <a class="left" href="#" target="_blank"></a>
          <span class="middle"></span>
          <a class="right" href="#" target="_blank"></a>
        </p>
      `);for(let r in this.dataset)delete this.dataset[r];let t=this.webring.surroundingLinks();if(!t){console.warn("Not rendering webring: no surrounding links found (maybe you're not in the ring?)"),this.setVisible(!1);return}this.dataset.ringName=this.webring.data.name,this.dataset.linkName=this.webring.link.name,this.dataset.leftLinkName=t.left.name,this.dataset.rightLinkName=t.right.name,this.$(".left",r=>{r.href=L(t.left),r.textContent=t.left.name}),this.$(".ring",r=>{r.href=this.webring.data.root||(typeof this.src=="string"?this.src:""),r.textContent=this.webring.data.name||""}),this.$(".middle",r=>{r.textContent=this.webring.link.name||""}),this.$(".right",r=>{r.href=L(t.right),r.textContent=t.right.name}),this.setVisible(!0)}setVisible(t){this.setAttribute("style",t?"":"display: none;")}$(t,r){let a=this.querySelector(t);if(!a)throw new Error(`Element not found: ${t}`);r(a)}};d.observedAttributes=["src","data","name","status-src","include-missing-webring-sites"];function S(i){return i.innerHTML.trim()==""}function L(i){return i.link.includes("://")?i.link:`https://${i.link}`}customElements.define("webring-element",d);export{d as WebringElement};
//# sourceMappingURL=webring-element.js.map