// ---------- Исполнение ордеров (по стакану и по потоку сделок) ----------
const reserved=s=>S.orders.filter(o=>o.st==='open'&&o.side==='sell'&&o.sym===s).reduce((a,o)=>a+o.qty-o.filled,0);
const remBase=o=>o.side==='buy'?(o.usdt-o.spent)/(o.price*(1+FEE)):o.qty-o.filled;
function fillOrder(o,q,p){
  if(!(q>0))return;
  const h=S.hold[o.sym]||{qty:0,cost:0};
  if(o.side==='buy'){
    const c=q*p,f=c*FEE;
    o.spent=r(o.spent+c+f,2);o.fee=r(o.fee+f,4);o.filled=r(o.filled+q,8);
    S.hold[o.sym]={qty:r(h.qty+q,8),cost:r(h.cost+c+f,2)};
  }else{
    if(!h.qty)return;
    const g=q*p,f=g*FEE,net=g-f,part=h.cost*(q/h.qty);
    const nq=r(h.qty-q,8);
    if(nq<=1e-9)delete S.hold[o.sym];else S.hold[o.sym]={qty:nq,cost:r(h.cost-part,2)};
    S.usdt=r(S.usdt+net,2);
    o.recv=r(o.recv+net,2);o.fee=r(o.fee+f,4);o.pnl=r(o.pnl+net-part,2);o.filled=r(o.filled+q,8);
  }
  o.avg=o.side==='buy'?o.spent/o.filled:o.recv/o.filled;
}
function finish(o){
  if(o.st!=='open')return;
  if(o.side==='buy'&&o.type==='limit'&&o.usdt-o.spent<.01){S.usdt=r(S.usdt+(o.usdt-o.spent),2);o.st='filled'}
  else if(o.side==='sell'&&o.qty-o.filled<=1e-9)o.st='filled';
}
function closeOrder(o){
  if(o.st!=='open')return;
  o.st=o.filled>0?'filled':'cancelled';
  if(o.side==='buy'){const left=r(o.usdt-o.spent,2);S.usdt=r(S.usdt+left,2);o.left=left}
  else o.left=r(o.qty-o.filled,8);
}
// Проходит по стакану: market/stop/tp закрываются, limit остаётся открытым при частичном исполнении
function walk(o){
  const lv=o.side==='buy'?BOOK.a:BOOK.b;
  for(const[p,q]of lv){
    if(o.type==='limit'&&(o.side==='buy'?p>o.price:p<o.price))break;
    if(o.side==='buy'){const rem=o.usdt-o.spent;if(rem<.01)break;fillOrder(o,Math.min(q,rem/(p*(1+FEE))),p)}
    else{const rem=o.qty-o.filled;if(rem<=1e-9)break;fillOrder(o,Math.min(q,rem),p)}
  }
  if(o.type==='limit')finish(o);else closeOrder(o);
}
function onTrade(sym,p,q,t,bm){
  M[sym].p=p;TR.unshift({p,q,t,bm});if(TR.length>40)TR.length=40;
  S.orders.forEach(o=>{
    if(o.st!=='open'||o.sym!==sym||o.type==='market')return;
    if(o.type==='limit'){
      if(o.side==='buy'?p<=o.price:p>=o.price){fillOrder(o,Math.min(q,remBase(o)),o.price);finish(o)}
    }else if(o.type==='stop'?p<=o.price:p>=o.price)walk(o);
  });
  S.alerts=S.alerts.filter(a=>{
    if(a.sym!==sym)return true;
    const hit=a.dir==='up'?p>=a.p:p<=a.p;
    if(hit){msg(`Алерт: ${sym} ${a.dir==='up'?'≥':'≤'} ${fmt(a.p)}`,'ok');try{if(Notification.permission==='granted')new Notification('Kriptohal',{body:`${sym}: ${fmt(p)}`})}catch(e){}}
    return!hit;
  });
  save();
}
function place(){
  const s=S.pair,cur=M[s].p,t=ui.type,side=ui.side,pr=+$('#op').value,am=+$('#oa').value;
  if(t!=='market'&&!(pr>0))return msg('Укажите цену','bad');
  if(t==='stop'&&pr>=cur)return msg('Stop-Loss должен быть ниже текущей цены','bad');
  if(t==='tp'&&pr<=cur)return msg('Take-Profit должен быть выше текущей цены','bad');
  if(!(am>0))return msg(side==='buy'?'Введите сумму в USDT':'Введите количество','bad');
  const o={id:uid(),t:Date.now(),sym:s,side,type:t,price:t==='market'?null:r(pr,8),st:'open',spent:0,filled:0,fee:0,recv:0,pnl:0};
  if(side==='buy'){
    if(am>S.usdt+1e-9)return msg('Недостаточно USDT. Свободно: '+fmt(S.usdt),'bad');
    o.usdt=r(am,2);S.usdt=r(S.usdt-o.usdt,2);
  }else{
    const h=S.hold[s];const free=(h?h.qty:0)-reserved(s);
    if(am>free+1e-9)return msg('Недостаточно '+s+'. Свободно: '+Math.max(0,free).toFixed(6),'bad');
    o.qty=r(am,8);
  }
  S.orders.push(o);
  if(t==='market'||(t==='limit'&&(side==='buy'?pr>=cur:pr<=cur)))walk(o);
  save();frame();
  msg(o.st==='filled'?'Ордер исполнен':o.st==='cancelled'?'Ордер не исполнен: нет ликвидности':'Ордер размещён','ok');
}
function cancel(id){
  const o=S.orders.find(x=>x.id===id);if(!o||o.st!=='open')return;
  if(o.side==='buy')S.usdt=r(S.usdt+(o.usdt-o.spent),2);
  o.st='cancelled';o.left=o.side==='buy'?r(o.usdt-o.spent,2):r(o.qty-o.filled,8);
  save();frame();msg('Ордер отменён');
}
function est(side,am){
  let rem=am,qty=0,cost=0;const lv=side==='buy'?BOOK.a:BOOK.b;
  for(const[p,q]of lv){
    if(side==='buy'){const t=Math.min(q,rem/(p*(1+FEE)));qty+=t;cost+=t*p;rem-=t*p*(1+FEE);if(rem<=.01)break}
    else{const t=Math.min(q,rem);qty+=t;cost+=t*p;rem-=t;if(rem<=1e-9)break}
  }
  return{qty,cost,avg:qty?cost/qty:0,rem:Math.max(0,rem)};
}
function equity(){
  let free=S.usdt,locked=0,coins=0,unreal=0;
  S.orders.forEach(o=>{if(o.st==='open'&&o.side==='buy')locked+=o.usdt-o.spent});
  for(const s in S.hold){const h=S.hold[s],v=h.qty*M[s].p;coins+=v;unreal+=v-h.cost}
  const fu=S.fut||[],fm=fu.reduce((a,p)=>a+p.margin+futPnl(p),0),ea=S.earn?S.earn.bal:0;
  return{free,locked,coins,unreal,total:free+locked+coins+fm+ea,fm,ea};
}
