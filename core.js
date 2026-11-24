const $=s=>document.querySelector(s),G='#0ecb81',R='#f6465d';
const SYMS=['BTC','ETH','BNB','SOL','XRP','DOGE','ADA','LTC','TON','AVAX','LINK','DOT','TRX','SHIB','BCH','UNI','NEAR','APT','ATOM','FIL','ETC','ICP','ARB','OP','INJ','SUI','PEPE','AAVE','XLM','HBAR'];
const IVS=['1m','5m','15m','1h','4h','1d'],IVMS={'1m':6e4,'5m':3e5,'15m':9e5,'1h':36e5,'4h':144e5,'1d':864e5};
const INDS=['SMA','EMA','BB','VWAP','RSI'];
const FEE=.001;
const HOSTS=[['https://api.binance.com','wss://stream.binance.com:9443'],['https://data-api.binance.vision','wss://data-stream.binance.vision']];
const BASE={BTC:67000,ETH:3500,BNB:600,SOL:150,XRP:.6,DOGE:.15,ADA:.45,LTC:85,TON:6,AVAX:35,LINK:14,DOT:6,TRX:.25,SHIB:.00002,BCH:450,UNI:9,NEAR:5,APT:9,ATOM:6,FIL:5,ETC:22,ICP:12,ARB:.9,OP:2,INJ:25,SUI:3,PEPE:.00001,AAVE:180,XLM:.12,HBAR:.15};
const TN={market:'Market',limit:'Limit',stop:'Stop-Loss',tp:'Take-Profit'};
const TD={market:'Исполняется сразу по стакану. Цена зависит от глубины рынка, поэтому возможно проскальзывание.',limit:'Исполнится только по вашей цене или лучше. Может исполниться частично.',stop:'Продаст монеты по рынку, если цена упадёт до уровня. Ограничивает убыток.',tp:'Продаст монеты по рынку, если цена вырастет до уровня. Фиксирует прибыль.'};
const TYPES={buy:[['market','Market'],['limit','Limit']],sell:[['market','Market'],['limit','Limit'],['stop','Stop-Loss'],['tp','Take-Profit']]};
const SL={open:'Открыт',filled:'Исполнен',cancelled:'Отменён'};

const fresh=(cap=10000,k)=>Object.assign({usdt:cap,start:cap,hold:{},orders:[],eq:[],fav:['BTC','ETH'],alerts:[],pair:'BTC',iv:'1m',inds:['SMA','BB','VWAP'],mode:'trade'},k||{});
let S;try{S=fresh(10000,JSON.parse(localStorage.getItem('kh2')))}catch(e){S=fresh()}
const save=()=>{try{localStorage.setItem('kh2',JSON.stringify(S))}catch(e){}};
const r=(x,d)=>Math.round(x*10**d)/10**d,uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const fmt=p=>p==null||isNaN(p)?'—':p>=1000?p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):p>=1?p.toFixed(4):p.toFixed(6);
const cl=v=>v>=0?'up':'down';
const sg=(v,d=2)=>`<span class="${cl(v)}">${v>=0?'+':''}${v.toFixed(d)}</span>`;
const gauss=()=>(Math.random()+Math.random()+Math.random()-1.5)*1.15;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const msg=(t,c='')=>{const e=$('#msg');e.textContent=t;e.className='toast '+c;e.style.display='block';clearTimeout(msg.t);msg.t=setTimeout(()=>e.style.display='none',2500)};

// ---------- Состояние рынка ----------
const M={},BOOK={a:[],b:[]},TR=[];let K=[],mode='demo',hi=0,ws=null,tickN=0,hx=null,dragS=null,raf=0;
const ui={tab:'market',side:'buy',type:'market'},V={n:120,off:0};
