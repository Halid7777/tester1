// ---------- Инвестиции: фьючерсы, прогнозы, DCA, Earn (симуляция) ----------
let MF='all',FDIR='long';
function ext(){S.fut=S.fut||[];S.futHist=S.futHist||[];S.preds=S.preds||[];S.score=S.score||{ok:0,bad:0};S.dca=S.dca||null;S.earn=S.earn||{bal:0,apy:5,last:Date.now(),earned:0}}
function listFor(){const a=SYMS.slice();
  if(MF==='fav')return a.filter(s=>S.fav.includes(s));
  if(MF==='up')return a.sort((x,y)=>M[y].ch-M[x].ch);
  if(MF==='down')return a.sort((x,y)=>M[x].ch-M[y].ch);
  if(MF==='vol')return a.sort((x,y)=>M[y].vol-M[x].vol);
  return a}
const futPnl=p=>p.qty*(M[p.sym].p-p.entry)*(p.side==='long'?1:-1);
const liqPrice=p=>p.side==='long'?p.entry*(1-.95/p.lev):p.entry*(1+.95/p.lev);
function openFut(){
  ext();const sym=S.pair,lev=+$('#flev').value,m=+$('#fm').value;
  if(!(m>0))return msg('Введите маржу','bad');
  if(m>S.usdt+1e-9)return msg('Недостаточно USDT','bad');
  const fee=m*lev*.0005,margin=r(m-fee,2);
  S.usdt=r(S.usdt-m,2);
  S.fut.push({id:uid(),sym,side:FDIR,lev,margin,entry:M[sym].p,t:Date.now(),qty:margin*lev/M[sym].p});
  save();frame();msg(`Открыта позиция ${sym} ${FDIR==='long'?'LONG':'SHORT'} ${lev}x`,'ok');
}
function closeFut(id,liq){
  ext();const p=S.fut.find(x=>x.id===id);if(!p)return;
  const pl=futPnl(p),fee=p.qty*M[p.sym].p*.0005,back=liq?0:Math.max(0,p.margin+pl-fee);
  S.usdt=r(S.usdt+back,2);
  S.futHist.push({sym:p.sym,side:p.side,lev:p.lev,margin:p.margin,entry:p.entry,close:M[p.sym].p,pnl:liq?-p.margin:r(pl-fee,2),liq:!!liq,t:Date.now()});
  S.fut=S.fut.filter(x=>x!==p);save();frame();
  if(!liq)msg('Позиция закрыта, результат '+(pl-fee).toFixed(2)+' USDT');
}
function makePred(dir,mins){
  ext();S.preds.push({id:uid(),sym:S.pair,dir,mins,start:M[S.pair].p,exp:Date.now()+mins*6e4,st:'open'});
  save();frame();msg('Прогноз принят, проверка через '+mins+' мин','ok');
}
function setDca(a,m){
  ext();if(!(a>0&&m>0))return msg('Укажите сумму и интервал','bad');
  S.dca={sym:S.pair,amt:r(a,2),mins:m,next:Date.now(),done:0,spent:0};save();frame();msg('DCA запущен: '+S.pair,'ok');
}
function runDca(){
  const d=S.dca;if(!d||Date.now()<d.next)return;
  if(d.amt>S.usdt){d.next=Date.now()+d.mins*6e4;return}
  const p=M[d.sym].p*(1+.0005),o={id:uid(),t:Date.now(),sym:d.sym,side:'buy',type:'market',price:null,st:'open',spent:0,filled:0,fee:0,recv:0,pnl:0,usdt:d.amt,note:'DCA'};
  S.usdt=r(S.usdt-d.amt,2);S.orders.push(o);
  fillOrder(o,d.amt*(1-FEE)/p,p);closeOrder(o);
  d.next=Date.now()+d.mins*6e4;d.done++;d.spent=r(d.spent+d.amt,2);
}
function earnAccrue(){const e=S.earn,now=Date.now(),dt=(now-e.last)/31536e6;e.last=now;if(e.bal>0){const g=e.bal*e.apy/100*dt;e.bal=r(e.bal+g,8);e.earned=r(e.earned+g,8)}}
function earnMove(v,inn){
  ext();if(!(v>0))return msg('Введите сумму','bad');
  if(inn){if(v>S.usdt+1e-9)return msg('Недостаточно USDT','bad');S.usdt=r(S.usdt-v,2);S.earn.bal=r(S.earn.bal+v,2)}
  else{if(v>S.earn.bal+1e-9)return msg('На накопительном счёте меньше','bad');S.earn.bal=r(S.earn.bal-v,2);S.usdt=r(S.usdt+v,2)}
  save();frame();
}
function runBots(){
  ext();earnAccrue();
  S.fut.filter(p=>futPnl(p)<=-p.margin*.95).forEach(p=>{closeFut(p.id,true);msg(`Ликвидация ${p.sym} ${p.side} ${p.lev}x`,'bad')});
  const now=Date.now();
  S.preds.forEach(p=>{if(p.st==='open'&&now>=p.exp){const e=M[p.sym].p;p.end=e;p.win=p.dir==='up'?e>p.start:e<p.start;p.st='done';S.score[p.win?'ok':'bad']++}});
  runDca();save();
}
function signals(){
  if(K.length<30)return 'Недостаточно данных';
  const C=K.map(k=>k.c),p=C[C.length-1],rs=rsi(C).at(-1),s20=sma(C,20).at(-1);
  const e12=ema(C,12),e26=ema(C,26),md=e12.map((v,i)=>v-e26[i]),sgl=ema(md,9),up=md.at(-1)>sgl.at(-1);
  return `RSI(14) ${rs.toFixed(1)}: ${rs>70?'перекупленность':rs<30?'перепроданность':'нейтрально'}<br>MACD: ${up?'выше':'ниже'} сигнальной линии (${up?'импульс вверх':'импульс вниз'})<br>Цена ${p>s20?'выше':'ниже'} SMA20<br>Это сводка индикаторов, а не прогноз. Рынок не гарантирует направление.`;
}
function paintInvest(){
  ext();
  const m=M[S.pair],sv=S.score,tot=sv.ok+sv.bad;
  $('#finfo').textContent=`${S.pair}: ${fmt(m.p)} · свободно ${fmt(S.usdt)} USDT · комиссия 0.05%`;
  $('#flist').innerHTML=S.fut.map(p=>`<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--b);padding:4px 0"><span><b>${p.sym}</b> ${p.side==='long'?'LONG':'SHORT'} ${p.lev}x · вход ${fmt(p.entry)} · ликвидация ${fmt(liqPrice(p))}</span><span>${sg(futPnl(p))} USDT <button data-fc="${p.id}">Закрыть</button></span></div>`).join('')||'<span class="muted">Открытых позиций нет</span>';
  $('#fhist').textContent=S.futHist.length?`Закрыто позиций: ${S.futHist.length}, итог ${S.futHist.reduce((a,p)=>a+p.pnl,0).toFixed(2)} USDT`:'';
  $('#plist').innerHTML=S.preds.slice(-12).reverse().map(p=>`<div class="row" style="justify-content:space-between"><span>${p.sym} ${p.dir==='up'?'▲':'▼'} ${p.mins} мин · старт ${fmt(p.start)}</span><span>${p.st==='open'?'ожидание…':p.win?'<span class="up">верно</span>':'<span class="down">неверно</span>'}</span></div>`).join('')||'<span class="muted">Прогнозов пока нет</span>';
  $('#pstat').textContent=`Точность: ${tot?(sv.ok/tot*100).toFixed(1)+'%':'—'} (верно ${sv.ok}, неверно ${sv.bad}). Тренировка на реальных ценах, не рекомендация.`;
  $('#sig').innerHTML=signals();
  $('#dInfo').textContent=S.dca?`Активен: ${S.dca.sym}, ${S.dca.amt} USDT каждые ${S.dca.mins} мин · покупок ${S.dca.done} · вложено ${S.dca.spent.toFixed(2)} USDT`:'План не запущен';
  $('#eInfo').textContent=`На счёте ${fmt(S.earn.bal)} USDT · начислено ${S.earn.earned.toFixed(4)} USDT`;
}
$('#fL').onclick=()=>{FDIR='long';$('#fL').className='on';$('#fS').className=''};
$('#fS').onclick=()=>{FDIR='short';$('#fS').className='on';$('#fL').className=''};
$('#fob').onclick=openFut;
$('#flist').onclick=e=>{if(e.target.dataset.fc)closeFut(e.target.dataset.fc)};
document.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>makePred(b.dataset.d,+b.dataset.m));
$('#dB').onclick=()=>setDca(+$('#dA').value,+$('#dM').value);
$('#dS').onclick=()=>{S.dca=null;save();paintInvest()};
$('#eIn').onclick=()=>earnMove(+$('#eA').value,true);
$('#eOut').onclick=()=>earnMove(+$('#eA').value,false);
$('#chips').onclick=e=>{const f=e.target.dataset.f;if(!f)return;MF=f;document.querySelectorAll('#chips [data-f]').forEach(b=>b.classList.toggle('on',b.dataset.f===f));paintMarket()};
