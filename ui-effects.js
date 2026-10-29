(()=>{
 /* Tetris-style UI helpers: ripple, tilt, keep skin last in <head> */
 const SEL='.mi,.tc,.cc,.tabs button,.sg button,.sgg button,.stg button,.utTabs button,.kotabs button,#setTabs button,#hubTabs button,.team-cats button';
 document.addEventListener('pointerdown',e=>{
  const el=e.target.closest&&e.target.closest(SEL);if(!el||el.disabled)return;
  const r=el.getBoundingClientRect(),d=Math.max(r.width,r.height)*2,s=document.createElement('span');
  s.className='rp';s.style.cssText='width:'+d+'px;height:'+d+'px;left:'+(e.clientX-r.left-d/2)+'px;top:'+(e.clientY-r.top-d/2)+'px';
  if(getComputedStyle(el).position==='static')el.style.position='relative';
  el.appendChild(s);setTimeout(()=>s.remove(),700);
 },{passive:true});
 document.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse')return;
  const el=e.target.closest&&e.target.closest('#tiles .mi:not(.wide),.tc,.cc');if(!el)return;
  const r=el.getBoundingClientRect();
  el.style.setProperty('--ry',(((e.clientX-r.left)/r.width-.5)*10).toFixed(1)+'deg');
  el.style.setProperty('--rx',((.5-(e.clientY-r.top)/r.height)*10).toFixed(1)+'deg');
 },{passive:true});
 document.addEventListener('pointerleave',e=>{const el=e.target;if(el&&el.style&&el.matches&&el.matches('#tiles .mi,.tc,.cc')){el.style.removeProperty('--rx');el.style.removeProperty('--ry')}},true);
 const keep=()=>{const s=document.getElementById('tetris-ui-skin');if(s&&s.parentNode&&s!==document.head.lastElementChild)document.head.appendChild(s)};
 addEventListener('load',()=>{keep();setTimeout(keep,1200);setTimeout(keep,4000)});
})();
