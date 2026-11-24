// ---------- Индикаторы ----------
function sma(a,n){return a.map((_,i)=>i<n-1?null:a.slice(i-n+1,i+1).reduce((x,y)=>x+y,0)/n)}
function ema(a,n){const k=2/(n+1);let e=a[0];return a.map((v,i)=>{e=i===0?v:e+(v-e)*k;return e})}
function bb(a,n,m){const s=sma(a,n);return a.map((_,i)=>{if(s[i]==null)return null;const sl=a.slice(i-n+1,i+1);const sd=Math.sqrt(sl.reduce((x,y)=>x+(y-s[i])**2,0)/n);return[s[i]+m*sd,s[i],s[i]-m*sd]})}
function vwap(k){let pv=0,v=0;return k.map(c=>{pv+=(c.h+c.l+c.c)/3*c.v;v+=c.v;return v?pv/v:null})}
function rsi(a,n=14){const out=[];let g=0,l=0;for(let i=0;i<a.length;i++){
  if(i===0){out.push(null);continue}
  const d=a[i]-a[i-1],gg=Math.max(d,0),ll=Math.max(-d,0);
  if(i<=n){g+=gg/n;l+=ll/n;out.push(i===n?100-100/(1+g/(l||1e-9)):null)}
  else{g=(g*(n-1)+gg)/n;l=(l*(n-1)+ll)/n;out.push(100-100/(1+g/(l||1e-9)))}
}return out}
