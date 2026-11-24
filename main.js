// ---------- Запуск ----------
demoInit();
setSrc('demo');
setMode(S.mode);
setSide('buy');
showTab('market');
(async()=>{await loadTickers();await loadK();connect();})();
setInterval(async()=>{
  tickN++;
  if(mode==='demo'){
    demoStep();
    if(tickN%15===0&&await loadTickers()){await loadK();connect()}
  }else{
    if(tickN%10===0)await loadTickers();
    if((!ws||ws.readyState!==1)&&tickN%5===0){await loadBook();await loadTrades()}
  }
  runBots();
  if(tickN%30===0){S.eq.push({t:Date.now(),v:r(equity().total,2)});if(S.eq.length>800)S.eq.shift();save()}
  frame();
},1000);
