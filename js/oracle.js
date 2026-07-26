/* ============================================================
   ORACLE.JS — CONSULTA AOS CORPORA (recuperação local, sem backend)
   Não é um modelo generativo: é um motor de RECUPERAÇÃO que interpreta a
   pergunta, extrai as unidades técnicas (planeta, casa, signo, técnica),
   pontua os trechos dos corpora por BM25 simplificado e devolve as
   passagens com fonte e autor, mais as regras internas aplicáveis.
   Quando não há suporte no corpus, diz que não há — nunca simula citação.
   ============================================================ */
const ORACLE={
  ready:false, N:0, avg:0, df:null, docs:null,
  STOP:new Set(['de','da','do','das','dos','a','o','as','os','e','ou','em','no','na','nos','nas',
    'um','uma','uns','umas','que','com','por','para','se','ao','à','às','aos','the','of','and',
    'is','in','to','qual','quais','como','quando','onde','porque','por que','meu','minha','meus',
    'minhas','sobre','pelo','pela','ser','está','estão','são','tem','ter','isso','esse','essa']),
  norm(t){return (t||'').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9º\s]/g,' ').split(/\s+/).filter(w=>w.length>2&&!this.STOP.has(w));},

  async build(){
    if(this.ready)return true;
    await RAG.load();
    const chunks=(RAG.chunks||[]);
    if(!chunks.length){this.ready=false;return false;}
    this.docs=chunks.map(c=>{
      const txt=RAG.textOf(c);
      const meta=[c.planeta,c.casa,c.secao,c.section,c.titulo,c.title].filter(Boolean).join(' ');
      const toks=this.norm(txt+' '+meta);
      const tf={}; toks.forEach(w=>tf[w]=(tf[w]||0)+1);
      return {c,txt,meta,tf,len:toks.length};
    });
    this.N=this.docs.length;
    this.avg=this.docs.reduce((a,d)=>a+d.len,0)/Math.max(1,this.N);
    this.df={};
    this.docs.forEach(d=>Object.keys(d.tf).forEach(w=>this.df[w]=(this.df[w]||0)+1));
    this.ready=true;
    return true;
  },
  /* BM25 simplificado */
  score(qtoks,d){
    const k1=1.4,b=.72; let s=0;
    qtoks.forEach(([w,boost])=>{
      const f=d.tf[w]; if(!f)return;
      const idf=Math.log(1+(this.N-(this.df[w]||0)+.5)/((this.df[w]||0)+.5));
      s+=boost*idf*(f*(k1+1))/(f+k1*(1-b+b*d.len/this.avg));
    });
    return s;
  },
  /* planeta e casa explicitamente nomeados na pergunta */
  meta(q){
    const low=' '+q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')+' ';
    let planeta=null, casa=null;
    Object.entries(PT_NAME).forEach(([k,nm])=>{
      const n=nm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      if(low.includes(n))planeta=nm;});
    const m=low.match(/casa\s*(\d{1,2})/);
    if(m&&+m[1]>=1&&+m[1]<=12)casa=+m[1];
    return {planeta,casa};
  },
  /* unidades técnicas detectadas na pergunta + contexto do mapa */
  units(q){
    const u=[], low=q.toLowerCase();
    const push=(t,boost,motivo)=>{ if(t)u.push([t,boost,motivo]); };
    this.norm(q).forEach(w=>push(w,1,null));
    // planetas
    Object.entries(PT_NAME).forEach(([k,nm])=>{
      if(low.includes(nm.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''))
        ||low.includes(nm.toLowerCase())) push(this.norm(nm)[0],2.5,'planeta '+nm);});
    // signos
    SIGNS.forEach(sg=>{ if(low.includes(sg.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')))
      push(this.norm(sg)[0],2,'signo '+sg);});
    // casas (número e romano)
    const ROM=['','i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii'];
    const mh=low.match(/casa\s*(\d{1,2})/);
    if(mh&&+mh[1]>=1&&+mh[1]<=12){push('casa',1.5,'casa '+mh[1]);push(ROM[+mh[1]],3,'casa '+mh[1]);}
    // técnicas
    [['firdaria','firdária'],['profeccao','profecção'],['revolucao','revolução'],['transito','trânsito'],
     ['direcao','direção'],['temperamento','temperamento'],['dignidade','dignidade'],['recepcao','recepção'],
     ['eleicao','eleição'],['eletiva','eleição'],['hora','hora planetária'],['lua','Lua']].forEach(([t,nm])=>{
      if(low.includes(t)||low.includes(nm.toLowerCase()))push(t,2.2,nm);});
    return u;
  },
  /* consulta: devolve passagens + regras internas + contexto do mapa */
  async ask(q){
    const okCorpus=await this.build();
    const u=this.units(q);
    const qtoks=u.map(([t,b])=>[t,b]).filter(x=>x[0]);
    const motivos=[...new Set(u.filter(x=>x[2]).map(x=>x[2]))];
    const M=this.meta(q);
    const ROM=['','Casa I','Casa II','Casa III','Casa IV','Casa V','Casa VI','Casa VII','Casa VIII','Casa IX','Casa X','Casa XI','Casa XII'];
    let passagens=[];
    if(okCorpus&&qtoks.length){
      passagens=this.docs.map(d=>{
        let sc=this.score(qtoks,d);
        // casamento de metadados: planeta e casa nomeados valem muito mais que o texto solto
        const c=d.c;
        if(M.planeta&&c.planeta){ sc*= (c.planeta===M.planeta)?3.2:0.25; }
        if(M.casa&&c.casa){ sc*= (c.casa===ROM[M.casa])?3.2:0.25; }
        return {d,s:sc};})
        .filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,4)
        .map(x=>{
          const m=RAG.metaOf(x.d.c), t=x.d.txt.replace(/\s+/g,' ').trim();
          return {fonte:m.src?m.src.name:'corpus', autor:m.src?m.src.author:'—',
            secao:[m.planeta,m.casa,m.secao].filter(Boolean).join(' · ')||'—',
            trecho:t.slice(0,520)+(t.length>520?'…':''), score:Math.round(x.s*10)/10};});
    }
    // regras internas aplicáveis (base Döser + egípcio)
    const tags=[];
    const low=q.toLowerCase();
    if(/firdar/.test(low))tags.push('firdaria');
    if(/profec/.test(low))tags.push('profeccao');
    if(/revolu|retorno/.test(low))tags.push('revolucao');
    if(/transit|trânsit/.test(low))tags.push('transito');
    if(/promess/.test(low))tags.push('promessa');
    if(/dignidad|condi/.test(low))tags.push('dignidade','qualidade');
    if(/aspect/.test(low))tags.push('aspecto');
    if(/lua|venus|vênus/.test(low))tags.push('lua','venus');
    if(/senhor do ano/.test(low))tags.push('senhor-do-ano');
    const regras=(typeof regrasPara==='function')?regrasPara(tags.length?tags:['convergencia'],3):[];
    return {passagens,regras,motivos,okCorpus,status:RAG.status};
  }
};
/* ---------- interface da consulta (aba Eletiva) ---------- */
function oracleAnswerHTML(q,r){
  const cab='<div class="orc-q">'+esc(q)+'</div>';
  let s='<div class="orc-a">'+cab;
  if(r.motivos.length)
    s+='<div class="orc-u">Unidades técnicas reconhecidas: '+r.motivos.join(' · ')+'</div>';
  // contexto do próprio mapa, quando houver
  if(typeof NATAL!=='undefined'&&NATAL){
    const S=(typeof tempoState==='function')?tempoState(new Date()):null;
    if(S)s+='<div class="orc-ctx"><b>No seu mapa, agora:</b> firdária de '+(PT_NAME[S.mk]||'—')
      +(S.sk?(' / '+PT_NAME[S.sk]):'')+' · profecção na casa '+S.profHouse+' · Senhor do Ano '+PT_NAME[S.lord]
      +(S.rev?(' · Revolução '+S.rev.label+' com Ascendente em '+S.rev.ascSignNm):'')+'.</div>';
  }
  if(r.regras.length){
    s+='<div class="orc-sec"><span class="orc-k">Regra aplicável</span><ul class="ilist">'
      +r.regras.map(x=>'<li>'+x.p+' <i>— '+x.fonte+'</i></li>').join('')+'</ul></div>';
  }
  if(r.passagens.length){
    s+='<div class="orc-sec"><span class="orc-k">Passagens dos livros</span>'
      +r.passagens.map(p=>'<div class="orc-p"><div class="orc-ph">'+p.fonte
        +' <span>· '+p.autor+'</span><em>'+p.secao+'</em></div><p>'+esc(p.trecho)+'</p></div>').join('')
      +'</div>';
  } else {
    s+='<div class="orc-sec"><span class="orc-k">Passagens dos livros</span>'
      +'<p class="note">'+(r.okCorpus
        ? 'Nenhum trecho dos corpora corresponde a esta pergunta. A resposta acima usa apenas as regras internas — nenhuma citação foi inventada.'
        : 'Corpora indisponíveis neste ambiente ('+esc(r.status||'')+'). Sirva o app por HTTP para carregar os livros.')+'</p></div>';
  }
  s+='<p class="note orc-n">Consulta por recuperação local nos corpora do projeto — não é um modelo generativo e não inventa fontes.</p>';
  return s+'</div>';
}
function bindOracle(){
  const btn=document.getElementById('orc-run'), inp=document.getElementById('orc-q'), out=document.getElementById('orc-out');
  if(!btn||!inp||!out)return;
  const run=()=>{
    const q=inp.value.trim();
    if(!q){out.innerHTML='<p class="note">Escreva uma pergunta — por exemplo: “o que Saturno na casa 6 indica?” ou “como se julga o Senhor do Ano?”.</p>';return;}
    out.innerHTML='<p class="note">consultando os corpora…</p>';
    ORACLE.ask(q).then(r=>{out.innerHTML=oracleAnswerHTML(q,r);})
      .catch(e=>{out.innerHTML='<p class="note">falha na consulta: '+esc(e.message)+'</p>';});
  };
  btn.onclick=run;
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey))run();});
  document.querySelectorAll('[data-orcq]').forEach(b=>b.onclick=()=>{inp.value=b.dataset.orcq;run();});
}
