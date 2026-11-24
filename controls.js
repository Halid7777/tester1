// ---------- Управление ----------
function setSide(s){
  ui.side=s;ui.type='market';
  $('#bB').className=s==='buy'?'on':'';$('#bS').className=s==='sell'?'on':'';
  $('#ot').innerHTML=TYPES[s].map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  $('#oa').value='';setType('market');frame();
}
function setType(t){
  ui.type=t;$('#ot').value=t;$('#th').textContent=TD[t];
  $('#op').disabled=t==='market';if(t==='market')$('#op').value='';
  $('#lp').textContent=(t==='stop'||t==='tp'?'Цена срабатывания':'Цена')+', USDT';
  $('#la').textContent=ui.side==='buy'?'Сумма, USDT':'Количество, '+S.pair;
  sumText();
}
function changePair(s){
  S.pair=s;save();$('#sym').value=s;TR.length=0;
  loadK();connect();setSide(ui.side);
}
function showTab(t){
  ui.tab=t;
  ['market','terminal','portfolio','history','analytics','invest'].forEach(x=>$('#s-'+x).classList.toggle('hidden',x!==t));
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));
  paintAll();window.scrollTo(0,0);
}
function setMode(m){S.mode=m;document.body.classList.toggle('learn',m==='learn');$('#mode').textContent=m==='learn'?'Режим: обучение':'Режим: торговля';save()}
