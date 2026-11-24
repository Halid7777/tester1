// ---------- График ----------
function drawChart(){
  const cv=$('#chart'),dpr=devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;
  if(!w||!K.length)return;
  cv.width=w*dpr;cv.height=h*dpr;const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,w,h);
  const n=K.length;V.off=Math.max(0,Math.min(V.off,n-10));
  const st=Math.max(0,n-V.n-V.off),en=n-V.off,C=K.map(k=>k.c),sl=K.slice(st,en);
  const SM=sma(C,20),EM=ema(C,20),BB=bb(C,20,2),VW=vwap(K),RS=rsi(C),E12=ema(C,12),E26=ema(C,26),MD=E12.map((v,q)=>v-E26[q]),SG=ema(MD,9);
  const on=k=>S.inds.includes(k),rs=on('RSI');
  const pH=h*(rs?.7:.8),vH=h*(rs?.1:.2),rH=rs?h*.2:0;
  let hi=Math.max(...sl.map(k=>k.h)),lo=Math.min(...sl.map(k=>k.l));
  if(on('BB'))for(let i=st;i<en;i++)if(BB[i]){hi=Math.max(hi,BB[i][0]);lo=Math.min(lo,BB[i][2])}
  const pd=(hi-lo)*.05||1;hi+=pd;lo-=pd;
  const bw=w/V.n,X=j=>j*bw+bw/2,Y=v=>pH-(v-lo)/(hi-lo)*pH;
  x.strokeStyle='rgba(128,128,128,.12)';x.lineWidth=1;
  for(let i=0;i<=4;i++){const y=pH*i/4;x.beginPath();x.moveTo(0,y);x.lineTo(w,y);x.stroke()}
  const vm=Math.max(...sl.map(k=>k.v))||1;
  sl.forEach((k,j)=>{
    const cx=X(j),col=k.c>=k.o?G:R;
    x.globalAlpha=.35;x.fillStyle=col;x.fillRect(cx-bw*.35,pH+vH-vH*k.v/vm,bw*.7,vH*k.v/vm);x.globalAlpha=1;
    x.strokeStyle=col;x.beginPath();x.moveTo(cx,Y(k.h));x.lineTo(cx,Y(k.l));x.stroke();
    const t=Y(Math.max(k.o,k.c)),b=Y(Math.min(k.o,k.c));x.fillStyle=col;x.fillRect(cx-bw*.35,t,bw*.7,Math.max(1,b-t));
  });
  const line=(arr,col,dash=[],f=Y)=>{x.strokeStyle=col;x.lineWidth=1.3;x.setLineDash(dash);x.beginPath();let up=0;
    for(let i=st;i<en;i++){const v=arr[i];if(v==null){up=0;continue}up?x.lineTo(X(i-st),f(v)):x.moveTo(X(i-st),f(v));up=1}
    x.stroke();x.setLineDash([])};
  if(on('SMA'))line(SM,'#f0b90b');
  if(on('EMA'))line(EM,'#5ac8fa');
  if(on('BB')){line(BB.map(a=>a&&a[0]),'#b57edc',[3,3]);line(BB.map(a=>a&&a[2]),'#b57edc',[3,3])}
  if(on('VWAP'))line(VW,'#ff9f43');
  if(rs){
    const ry=v=>pH+vH+rH-v/100*rH;
    x.strokeStyle='rgba(128,128,128,.3)';[30,70].forEach(v=>{x.beginPath();x.moveTo(0,ry(v));x.lineTo(w,ry(v));x.stroke()});
    line(RS,'#a29bfe',[],ry);
  }
  const lp=M[S.pair].p,ly=Y(lp);
  x.setLineDash([4,4]);x.strokeStyle=M[S.pair].ch>=0?G:R;x.beginPath();x.moveTo(0,ly);x.lineTo(w,ly);x.stroke();x.setLineDash([]);
  let j=hx!=null?Math.floor(hx/bw):sl.length-1;j=Math.max(0,Math.min(sl.length-1,j));
  const i=st+j,k=K[i];
  if(hx!=null){x.strokeStyle='rgba(128,128,128,.6)';x.beginPath();x.moveTo(X(j),0);x.lineTo(X(j),h);x.stroke()}
  const f=v=>v==null?'—':fmt(v);
  $('#leg').innerHTML=`${new Date(k.t).toLocaleString('ru-RU')} · O ${f(k.o)} H ${f(k.h)} L ${f(k.l)} C ${f(k.c)} V ${k.v.toFixed(2)}`
    +(on('SMA')?` · SMA20 ${f(SM[i])}`:'')+(on('EMA')?` · EMA20 ${f(EM[i])}`:'')
    +(on('BB')&&BB[i]?` · BB ${f(BB[i][0])}/${f(BB[i][2])}`:'')+(on('VWAP')?` · VWAP ${f(VW[i])}`:'')
    +(rs?` · RSI ${RS[i]==null?'—':RS[i].toFixed(1)}`:'')+` · MACD ${MD[i]==null?'—':MD[i].toFixed(2)} / ${SG[i]==null?'—':SG[i].toFixed(2)}`;
}
function frame(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;paintAll()})}
