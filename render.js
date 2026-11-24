// ---------- Отрисовка ----------
function paintTicker(){
  const m=M[S.pair];
  $('#px').textContent=fmt(m.p);$('#px').className='big '+cl(m.ch);
  $('#chg').innerHTML=sg(m.ch)+'%';
  $('#hl').textContent=`24ч: макс ${fmt(m.hi)} · мин ${fmt(m.lo)} · объём ${(m.vol/1e6).toFixed(1)} млн USDT`;
}
function paintBook(){
  const a=BOOK.a.slice(0,12),b=BOOK.b.slice(0,12),mx=Math.max(...a.map(x=>x[1]),...b.map(x=>x[1]),1);
  const row=(p,q,s)=>`<div data-p="${p}"><i style="width:${q/mx*100}%;background:${s==='a'?R:G}"></i><span style="color:${s==='a'?R:G}">${fmt(p)}</span><span>${q.toFixed(4)}</span></div>`;
  $('#bk').innerHTML=a.slice().reverse().map(x=>row(x[0],x[1],'a')).join('')+b.map(x=>row(x[0],x[1],'b')).join('');
  $('#sp').textContent=a.length&&b.length?`Спред ${fmt(a[0][0]-b[0][0])} (${((a[0][0]-b[0][0])/b[0][0]*100).toFixed(3)}%)`:'';
}
function paintTape(){
  $('#tape').innerHTML=TR.slice(0,30).map(t=>`<div style="display:flex;justify-content:space-between"><span class="muted">${new Date(t.t).toLocaleTimeString('ru-RU')}</span><span style="color:${t.bm?R:G}">${fmt(t.p)}</span><span>${t.q.toFixed(4)}</span></div>`).join('');
}
function paintOpen(){
  $('#open').innerHTML=S.orders.filter(o=>o.st==='open').map(o=>`<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--b);padding:4px 0"><span>${o.sym} ${o.side==='buy'?'Покупка':'Продажа'} ${TN[o.type]}${o.price?' @ '+fmt(o.price):''}<br><span class="muted">${o.side==='buy'?'USDT '+(o.usdt-o.spent).toFixed(2):(o.qty-o.filled).toFixed(6)+' осталось'}</span></span><button data-c="${o.id}">✕</button></div>`).join('')||'<span class="muted">Нет открытых ордеров</span>';
}
function paintAlerts(){
  $('#alerts').innerHTML=S.alerts.map((a,i)=>`<div class="row" style="justify-content:space-between">${a.sym} ${a.dir==='up'?'≥':'≤'} ${fmt(a.p)} <button data-ad="${i}">✕</button></div>`).join('')||'Алертов нет';
}
function sumText(){
  const s=S.pair,cur=M[s].p,am=+$('#oa').value||0,mk=ui.type==='market',pr=mk?cur:(+$('#op').value||cur);
  let t='';
  if(am>0){
    if(mk){
      const e=est(ui.side,am);
      t=ui.side==='buy'
        ?`≈ ${e.qty.toFixed(6)} ${s} · ср. цена ${fmt(e.avg)} · проскальзывание ${((e.avg/cur-1)*100).toFixed(3)}%${e.rem>.01?' · в стакане не хватает ликвидности на '+e.rem.toFixed(2)+' USDT':''}`
        :`≈ ${fmt(e.cost*(1-FEE))} USDT после комиссии ${(FEE*100).toFixed(1)}%${e.qty<am?' · в стакане не хватает ликвидности: продастся '+e.qty.toFixed(6):''}`;
    }else t=ui.side==='buy'?`≈ ${(am*(1-FEE)/pr).toFixed(6)} ${s} · комиссия ${fmt(am*FEE)} USDT`:`≈ ${fmt(am*pr*(1-FEE))} USDT · комиссия ${fmt(am*pr*FEE)}`;
  }
  $('#sum').textContent=t;
}
function paintTerminal(){
  paintTicker();paintBook();paintTape();paintOpen();paintAlerts();
  $('#go').textContent=(ui.side==='buy'?'Купить ':'Продать ')+S.pair;
  $('#go').className='bigbtn '+ui.side;
  $('#av').textContent=ui.side==='buy'?`Доступно: ${fmt(S.usdt)} USDT`:`Доступно: ${Math.max(0,(S.hold[S.pair]?.qty||0)-reserved(S.pair)).toFixed(6)} ${S.pair}`;
  sumText();drawChart();
}
function paintMarket(){
  const q=$('#q').value.trim().toLowerCase();
  $('#mk').innerHTML=listFor().filter(s=>!q||s.toLowerCase().includes(q)).map(s=>{const m=M[s];
    return `<tr class="clk" data-s="${s}"><td><span data-f="${s}" style="color:var(--y)">${S.fav.includes(s)?'★':'☆'}</span></td><td><b>${s}/USDT</b></td><td>${fmt(m.p)}</td><td class="${cl(m.ch)}">${m.ch>=0?'+':''}${m.ch.toFixed(2)}%</td><td>${fmt(m.hi)}</td><td>${fmt(m.lo)}</td><td>${(m.vol/1e6).toFixed(1)} млн</td></tr>`}).join('');
  const so=SYMS.slice().sort((a,b)=>M[b].ch-M[a].ch),g=so[0],l=so[so.length-1];
  $('#top').innerHTML=`<div class="card">Лидер роста: <b>${g}</b> <span class="up">+${M[g].ch.toFixed(2)}%</span></div><div class="card">Лидер падения: <b>${l}</b> <span class="down">${M[l].ch.toFixed(2)}%</span></div>`;
}
function drawEq(){
  const cv=$('#eq'),dpr=devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;if(!w)return;
  cv.width=w*dpr;cv.height=h*dpr;const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,w,h);
  const d=S.eq.length>1?S.eq.map(p=>p.v):[S.start,equity().total];
  const lo=Math.min(...d),hi2=Math.max(...d),rg=(hi2-lo)||1;
  x.strokeStyle=d[d.length-1]>=S.start?G:R;x.lineWidth=2;x.beginPath();
  d.forEach((v,i)=>{const px=i/(d.length-1)*w,py=h-(v-lo)/rg*(h-10)-5;i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();
}
function paintPortfolio(){
  const e=equity(),pnl=e.total-S.start,roi=pnl/S.start*100;
  const real=S.orders.reduce((a,o)=>a+(o.side==='sell'?o.pnl:0),0),fees=S.orders.reduce((a,o)=>a+o.fee,0);
  $('#pst').innerHTML=[['Всего, USDT',fmt(e.total)],['Свободно',fmt(e.free)],['В ордерах',fmt(e.locked)],['В активах',fmt(e.coins)],['Нереализ. PnL',sg(e.unreal)],['Реализ. PnL',sg(real)],['Общий PnL',sg(pnl)],['ROI',`<span class="${cl(roi)}">${roi>=0?'+':''}${roi.toFixed(2)}%</span>`],['Комиссии',fmt(fees)]]
    .map(([a,b])=>`<div><span class="muted">${a}</span><b>${b}</b></div>`).join('');
  const rows=Object.entries(S.hold).map(([s,h])=>{const v=h.qty*M[s].p;
    return `<tr><td><b>${s}</b></td><td>${h.qty.toFixed(6)}</td><td>${fmt(h.cost/h.qty)}</td><td>${fmt(M[s].p)}</td><td>${fmt(v)}</td><td>${(v/e.total*100).toFixed(1)}%</td><td>${sg(v-h.cost)}</td></tr>`});
  $('#hd').innerHTML=rows.join('')||'<tr><td colspan="7" class="muted">Активов пока нет</td></tr>';
  drawEq();
}
const FILT={all:()=>1,buy:o=>o.side==='buy',sell:o=>o.side==='sell',open:o=>o.st==='open',filled:o=>o.st==='filled',cancelled:o=>o.st==='cancelled'};
function paintHistory(){
  const list=S.orders.filter(FILT[$('#hf').value]).slice().reverse();
  $('#ht').innerHTML=list.map(o=>`<tr class="clk" data-id="${o.id}"><td>${new Date(o.t).toLocaleString('ru-RU')}</td><td>${o.sym}</td><td class="${o.side==='buy'?'up':'down'}">${o.side==='buy'?'Покупка':'Продажа'}</td><td>${TN[o.type]}</td><td>${o.filled?o.filled.toFixed(6):'—'}</td><td>${o.avg?fmt(o.avg):(o.price?fmt(o.price):'рынок')}</td><td>${o.fee.toFixed(4)}</td><td>${fmt(o.side==='buy'?o.spent:o.recv)}</td><td>${o.side==='sell'&&o.filled?sg(o.pnl):'—'}</td><td>${o.st==='open'&&o.filled>0?'Частично':SL[o.st]}${o.left>.01&&o.st!=='open'?' · не исполнено: '+o.left:''}</td><td>${o.note?'📝':''}</td></tr>`).join('');
  $('#noo').classList.toggle('hidden',list.length>0);
}
function paintAnalytics(){
  const sells=S.orders.filter(o=>o.side==='sell'&&o.filled>0),w=sells.filter(o=>o.pnl>0),l=sells.filter(o=>o.pnl<=0);
  const sum=a=>a.reduce((x,o)=>x+o.pnl,0),gain=sum(w),loss=-sum(l);
  const wr=sells.length?w.length/sells.length*100:0;
  let peak=0,dd=0;S.eq.forEach(p=>{peak=Math.max(peak,p.v);if(peak>0)dd=Math.max(dd,(peak-p.v)/peak*100)});
  const exec=S.orders.filter(o=>o.filled>0).length;
  const best=sells.slice().sort((a,b)=>b.pnl-a.pnl)[0],worst=sells.slice().sort((a,b)=>a.pnl-b.pnl)[0];
  $('#an').innerHTML=[
    ['Исполненных ордеров',exec],['Закрытых продаж',sells.length],['Прибыльных',w.length],['Убыточных',l.length],
    ['Win Rate',wr.toFixed(1)+'%'],['Средняя прибыль',w.length?'+'+(gain/w.length).toFixed(2):'—'],['Средний убыток',l.length?(-loss/l.length).toFixed(2):'—'],
    ['Profit Factor',loss>0?(gain/loss).toFixed(2):'—'],['Макс. просадка',dd.toFixed(2)+'%'],
    ['Лучшая сделка',best?sg(best.pnl)+' '+best.sym:'—'],['Худшая сделка',worst?sg(worst.pnl)+' '+worst.sym:'—']
  ].map(([a,b])=>`<div><span class="muted">${a}</span><b>${b}</b></div>`).join('');
  $('#jr').innerHTML=S.orders.filter(o=>o.note).slice().reverse().map(o=>`<div class="card"><b>${o.sym} · ${o.side==='buy'?'Покупка':'Продажа'} · ${TN[o.type]}</b> <span class="muted">${new Date(o.t).toLocaleString('ru-RU')}</span><div style="margin-top:4px">${esc(o.note)}</div></div>`).join('')||'<span class="muted">Заметок пока нет</span>';
}
function toCSV(){
  const h='Время;Пара;Сторона;Тип;Кол-во;Цена;Комиссия;Сумма USDT;PnL;Статус';
  return [h,...S.orders.map(o=>[new Date(o.t).toLocaleString('ru-RU'),o.sym,o.side,o.type,o.filled,o.avg??o.price??'',o.fee,o.side==='buy'?o.spent:o.recv,o.pnl,o.st].join(';'))].join('\n');
}
function paintAll(){
  if(ui.tab==='terminal')paintTerminal();
  else if(ui.tab==='market')paintMarket();
  else if(ui.tab==='portfolio')paintPortfolio();
  else if(ui.tab==='history')paintHistory();
  else if(ui.tab==='analytics')paintAnalytics();
  else if(ui.tab==='invest')paintInvest();
}
