// ---------- События ----------
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
$('#mode').onclick=()=>setMode(S.mode==='learn'?'trade':'learn');
$('#theme').onclick=()=>{const d=document.documentElement;d.dataset.theme=d.dataset.theme==='dark'?'light':'dark';$('#theme').textContent=d.dataset.theme==='dark'?'☾':'☀︎';frame()};
$('#q').oninput=paintMarket;
$('#mk').onclick=e=>{
  const f=e.target.dataset.f;
  if(f){S.fav=S.fav.includes(f)?S.fav.filter(x=>x!==f):[...S.fav,f];save();paintMarket();return}
  const tr=e.target.closest('tr[data-s]');if(tr){changePair(tr.dataset.s);showTab('terminal')}
};
$('#sym').innerHTML=SYMS.map(s=>`<option value="${s}">${s}/USDT</option>`).join('');
$('#sym').value=S.pair;
$('#sym').onchange=e=>changePair(e.target.value);
$('#ivs').innerHTML=IVS.map(t=>`<button data-iv="${t}" class="${t===S.iv?'on':''}">${t}</button>`).join('');
$('#ivs').onclick=e=>{const v=e.target.dataset.iv;if(!v)return;S.iv=v;save();document.querySelectorAll('[data-iv]').forEach(b=>b.classList.toggle('on',b.dataset.iv===v));loadK();connect()};
$('#inds').innerHTML=INDS.map(t=>`<button data-ind="${t}" class="${S.inds.includes(t)?'on':''}">${t}</button>`).join('');
$('#inds').onclick=e=>{const v=e.target.dataset.ind;if(!v)return;S.inds=S.inds.includes(v)?S.inds.filter(x=>x!==v):[...S.inds,v];save();document.querySelectorAll('[data-ind]').forEach(b=>b.classList.toggle('on',S.inds.includes(b.dataset.ind)));frame()};
const cv=$('#chart');
cv.addEventListener('wheel',e=>{e.preventDefault();V.n=Math.max(20,Math.min(400,Math.round(V.n*(e.deltaY>0?1.1:.9))));frame()},{passive:false});
cv.onpointerdown=e=>{dragS={x:e.clientX,off:V.off}};
cv.onpointermove=e=>{hx=e.offsetX;if(dragS){const bw=cv.clientWidth/V.n;V.off=Math.max(0,Math.min(Math.max(0,K.length-V.n),dragS.off+Math.round((e.clientX-dragS.x)/bw)))}frame()};
cv.onpointerleave=()=>{hx=null;frame()};
window.addEventListener('pointerup',()=>dragS=null);
window.addEventListener('resize',frame);
$('#bB').onclick=()=>setSide('buy');$('#bS').onclick=()=>setSide('sell');
$('#ot').onchange=e=>setType(e.target.value);
$('#oa').oninput=sumText;$('#op').oninput=sumText;
document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{
  const k=+b.dataset.p,s=S.pair;
  if(ui.side==='buy')$('#oa').value=r(S.usdt*k,2);
  else $('#oa').value=r(Math.max(0,(S.hold[s]?.qty||0)-reserved(s))*k,8);
  sumText();
});
$('#go').onclick=place;
$('#bk').onclick=e=>{const d=e.target.closest('[data-p]');if(!d)return;setType('limit');$('#op').value=d.dataset.p;sumText()};
$('#open').onclick=e=>{if(e.target.dataset.c)cancel(e.target.dataset.c)};
$('#alB').onclick=()=>{
  const p=+$('#al').value;if(!(p>0))return msg('Введите цену','bad');
  S.alerts.push({sym:S.pair,p,dir:p>M[S.pair].p?'up':'down'});save();$('#al').value='';paintAlerts();
  if('Notification' in window&&Notification.permission==='default')Notification.requestPermission();
};
$('#alerts').onclick=e=>{const i=e.target.dataset.ad;if(i!=null){S.alerts.splice(+i,1);save();paintAlerts()}};
$('#hf').onchange=paintHistory;
$('#ht').onclick=e=>{
  const tr=e.target.closest('tr[data-id]');if(!tr)return;
  const o=S.orders.find(x=>x.id===tr.dataset.id);if(!o)return;
  const n=prompt('Заметка к сделке: причина входа, стратегия, ошибки',o.note||'');
  if(n!==null){o.note=n;save();paintHistory()}
};
$('#csvB').onclick=()=>{$('#ctxt').value=toCSV();$('#cbox').classList.remove('hidden');$('#ctxt').select()};
$('#capB').onclick=()=>{
  const v=+$('#cap').value;if(!(v>0))return msg('Введите сумму','bad');
  if(!confirm('Сбросить счёт, портфель и историю?'))return;
  S=fresh(v,{pair:S.pair,fav:S.fav,mode:S.mode,iv:S.iv,inds:S.inds});save();
  setSide('buy');paintAll();msg('Счёт сброшен','ok');
};
