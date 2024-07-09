var h=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)};var n=(e,t,i)=>(h(e,t,"read from private field"),i?i.call(e):t.get(e)),u=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},a=(e,t,i,l)=>(h(e,t,"write to private field"),l?l.call(e,i):t.set(e,i),i);var s,o,r,g=class{constructor(t,i){this.src=t;this.opts=i;u(this,s,null);u(this,o,null);u(this,r,null);a(this,s,typeof t=="object"?t:null),a(this,r,i.statusData||null)}surroundingLinks(){if(!this.available)return null;let t=n(this,s).ring.indexOf(n(this,o));if(t==-1)return null;let i=(t-1+n(this,s).ring.length)%n(this,s).ring.length,l=(t+1)%n(this,s).ring.length;return{left:n(this,s).ring[i],right:n(this,s).ring[l]}}get data(){return n(this,s)}set data(t){a(this,s,t),this.initLink()}get statusSrc(){if(this.opts.statusSrc)return this.opts.statusSrc;if(typeof this.src=="string")return f(this.src)}get statusData(){return n(this,r)}set statusData(t){a(this,r,t)}get link(){return n(this,o)}get available(){return!!n(this,s)&&!!n(this,o)}async update(){a(this,s,null),a(this,r,null),await this.init()}includeLink(t){if(n(this,r)){let i=n(this,r).anomalies[t.link];if(i&&(i.dead||i.missingWebring&&!this.opts.includeMissingWebringSites))return!1}return!0}async init(){if(n(this,s)||(await this.initData(this.src),this.initLink()),!n(this,r)&&this.statusSrc)try{await this.initStatusData(this.statusSrc)}catch(t){console.error("Failed to fetch status data",t)}}async initData(t){if(typeof t=="object")a(this,s,t);else{let i=await fetch(t);if(!i.ok)throw new Error(`Failed to fetch webring data: ${i.status}`);a(this,s,await i.json())}if(n(this,s).version!=1)throw new Error(`Unsupported webring format version: ${n(this,s).version}`)}initLink(){if(this.opts.name)a(this,o,n(this,s).ring.find(t=>t.name===this.opts.name));else{let t=window.location.host;a(this,o,n(this,s).ring.find(i=>c(i.link,t)))}}async initStatusData(t){let i=await fetch(t);if(!i.ok)throw new Error(`Failed to fetch status data: ${i.status}`);switch(a(this,r,await i.json()),n(this,r).version){case 1:{n(this,s).ring=n(this,s).ring.filter(l=>this.includeLink(l));break}default:throw new Error(`Unsupported status format version: ${n(this,r).version}`)}}};s=new WeakMap,o=new WeakMap,r=new WeakMap;function c(e,t){return e==t||t.endsWith(`.${e}`)}function f(e){let t=e.split(".");return t[t.length-1]="status."+t[t.length-1],t.join(".")}export{g as Webring,c as domainIncludes,f as guessStatusSrc};
//# sourceMappingURL=webring.js.map
