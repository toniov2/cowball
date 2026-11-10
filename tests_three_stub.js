/* Minimal fake THREE for headless tests when three.min.js is not present. Replace by the real file for rendering tests. */
(function(){class Color{constructor(h){this.h=typeof h==='number'?h:0;return new Proxy(this,{get:(t,k)=>k in t?t[k]:(typeof k==='symbol'?undefined:function(){return t;})});}lerp(){return this;}getHexString(){return ('000000'+this.h.toString(16)).slice(-6);}getHex(){return this.h;}set(h){this.h=h;return this;}clone(){return new Color(this.h);}}
const mk=()=>new Proxy(function(){},{get:(t,k)=>k==='Color'?Color:(k===Symbol.toPrimitive?()=>0:mk()),apply:()=>mk(),construct:()=>mk(),set:()=>true});
window.THREE=mk();})();
