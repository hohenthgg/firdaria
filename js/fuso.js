/* ============================================================
   FUSO.JS — o recorte do DIA depende do fuso local.

   A longitude de um trânsito é geocêntrica e não tem fuso. Mas “o que
   está ativo no dia 6” é uma pergunta de calendário local: o mesmo
   aspecto exato às 23h30 em São Paulo cai no dia seguinte em Lisboa.
   Por isso o dia é recortado pelo fuso IANA guardado com o mapa, e os
   horários exibidos são convertidos para ele.

   Se o mapa foi inserido à mão e não tem fuso, o app NÃO assume UTC em
   silêncio: pede a escolha, guarda no estado e mostra aviso enquanto
   não estiver definida.
   ============================================================ */

const FUSO_CHAVE='agx_fuso';

function fusoValido(tz){
  if(!tz||typeof tz!=='string')return false;
  try{ new Intl.DateTimeFormat('en-US',{timeZone:tz}); return true; }
  catch(e){ return false; }
}
/* o fuso do mapa; null quando não foi definido */
function fusoDoMapa(){
  try{
    if(typeof STATE!=='undefined'&&STATE.natal&&STATE.natal.place&&STATE.natal.place.tz)
      return fusoValido(STATE.natal.place.tz)?STATE.natal.place.tz:null;
  }catch(e){}
  try{ const g=localStorage.getItem(FUSO_CHAVE); if(fusoValido(g))return g; }catch(e){}
  return null;
}
function fusoDefinir(tz){
  if(!fusoValido(tz))return false;
  try{
    if(typeof STATE!=='undefined'&&STATE.natal){
      STATE.natal.place=STATE.natal.place||{};
      STATE.natal.place.tz=tz;
      if(typeof saveState==='function')saveState();
    }
    localStorage.setItem(FUSO_CHAVE,tz);
  }catch(e){}
  return true;
}
/* sugestão apenas para preencher o seletor — nunca aplicada sozinha */
function fusoDoDispositivo(){
  try{ return Intl.DateTimeFormat().resolvedOptions().timeZone||null; }catch(e){ return null; }
}
function fusoEstado(){
  const tz=fusoDoMapa();
  return {tz, definido:!!tz, sugestao:fusoDoDispositivo(),
    aviso: tz?null
      :'O fuso deste mapa não está definido. Os dias e horários abaixo não podem '
      +'ser recortados com segurança: escolha o fuso para que “hoje” signifique o '
      +'dia local, e não um intervalo arbitrário.'};
}

/* deslocamento do fuso, em ms, no instante dado */
function fusoOffsetMs(tz, utcMs){
  const dtf=new Intl.DateTimeFormat('en-US',{timeZone:tz, hour12:false,
    year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', second:'2-digit'});
  const p={}; dtf.formatToParts(new Date(utcMs)).forEach(x=>{p[x.type]=x.value;});
  const h=(+p.hour)%24;   // en-US pode devolver 24 na meia-noite
  return Date.UTC(+p.year, (+p.month)-1, +p.day, h, +p.minute, +p.second)-utcMs;
}
/* data local (YYYY-MM-DD) de um instante */
function diaLocal(utcMs, tz){
  const z=tz||fusoDoMapa();
  if(!z)return new Date(utcMs).toISOString().slice(0,10);
  const off=fusoOffsetMs(z, utcMs);
  return new Date(utcMs+off).toISOString().slice(0,10);
}
/* instante UTC do início do dia local — resolvido por iteração, porque o
   próprio deslocamento depende do instante (horário de verão) */
function inicioDoDiaLocal(ymd, tz){
  const z=tz||fusoDoMapa();
  const [Y,M,D]=ymd.split('-').map(Number);
  const alvo=Date.UTC(Y,M-1,D,0,0,0,0);
  if(!z)return alvo;
  let t=alvo;
  for(let i=0;i<4;i++){ t=alvo-fusoOffsetMs(z,t); }
  return t;
}
/* [início, fim) do dia local, em ms UTC */
function limitesDoDiaLocal(ymd, tz){
  const ini=inicioDoDiaLocal(ymd,tz);
  const [Y,M,D]=ymd.split('-').map(Number);
  const seg=new Date(Date.UTC(Y,M-1,D));
  seg.setUTCDate(seg.getUTCDate()+1);
  const fim=inicioDoDiaLocal(seg.toISOString().slice(0,10), tz);
  return {ini, fim};
}
/* hora local legível de um instante */
function horaLocal(utcMs, tz){
  const z=tz||fusoDoMapa();
  if(!z)return new Date(utcMs).toISOString().slice(11,16)+' UTC';
  try{
    return new Intl.DateTimeFormat('pt-BR',{timeZone:z, hour:'2-digit',
      minute:'2-digit', hour12:false}).format(new Date(utcMs));
  }catch(e){ return new Date(utcMs).toISOString().slice(11,16)+' UTC'; }
}
function dataLocalLegivel(ymd){
  const [Y,M,D]=ymd.split('-').map(Number);
  const M2=(typeof MESES!=='undefined')?MESES[M-1]:String(M);
  return D+' '+M2+' '+Y;
}
/* soma dias a uma data local, sem passar por fuso */
function somaDias(ymd, n){
  const [Y,M,D]=ymd.split('-').map(Number);
  const d=new Date(Date.UTC(Y,M-1,D));
  d.setUTCDate(d.getUTCDate()+n);
  return d.toISOString().slice(0,10);
}
/* o dia local de agora */
function hojeLocal(tz){ return diaLocal(Date.now(), tz); }
