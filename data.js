// ---------- Источник данных ----------
async function api(p){
  for(let i=hi;i<HOSTS.length;i++){
    try{const res=await fetch(HOSTS[i][0]+p,{cache:'no-store'});if(!res.ok)throw res.status;hi=i;return await res.json()}catch(e){}
  }
  throw new Error('offline');
}
function setSrc(m){
  mode=m;const e=$('#src');e.className='src '+(m==='live'?'live':'demo');
  $('#srcT').textContent=m==='live'?'Binance · онлайн':'ДЕМО-данные';
  $('#warn').style.display=m==='live'?'none':'block';
}
const stamp=()=>$('#upd').textContent='обновлено '+new Date().toLocaleTimeString('ru-RU');
function demoInit(){SYMS.forEach(s=>M[s]={p:BASE[s],ch:0,hi:BASE[s]*1.01,lo:BASE[s]*.99,vol:5e8})}
async function loadTickers(){
  try{
    const a=await api('/api/v3/ticker/24hr?symbols='+encodeURIComponent(JSON.stringify(SYMS.map(s=>s+'USDT'))));
    a.forEach(t=>{const s=t.symbol.slice(0,-4);M[s]={p:+t.lastPrice,ch:+t.priceChangePercent,hi:+t.highPrice,lo:+t.lowPrice,vol:+t.quoteVolume}});
    setSrc('live');stamp();return true;
  }catch(e){if(mode==='live')setSrc('demo');return false}
}
function setBook(b,a){BOOK.b=b.map(x=>[+x[0],+x[1]]);BOOK.a=a.map(x=>[+x[0],+x[1]])}
function demoBook(){const p=M[S.pair].p,a=[],b=[];for(let i=1;i<=20;i++){a.push([r(p*(1+i*.00012),6),r(Math.random()*2+.05,4)]);b.push([r(p*(1-i*.00012),6),r(Math.random()*2+.05,4)])}BOOK.a=a;BOOK.b=b}
async function loadBook(){try{const d=await api(`/api/v3/depth?symbol=${S.pair}USDT&limit=20`);setBook(d.bids,d.asks)}catch(e){demoBook()}}
async function loadTrades(){try{const a=await api(`/api/v3/trades?symbol=${S.pair}USDT&limit=30`);TR.length=0;a.reverse().forEach(t=>TR.unshift({p:+t.price,q:+t.qty,t:t.time,bm:t.isBuyerMaker}))}catch(e){}}
function demoK(sym){
  const n=500,iv=IVMS[S.iv],arr=[];let p=BASE[sym]*(.9+Math.random()*.2);
  for(let i=0;i<n;i++){p*=1+gauss()*.004;arr.push(p)}
  const f=M[sym].p/arr[n-1],now=Date.now()-Date.now()%iv,out=[];let prev=arr[0]*f;
  for(let i=0;i<n;i++){const c=arr[i]*f,o=prev,h=Math.max(o,c)*(1+Math.random()*.002),l=Math.min(o,c)*(1-Math.random()*.002);
    out.push({t:now-(n-1-i)*iv,o,h,l,c,v:r(Math.random()*100+20,2)});prev=c}
  return out;
}
async function loadK(){
  const s=S.pair+'USDT';
  try{
    const a=await api(`/api/v3/klines?symbol=${s}&interval=${S.iv}&limit=500`);
    K=a.map(x=>({t:x[0],o:+x[1],h:+x[2],l:+x[3],c:+x[4],v:+x[5]}));
    if(mode!=='live')setSrc('live');
    await Promise.all([loadBook(),loadTrades()]);
  }catch(e){K=demoK(S.pair);demoBook()}
  frame();
}
function connect(){
  if(ws){ws.onclose=null;try{ws.close()}catch(e){}ws=null}
  if(mode!=='live')return;
  const s=(S.pair+'USDT').toLowerCase();
  ws=new WebSocket(HOSTS[hi][1]+'/stream?streams='+[s+'@ticker',s+'@kline_'+S.iv,s+'@depth20@100ms',s+'@trade'].join('/'));
  ws.onmessage=e=>{const m=JSON.parse(e.data);onWs(m.stream,m.data)};
  ws.onclose=()=>{ws=null;setTimeout(()=>{if(mode==='live')connect()},3000)};
}
function onWs(st,d){
  if(st.endsWith('@ticker')){const m=M[S.pair];m.p=+d.c;m.ch=+d.P;m.hi=+d.h;m.lo=+d.l;m.vol=+d.q}
  else if(st.includes('@kline')){
    const k=d.k,c={t:k.t,o:+k.o,h:+k.h,l:+k.l,c:+k.c,v:+k.v},L=K[K.length-1];
    if(L&&L.t===c.t)K[K.length-1]=c;else if(!L||c.t>L.t){K.push(c);if(K.length>800)K.shift()}
  }
  else if(st.endsWith('@depth20@100ms'))setBook(d.bids,d.asks);
  else if(st.endsWith('@trade'))onTrade(S.pair,+d.p,+d.q,d.T,d.m);
  frame();
}
function demoStep(){
  SYMS.forEach(s=>{const m=M[s];m.p*=1+gauss()*.0006;m.hi=Math.max(m.hi,m.p);m.lo=Math.min(m.lo,m.p);m.ch=(m.p/BASE[s]-1)*100});
  const s=S.pair;onTrade(s,M[s].p,r(Math.random()*.6+.01,4),Date.now(),Math.random()<.5);
  demoBook();
  const L=K[K.length-1];
  if(L){const p=M[s].p;L.c=p;L.h=Math.max(L.h,p);L.l=Math.min(L.l,p);L.v=r(L.v+Math.random()*3,2);
    if(Date.now()-L.t>=IVMS[S.iv])K.push({t:L.t+IVMS[S.iv],o:p,h:p,l:p,c:p,v:0})}
}
