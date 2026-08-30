/* ============================================================
   BACKUP.JS — cópia completa do que o app guarda no navegador.

   Tudo o que é seu vive em localStorage: o mapa natal importado, o
   mapa da sinastria, os eventos marcados, as avaliações retrospectivas,
   as notas e os passos de cada revolução, os pesos das tipologias, os
   lugares de retorno e as preferências de interface. O backup leva
   todas essas chaves — não uma seleção delas —, para que restaurar
   devolva o app ao mesmo estado.
   ============================================================ */

const BK_VERSAO=1;
/* prefixos usados pelo app; qualquer chave nova entra sozinha */
const BK_PREFIXOS=['ag_','agx_'];

function bkChaves(){
  const out=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(BK_PREFIXOS.some(p=>k.indexOf(p)===0))out.push(k);
  }
  return out.sort();
}
function bkColeta(){
  const dados={};
  bkChaves().forEach(k=>{try{dados[k]=localStorage.getItem(k);}catch(e){}});
  return {
    app:'AstroGraph', versao:BK_VERSAO,
    gerado:new Date().toISOString(),
    chaves:Object.keys(dados).length,
    dados
  };
}
/* o que há dentro, em português, para o usuário conferir antes de restaurar */
const BK_ROTULOS=[
  [/^ag_chart$|^agx_natal/,'mapa natal'],
  [/^agx_sinB$/,'mapa da sinastria'],
  [/^ag_events$/,'eventos marcados'],
  [/^ag_eval$/,'avaliações retrospectivas'],
  [/^agx_rv_.*_notas$/,'anotações de revolução'],
  [/^agx_rv_.*_passos$/,'passos de revolução'],
  [/^agx_revloc_/,'lugares de retorno'],
  [/^agx_pvval$/,'avaliações preditivas'],
  [/^ag_cfg|^agx_cfg|^ag_navmin$/,'preferências e pesos'],
];
function bkResumo(dados){
  const cont={};
  Object.keys(dados||{}).forEach(k=>{
    const r=BK_ROTULOS.find(x=>x[0].test(k));
    const nome=r?r[1]:'outros';
    cont[nome]=(cont[nome]||0)+1;
  });
  return Object.entries(cont).map(([n,c])=>n+(c>1?(' ('+c+')'):'')).join(' · ');
}
function bkBaixar(){
  const pacote=bkColeta();
  const nome='astrograph-backup-'+new Date().toISOString().slice(0,10)+'.json';
  const blob=new Blob([JSON.stringify(pacote,null,1)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=nome;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},400);
  return pacote;
}
/* restauração: substitui as chaves do pacote e preserva o resto */
function bkRestaurar(txt,apagarAntes){
  const p=JSON.parse(txt);
  if(!p||!p.dados||typeof p.dados!=='object')throw new Error('arquivo sem o bloco de dados');
  if(p.app&&p.app!=='AstroGraph')throw new Error('o arquivo não é um backup do AstroGraph');
  if(apagarAntes)bkChaves().forEach(k=>{try{localStorage.removeItem(k);}catch(e){}});
  let n=0;
  Object.entries(p.dados).forEach(([k,v])=>{
    if(!BK_PREFIXOS.some(x=>k.indexOf(x)===0))return;   // não escreve fora do app
    try{localStorage.setItem(k,v);n++;}catch(e){}
  });
  return {n, resumo:bkResumo(p.dados), gerado:p.gerado||null};
}

/* ---------- interface, dentro da aba Dados ---------- */
function renderBackup(){
  const el=$('bk-body'); if(!el)return;
  const at=bkColeta();
  el.innerHTML=
     '<div class="bk"><div class="bk-h"><b>Backup completo</b>'
      +'<em>'+at.chaves+' chave'+(at.chaves===1?'':'s')+' guardada'+(at.chaves===1?'':'s')+' neste navegador</em></div>'
    +'<p class="bk-r">'+(at.chaves?bkResumo(at.dados):'nada guardado ainda')+'</p>'
    +'<div class="bk-a">'
      +'<button class="btn" id="bk-exp">Baixar backup</button>'
      +'<label class="btn bk-imp">Restaurar de arquivo'
        +'<input type="file" id="bk-file" accept="application/json,.json" hidden></label>'
      +'<label class="bk-chk"><input type="checkbox" id="bk-limpa"> substituir tudo</label>'
    +'</div>'
    +'<p class="bk-s" id="bk-status"></p>'
    +'<p class="bk-n">O arquivo é um JSON legível, guardado por você. Nada é enviado para '
      +'servidor nenhum: todo o app roda neste navegador.</p></div>';
  const st=$('bk-status');
  const exp=$('bk-exp');
  if(exp)exp.onclick=()=>{const p=bkBaixar();
    if(st)st.textContent='Backup gerado com '+p.chaves+' chaves.';};
  const f=$('bk-file');
  if(f)f.onchange=()=>{
    const file=f.files&&f.files[0]; if(!file)return;
    const rd=new FileReader();
    rd.onload=()=>{
      try{
        const r=bkRestaurar(rd.result,!!($('bk-limpa')||{}).checked);
        if(st)st.textContent='Restauradas '+r.n+' chaves ('+r.resumo+'). Recarregue a página para aplicar.';
        if(st)st.className='bk-s ok';
      }catch(err){
        if(st){st.textContent='Não foi possível restaurar: '+err.message;st.className='bk-s erro';}
      }
      f.value='';
    };
    rd.readAsText(file);
  };
}
