/* ============================================================
   MAIN.JS — navegação, boot, ligação dos controles
   ============================================================ */
document.getElementById('nav').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b)return;
  document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('on',x===b));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('on',p.id==='p-'+b.dataset.p));
  if(b.dataset.p==='tempo') syncTempo();
  if(b.dataset.p==='trans') renderTrans();
  if(b.dataset.p==='rs') renderRS();
});
/* Tempo */
document.getElementById('tempo-pick').addEventListener('change',function(){
  if(this.value){CURSOR=new Date(this.value+'T12:00:00Z');syncTempo();}
});
document.getElementById('tempo-today').onclick=()=>{CURSOR=new Date();syncTempo();};
let TANIM=null;
document.getElementById('tempo-anim').onclick=function(){
  if(TANIM){clearInterval(TANIM);TANIM=null;this.textContent='▶ animar';return;}
  this.textContent='❚❚ pausar';
  const step={vida:200,decada:30,ano:5,mes:1,dia:1/24}[ZOOM]*DAY;
  TANIM=setInterval(()=>{CURSOR=new Date(CURSOR.getTime()+step);if(CURSOR.getTime()>BIRTH+75*365.2425*DAY)CURSOR=new Date(BIRTH);syncTempo();},110);
};
document.getElementById('tempo-zoom').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b)return;
  document.querySelectorAll('#tempo-zoom .btn').forEach(x=>x.classList.toggle('on',x===b));
  ZOOM=b.dataset.z; drawCord();
});
document.getElementById('tempo-pin').onclick=function(){
  if(PINNED){PINNED=null;this.textContent='fixar A/B';}
  else{PINNED=new Date(CURSOR);this.textContent='soltar A';}
  syncTempo();
};
document.getElementById('ev-add').onclick=()=>{
  const d=document.getElementById('ev-date').value, t=document.getElementById('ev-txt').value.trim();
  if(!d||!t)return;
  EVENTS.push({d,txt:t});
  localStorage.setItem('ag_events',JSON.stringify(EVENTS));
  document.getElementById('ev-txt').value='';
  drawCord();
};
document.getElementById('retro-open').onclick=()=>{
  const d=document.getElementById('ev-date').value;
  const t=document.getElementById('ev-txt').value.trim();
  renderRetro(d||CURSOR.toISOString().slice(0,10),t);
};
/* Trânsitos */
document.getElementById('trans-modes').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b)return;
  document.querySelectorAll('#trans-modes .btn').forEach(x=>x.classList.toggle('on',x===b));
  TMODE=b.dataset.m; renderTrans();
});
document.getElementById('trans-pick').addEventListener('change',renderTrans);
/* Perfil filtros */
['ax-search','ax-dom','ax-sort'].forEach(id=>{
  document.getElementById(id).addEventListener('input',renderPers);
  document.getElementById(id).addEventListener('change',renderPers);
});
/* ---- layout: Auto / PC / Mobile (opcional, salvo no navegador) ---- */
const VIEW_MQ=window.matchMedia('(max-width:900px)');
function currentView(){return localStorage.getItem('ag_view')||'auto';}
function applyView(){
  const m=currentView();
  const mob = m==='mobile' || (m==='auto' && VIEW_MQ.matches);
  document.body.classList.toggle('is-mobile',mob);
  document.querySelectorAll('#view-switch [data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===m));
  try{drawCord();}catch(e){}
}
function setView(m){localStorage.setItem('ag_view',m);applyView();}
function bindView(){
  const sw=document.getElementById('view-switch');
  if(sw)sw.addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(b)setView(b.dataset.v);});
  // em modo Auto, acompanha a mudança de tamanho de tela
  const onMQ=()=>{if(currentView()==='auto')applyView();};
  if(VIEW_MQ.addEventListener)VIEW_MQ.addEventListener('change',onMQ);
  else if(VIEW_MQ.addListener)VIEW_MQ.addListener(onMQ);
  applyView();
}
/* boot */
function renderAll(){
  const steps=[renderAgora,renderNatal,renderPlanetas,renderCasas,renderTemp,renderPers,renderRS,
    ()=>{CURSOR=new Date();refreshNPTS();syncTempo();},renderLedger,renderTrans];
  steps.forEach(fn=>{try{fn();}catch(err){console.error('render falhou:',fn.name||'anon',err);}});
  document.getElementById('brand-sub').textContent=NATAL?(NATAL.meta.name+' · '+NATAL.sect+' · '+new Date(BIRTH).toISOString().slice(0,10)):'motor interpretativo tradicional';
}
function saveState(){
  localStorage.setItem('agx_natal',JSON.stringify(STATE.natal||null));
  localStorage.setItem('agx_rs',JSON.stringify(STATE.rs||{}));
}
const STATE={natal:JSON.parse(localStorage.getItem('agx_natal')||'null'),rs:JSON.parse(localStorage.getItem('agx_rs')||'{}')};
function loadFromState(){
  if(!STATE.natal)return false;
  const parsed=parseChartText(STATE.natal.text);
  if(!parsed.ok)return false;
  buildChart(parsed,STATE.natal.birth,STATE.natal.sect,STATE.natal.name);
  Object.entries(STATE.rs).forEach(([y,txt])=>{try{addRS(parseChartText(txt),+y);}catch(e){console.error('RS',y,e);}});
  return true;
}
function renderRSList(){
  const el=document.getElementById('rs-in-list');
  const ys=Object.keys(STATE.rs).sort();
  el.innerHTML=ys.length?('carregadas: '+ys.map(y=>y+' <a href="#" data-del="'+y+'">✕</a>').join(' · ')):'nenhuma revolução carregada.';
  el.querySelectorAll('[data-del]').forEach(a=>a.onclick=e=>{e.preventDefault();
    delete STATE.rs[a.dataset.del];delete RS_DATA[a.dataset.del];saveState();renderRSList();renderRS();});
}
function bindImport(){
  const st=document.getElementById('imp-status');
  document.getElementById('imp-run').onclick=()=>{
    const url=document.getElementById('imp-url').value.trim();
    if(!url){st.textContent='cole o link do Aspectarian.';return;}
    st.textContent='computando mapa (Placidus, planetas tradicionais)…';
    importAspectarian(url,p=>{st.textContent='computando Revoluções Solares… '+Math.round(p*100)+'%';})
      .then(res=>{
        const parsed=parseChartText(res.natalText);
        if(!parsed.ok){st.textContent='falha ao montar o mapa: '+parsed.problems.join('; ');return;}
        // preenche os campos e reusa o fluxo padrão de carga
        document.getElementById('in-name').value=res.name;
        document.getElementById('in-birth').value=res.birthISO;
        document.getElementById('in-natal').value=res.natalText;
        document.getElementById('in-sect').value='auto';
        STATE.natal={text:res.natalText,birth:res.birthISO+':00Z',sect:'auto',name:res.name,place:res.place};
        RS_DATA={};RSMETA={angular:{},echo:{}};
        buildChart(parsed,STATE.natal.birth,'auto',res.name);
        STATE.rs={};
        Object.entries(res.rsTexts).forEach(([y,txt])=>{
          try{addRS(parseChartText(txt),+y);STATE.rs[y]=txt;}catch(e){console.error('RS',y,e);}
        });
        saveState();renderRSList();renderAll();
        st.textContent='importado: '+res.name+' · nascimento '+STATE.natal.birth.slice(0,16).replace('T',' ')+' UTC · Placidus · '+Object.keys(res.rsTexts).length+' revoluções ('+(new Date(BIRTH).getUTCFullYear()+1)+'–'+new Date().getUTCFullYear()+') · seita '+NATAL.sect+'.';
      })
      .catch(e=>{st.textContent='erro: '+e.message;});
  };
}
function bindDados(){
  document.getElementById('in-load').onclick=()=>{
    const txt=document.getElementById('in-natal').value;
    const birth=document.getElementById('in-birth').value;
    const st=document.getElementById('in-status');
    if(!txt.trim()||!birth){st.textContent='informe os dados do mapa e a data/hora de nascimento.';return;}
    const parsed=parseChartText(txt);
    if(!parsed.ok){st.textContent='problemas: '+parsed.problems.join('; ');return;}
    STATE.natal={text:txt,birth:birth+(birth.length===16?':00Z':'Z'),sect:document.getElementById('in-sect').value,name:document.getElementById('in-name').value||'mapa'};
    RS_DATA={};RSMETA={angular:{},echo:{}};
    buildChart(parsed,STATE.natal.birth,STATE.natal.sect,STATE.natal.name);
    Object.entries(STATE.rs).forEach(([y,t2])=>{try{addRS(parseChartText(t2),+y);}catch(e){}});
    saveState();
    st.textContent='mapa carregado: '+(parsed.problems.length?('avisos: '+parsed.problems.join('; ')):'12 cúspides e pontos OK')+' · seita '+NATAL.sect+'.';
    renderAll();
  };
  document.getElementById('in-clear').onclick=()=>{
    if(!confirm('Apagar mapa e revoluções salvos neste navegador?'))return;
    localStorage.removeItem('agx_natal');localStorage.removeItem('agx_rs');location.reload();
  };
  document.getElementById('bk-export').onclick=()=>{
    const blob=new Blob([JSON.stringify(STATE,null,1)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='astrograph-dados.json';a.click();
  };
  document.getElementById('bk-import').onchange=function(){
    const f=this.files[0];if(!f)return;
    f.text().then(t=>{const j=JSON.parse(t);STATE.natal=j.natal;STATE.rs=j.rs||{};saveState();location.reload();});
  };
}
function boot(){
  try{bindView();}catch(e){console.error(e);}
  try{bindImport();}catch(e){console.error(e);}
  try{bindDados();}catch(e){console.error(e);}
  try{renderFontes();}catch(e){console.error(e);}
  try{renderEletivaInit();}catch(e){console.error(e);}
  try{cordDrag();}catch(e){console.error(e);}
  window.addEventListener('resize',()=>{try{drawCord();}catch(e){}});
  if(loadFromState()){
    document.getElementById('in-natal').value=STATE.natal.text;
    document.getElementById('in-name').value=STATE.natal.name||'';
    document.getElementById('in-birth').value=STATE.natal.birth.slice(0,16);
    document.getElementById('in-sect').value=STATE.natal.sect||'auto';
    renderAll();
  } else { renderAll(); }
  renderRSList();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,220));
else setTimeout(boot,220);
window.addEventListener('load',()=>{renderAgora();syncTempo();renderTrans();});
