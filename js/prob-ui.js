/* ============================================================
   PROB-UI.JS — a aba Probabilidades.

   Só apresentação: todo o cálculo vem de probabilidades.js. As três
   grandezas aparecem sempre separadas — índice, qualidade e confiança —
   e o aviso de que não são probabilidades estatísticas fica permanente.

   Acessibilidade: as células do mapa de calor são botões navegáveis por
   teclado; a qualidade tem indicador próprio (símbolo), para não
   depender só de verde e vermelho; e há tabela textual equivalente.
   ============================================================ */

const PROB_UI={
  data:null,          // dia local selecionado
  periodo:7,          // 1, 7, 30 ou 90
  tema:null,          // filtro por casa
  retornos:[]         // retornos adicionais ligados
};
const PROB_QGLIFO={facilitada:'▲', pressionada:'▼', mista:'◆', 'sem dados':'·'};

function probDataAtual(){
  if(!PROB_UI.data)PROB_UI.data=hojeLocal();
  return PROB_UI.data;
}
/* ---------- cabeçalho temporal ---------- */
function probCabecalhoHTML(){
  const d=probDataAtual();
  const F=(typeof fusoEstado==='function')?fusoEstado():{definido:false};
  const T=(typeof termosEstado==='function')?termosEstado():null;
  const per=[[1,'dia'],[7,'7 dias'],[30,'30 dias'],[90,'90 dias']];
  return '<div class="pb-top">'
    +'<div class="pb-nav">'
      +'<button class="pb-b" data-probdia="-1" aria-label="dia anterior">‹</button>'
      +'<b>'+dataLocalLegivel(d)+'</b>'
      +'<button class="pb-b" data-probdia="1" aria-label="dia seguinte">›</button>'
      +'<button class="pb-b pb-hoje" data-probhoje="1">Hoje</button>'
    +'</div>'
    +'<div class="pb-seg" role="group" aria-label="período">'
      +per.map(([n,r])=>'<button class="pb-p'+(PROB_UI.periodo===n?' on':'')
        +'" data-probper="'+n+'">'+r+'</button>').join('')
    +'</div>'
    +'<div class="pb-cfg">'
      +'<label>Termos <select id="pb-termos">'
        +(T?T.disponiveis.map(s=>'<option value="'+s.id+'"'
            +(s.id===T.emUso?' selected':'')+'>'+s.nome+'</option>').join(''):'')
        +(T&&T.pendente?('<option value="" disabled>'+T.pendente.nome
            +' (pendente)</option>'):'')
      +'</select></label>'
      +'<span class="pb-tz">'+(F.definido?('fuso '+F.tz)
        :'<button class="pb-b" data-probtz="1">definir fuso</button>')+'</span>'
    +'</div>'
    +'</div>'
    +'<p class="pb-aviso">'+PROB_AVISO+'</p>'
    +(F.aviso?('<p class="pb-alerta">'+F.aviso+'</p>'):'')
    +(T&&T.aviso?('<p class="pb-alerta">'+T.aviso+'</p>'):'')
    +(T?('<p class="pb-nota">Sistema de termos em uso: <b>'+T.nome
        +'</b>. '+T.nota+'</p>'):'');
}

/* ---------- síntese do dia ---------- */
function probSinteseHTML(R){
  if(R.semMapa)return '<p class="pb-vazio">Importe um mapa natal para que a '
    +'convergência entre técnicas possa ser calculada.</p>';
  const c=(rot,val,sub,cls)=>'<article class="pb-c'+(cls?' '+cls:'')+'">'
    +'<em>'+rot+'</em><b>'+val+'</b>'+(sub?('<i>'+sub+'</i>'):'')+'</article>';
  const T1=R.temaDominante, T2=R.temaSegundo;
  const Q=R.qualidade, C=R.confianca;
  const adm=R.administradorReiterado;
  return '<div class="pb-cards">'
    +c('tema dominante', T1?T1.rotulo:'—', T1?('casa '+T1.casa+' · índice '+T1.indice):'sem ativação')
    +c('segundo tema', T2&&T2.bruto>0?T2.rotulo:'—', T2&&T2.bruto>0?('casa '+T2.casa+' · índice '+T2.indice):'')
    +c('índice de ativação', String(R.indice), 'do tema dominante · 0 a 100', 'pb-idx')
    +c('qualidade', (PROB_QGLIFO[Q.rotulo]||'')+' '+Q.rotulo,
       Q.facilita+'% facilita · '+Q.pressiona+'% pressiona', 'q-'+Q.rotulo)
    +c('confiança', C.rotulo, C.tecnicas+' técnica(s) independente(s)')
    +c('termo mais reiterado', adm?adm.nome:'—',
       adm?(adm.eventos.length+' ativação(ões) sob a sua administração'):'')
    +c('pico do dia', R.pico?R.pico.hora:'—',
       R.pico?(R.pico.exato?'aspecto exato':'menor orbe do dia'):'')
    +'</div>'
    +'<p class="pb-nota">'+Q.nota+'</p>'
    +'<p class="pb-nota">'+C.nota+' '+C.aviso+'</p>';
}

/* ---------- gráfico de manifestações possíveis ----------
   Barras horizontais das FORMAS concretas, ordenadas por plausibilidade
   relativa entre si — com a hipótese “nada perceptível” na mesma lista,
   nunca como nota de rodapé. Cada barra abre para a sua justificação. */
const MANIF_ICONE={casa:'◈', humor:'◍', pessoa:'☖', corpo:'◐', nada:'◌'};
function manifBarrasHTML(R){
  if(!R||R.semMapa)return '';
  let M; try{ M=manifRanking(R,{limite:PROB_UI.manifLimite||9}); }
  catch(e){ console.error('manifestações:',e);
    return '<p class="pb-vazio">Não foi possível compor as formas possíveis.</p>'; }
  if(!M.barras.length)return '';
  const max=M.barras[0].share||1;
  const linhas=M.barras.map((b,i)=>{
    const cls='mf-'+b.tipo
      +(b.tipo!=='nada'&&b.qualidadeForma==='p'?' mf-pres':'')
      +(b.tipo!=='nada'&&b.qualidadeForma==='f'?' mf-fac':'');
    const larg=Math.max(2,100*b.share/max);
    const sub=b.tipo==='nada'
      ? 'hipótese de base'
      : (b.casa?('casa '+b.casa+' · '+b.tema):b.tema)
        +(b.planetas.length?(' · '+b.planetas.map(p=>p.nome).join(', ')):'');
    /* todas fechadas: o gráfico só se lê como gráfico se as barras
       estiverem todas visíveis ao mesmo tempo. A justificação abre-se
       barra a barra, quando o utilizador a pedir. */
    return '<details class="mf-l '+cls+'">'
      +'<summary>'
        +'<span class="mf-t"><i>'+(MANIF_ICONE[b.tipo]||'·')+'</i>'+b.texto+'</span>'
        +'<span class="mf-bar"><b style="width:'+larg.toFixed(1)+'%"></b></span>'
        +'<span class="mf-p">'+b.share.toFixed(1)+'%</span>'
      +'</summary>'
      +'<p class="mf-sub">'+sub+'</p>'
      +'<ul class="mf-por">'+b.porque.map(x=>'<li>'+x+'</li>').join('')+'</ul>'
      +'</details>';
  }).join('');
  return '<div class="mf-wrap">'
    +'<p class="pb-nota mf-av">'+M.aviso+'</p>'
    +'<div class="mf-list" role="list">'+linhas+'</div>'
    +'<p class="pb-nota">'+M.nota+'</p>'
    +'<p class="pb-nota"><b>Como a hipótese de base é calculada:</b> '
      +M.formulaNada+'. Índice do dia '+M.indiceDia+' → esta hipótese pesa '
      +(M.nada.share||0).toFixed(1)+'% da lista.</p>'
    +'</div>';
}

/* ---------- gráfico temporal dos quatro temas mais ativados ---------- */
function probGraficoHTML(serie){
  if(serie.length<2)return '';
  const soma={};
  serie.forEach(R=>R.temas.forEach(t=>{soma[t.casa]=(soma[t.casa]||0)+t.bruto;}));
  const top=Object.entries(soma).sort((a,b)=>b[1]-a[1]).slice(0,4)
    .map(([c])=>+c).filter(c=>soma[c]>0);
  if(!top.length)return '<p class="pb-vazio">Nenhuma ativação no período.</p>';
  const W=720, H=190, ml=34, mb=24, mt=10;
  const n=serie.length;
  const x=i=>ml+(W-ml-8)*(n===1?0.5:i/(n-1));
  const y=v=>mt+(H-mt-mb)*(1-v/100);
  const cores=['var(--acc)','var(--accb)','var(--gold)','#5abec8'];
  let g='<svg class="pb-svg" viewBox="0 0 '+W+' '+H+'" role="img" '
    +'aria-label="índice de ativação dos quatro temas mais ativados ao longo do período">';
  [0,25,50,75,100].forEach(v=>{
    g+='<line x1="'+ml+'" y1="'+y(v)+'" x2="'+(W-8)+'" y2="'+y(v)
      +'" stroke="rgba(255,255,255,.07)"/>'
      +'<text x="'+(ml-6)+'" y="'+(y(v)+3)+'" text-anchor="end" '
      +'font-size="9" fill="var(--dim2)">'+v+'</text>';
  });
  top.forEach((casa,ci)=>{
    const pts=serie.map((R,i)=>{
      const t=R.temas.find(x=>x.casa===casa);
      return x(i)+','+y(t?t.indice:0);
    }).join(' ');
    g+='<polyline points="'+pts+'" fill="none" stroke="'+cores[ci]
      +'" stroke-width="2" stroke-linejoin="round"/>';
  });
  /* marcas de dia, sem poluir quando o período é longo */
  const passo=Math.max(1,Math.round(n/7));
  serie.forEach((R,i)=>{ if(i%passo)return;
    g+='<text x="'+x(i)+'" y="'+(H-6)+'" text-anchor="middle" font-size="9" '
      +'fill="var(--dim2)">'+R.data.slice(8)+'/'+R.data.slice(5,7)+'</text>';});
  g+='</svg>';
  const leg='<ul class="pb-leg">'+top.map((casa,ci)=>{
    const T=probTema(casa);
    return '<li><i style="background:'+cores[ci]+'"></i>'+T.rotulo
      +' <span>casa '+casa+'</span></li>';}).join('')+'</ul>';
  return '<div class="pb-graf">'+g+leg+'</div>';
}

/* ---------- mapa de calor: 12 temas × dias ---------- */
function probHeatmapHTML(serie){
  if(serie.length<2)return '';
  const cab='<tr><th scope="col">Tema</th>'
    +serie.map(R=>'<th scope="col" title="'+R.data+'">'+R.data.slice(8)+'</th>').join('')
    +'</tr>';
  const linhas=PROB_TEMAS.map(T=>{
    const cels=serie.map(R=>{
      const t=R.temas.find(x=>x.casa===T.casa)||{indice:0,qualidade:{rotulo:'sem dados'}};
      const q=t.qualidade.rotulo;
      const alfa=(t.indice/100*0.85+0.05).toFixed(3);
      const rot=T.rotulo+', '+dataLocalLegivel(R.data)+': índice '+t.indice
        +', qualidade '+q;
      return '<td><button class="pb-cel" data-probsel="'+R.data+'" '
        +'data-probtema="'+T.casa+'" title="'+rot+'" aria-label="'+rot+'" '
        +'style="--a:'+alfa+'">'
        +'<span class="pb-q">'+(PROB_QGLIFO[q]||'')+'</span>'
        +'<span class="pb-v">'+(t.indice||'')+'</span></button></td>';
    }).join('');
    return '<tr><th scope="row"><button class="pb-th" data-probtema="'+T.casa+'">'
      +T.rotulo+'</button></th>'+cels+'</tr>';
  }).join('');
  return '<div class="pb-heat"><table class="pb-tab"><caption>Índice de ativação por '
    +'tema e por dia. A intensidade da célula representa o índice; o símbolo '
    +'representa a qualidade (▲ facilitada, ▼ pressionada, ◆ mista) — a qualidade '
    +'não depende apenas da cor.</caption><thead>'+cab+'</thead><tbody>'
    +linhas+'</tbody></table></div>'
    +'<ul class="pb-leg pb-leg2">'
      +'<li><span class="pb-q">▲</span> facilitada</li>'
      +'<li><span class="pb-q">◆</span> mista</li>'
      +'<li><span class="pb-q">▼</span> pressionada</li>'
      +'<li><i class="pb-esc"></i> intensidade = índice de ativação</li></ul>';
}

/* ---------- explicação auditável ---------- */
function probExplicacaoHTML(R){
  if(R.semMapa)return '';
  const temas=R.temas.filter(t=>t.bruto>0)
    .filter(t=>!PROB_UI.tema||t.casa===PROB_UI.tema);
  if(!temas.length)return '<p class="pb-vazio">Nenhum tema ativado neste dia'
    +(PROB_UI.tema?' para o filtro escolhido':'')+'.</p>';
  return temas.map(T=>{
    const ev=R.pacotes.filter(P=>P.casas.some(c=>c.casa===T.casa));
    const linhas=ev.map(P=>{
      const e=P.evento, A=P.adm;
      const jan=e.janela||{};
      const dt=t=>t==null?'—':(fdate(new Date(t))+' '+horaLocal(t,R.tz));
      const orig=P.casas.filter(c=>c.casa===T.casa)
        .map(c=>c.origem).filter((v,i,a)=>a.indexOf(v)===i).join(' · ');
      return '<div class="pb-ev">'
        +'<div class="pb-evh"><b>'+PT_NAME[e.transitant]+' '+e.aspectGl+' '
          +e.targetNome+'</b>'
          +'<span class="pb-tag">'+(e.applying?'aplicando':'separando')+'</span>'
          +'<span class="pb-tag">orbe '+e.orb.toFixed(2)+'° de '+e.orbMax+'°</span>'
          +(e.perfaz?'<span class="pb-tag pb-ex">exato às '
              +horaLocal(e.exactAt,R.tz)+'</span>':'')
          +'<span class="pb-tag">'+orig+'</span></div>'
        +'<dl class="pb-dl">'
          +'<div><dt>janela</dt><dd>entra '+dt(jan.entrada)+' · exato '
            +((jan.exatos&&jan.exatos.length)?jan.exatos.map(dt).join(' · ')
              :'não perfaz')+' · sai '+dt(jan.saida)
            +(jan.nota?('<br><span class="pb-obs">'+jan.nota+'</span>'):'')+'</dd></div>'
          +(A?('<div><dt>administração</dt><dd>'+A.frase+' ('+A.sistemaNome+', '
            +A.inicio+'–'+A.fim+'°)'
            +(A.condicaoNatal?(' · condição natal de '+A.nome+': '+A.condicaoNatal):'')
            +(A.casasAdministradas.length?(' · administra '
              +A.casasAdministradas.map(h=>h+'ª').join(', ')):'')
            +(A.angularNaRS?' · angular na Revolução Solar':'')
            +(A.coincidencias.length?('<br><b>confirmação menor:</b> '
              +A.coincidencias.map(c=>c.texto).join('; ')):'')
            +(A.ingresso?('<br>ingresso em novo termo: de '+PT_NAME[A.ingresso.de]
              +' para '+PT_NAME[A.ingresso.para]+' — '+A.ingresso.nota):'')
            +'</dd></div>'):'')
          +'<div><dt>testemunhos</dt><dd><ul class="pb-tst">'
            +P.evidencias.map(t=>'<li><b>'+t.weight.toFixed(1)+'</b> '+t.explanation
              +' <span class="pb-src">'+t.source+'</span></li>').join('')
            +'</ul></dd></div>'
        +'</dl></div>';
    }).join('');
    /* leitura breve por padrão: só o tema dominante — ou o filtrado —
       vem aberto; os demais expandem sob clique */
    const aberto=(PROB_UI.tema===T.casa)||(!PROB_UI.tema&&T===temas[0]);
    return '<details class="pb-tema"'+(aberto?' open':'')+'>'
      +'<summary><b>'+T.rotulo+'</b> <span>casa '+T.casa+'</span>'
      +'<i class="pb-badge">índice '+T.indice+'</i>'
      +'<i class="pb-badge q-'+T.qualidade.rotulo+'">'
        +(PROB_QGLIFO[T.qualidade.rotulo]||'')+' '+T.qualidade.rotulo+'</i>'
      +'<i class="pb-badge">confiança '+T.confianca.rotulo+'</i>'
      +'<i class="pb-badge">'+ev.length+' contato(s)</i></summary>'
      +'<p class="pb-nota">Por que apareceu: '+T.fontes.length+' fonte(s) — '
        +T.confianca.familias.join(', ')+'. Bruto '+T.bruto.toFixed(2)
        +' (soma ingênua seria '+T.brutoIngenuo.toFixed(1)+'), convertido pelo '
        +R.formulaIndice+'.</p>'
      +linhas+'</details>';
  }).join('');
}

/* ---------- linha dos termos ---------- */
function probTermosHTML(){
  let L=[];
  try{ L=probLinhaDosTermos(probDataAtual()); }catch(e){ L=[]; }
  if(!L.length)return '';
  return '<section class="pb-s"><h4>Linha dos termos '
    +'<i>quem administra o grau que cada transitante ocupa</i></h4>'
    +'<div class="pb-termos">'+L.map(x=>
      '<div class="pb-tm"><span class="pb-tg">'+(x.glifo||'')+'︎</span>'
      +'<b>'+x.nome+'</b>'
      +'<em>'+x.signo+' '+x.grau.toFixed(1)+'° · termo de '+x.senhorNome+'</em>'
      +'<i>segmento '+x.inicio+'–'+x.fim+'°'
        +(x.proximaTroca?(' · troca em '+fdate(new Date(x.proximaTroca))):'')+'</i>'
      +(x.coincidencias.length?('<span class="pb-conf">também '
        +x.coincidencias.join(' e ')+' — confirmação menor</span>'):'')
      +'</div>').join('')+'</div></section>';
}

/* ---------- montagem ---------- */
function renderProb(){
  const el=document.getElementById('prob-body'); if(!el)return;
  if(typeof NATAL==='undefined'||!NATAL){
    el.innerHTML=probCabecalhoHTML()
      +'<p class="pb-vazio">Importe um mapa natal para calcular a convergência.</p>';
    probLigarEventos(); return;
  }
  const d=probDataAtual();
  const R=dailyActivation(d,{retornos:PROB_UI.retornos});
  const serie=PROB_UI.periodo>1
    ? probSerie(d, PROB_UI.periodo, {retornos:PROB_UI.retornos}) : [R];
  el.innerHTML=probCabecalhoHTML()
    +'<section class="pb-s"><h4>Síntese do dia</h4>'+probSinteseHTML(R)+'</section>'
    +'<section class="pb-s"><h4>Formas possíveis <i>plausibilidade relativa, '
      +'não probabilidade</i></h4>'+manifBarrasHTML(R)+'</section>'
    +(serie.length>1
      ? '<section class="pb-s"><h4>Temas suscitados <i>quatro mais ativados</i></h4>'
        +probGraficoHTML(serie)
        +'<h4 class="pb-h2">Mapa de calor <i>doze temas × dias — clique num dia</i></h4>'
        +probHeatmapHTML(serie)+'</section>'
      : '')
    +probTermosHTML()
    +'<section class="pb-s"><h4>Explicação auditável'
      +(PROB_UI.tema?(' <button class="pb-b" data-probtema="">limpar filtro</button>'):'')
      +'</h4>'+probExplicacaoHTML(R)+'</section>';
  probLigarEventos();
}
function probLigarEventos(){
  const w=document.getElementById('p-prob'); if(!w||w._pbLigado)return;
  w._pbLigado=true;
  w.addEventListener('click',e=>{
    const dia=e.target.closest&&e.target.closest('[data-probdia]');
    if(dia){PROB_UI.data=somaDias(probDataAtual(),+dia.dataset.probdia);renderProb();return;}
    if(e.target.closest&&e.target.closest('[data-probhoje]')){
      PROB_UI.data=hojeLocal();renderProb();return;}
    const per=e.target.closest&&e.target.closest('[data-probper]');
    if(per){PROB_UI.periodo=+per.dataset.probper;renderProb();return;}
    const sel=e.target.closest&&e.target.closest('[data-probsel]');
    if(sel){PROB_UI.data=sel.dataset.probsel;
      if(sel.dataset.probtema)PROB_UI.tema=+sel.dataset.probtema;
      renderProb();return;}
    const tm=e.target.closest&&e.target.closest('[data-probtema]');
    if(tm){const v=tm.dataset.probtema;
      PROB_UI.tema=v?+v:null; renderProb(); return;}
    if(e.target.closest&&e.target.closest('[data-probtz]')){probPedirFuso();return;}
  });
  w.addEventListener('change',e=>{
    if(e.target&&e.target.id==='pb-termos'){
      if(typeof termosDefinirSistema==='function')termosDefinirSistema(e.target.value);
      if(typeof probInvalidar==='function')probInvalidar();
      renderProb();
    }
  });
}
/* pedido explícito de fuso — nunca assumido em silêncio */
function probPedirFuso(){
  const sug=(typeof fusoDoDispositivo==='function')?fusoDoDispositivo():'UTC';
  const tz=prompt('Fuso horário do mapa (formato IANA, por exemplo '
    +'America/Sao_Paulo). Sugestão deste dispositivo: '+sug, sug||'UTC');
  if(!tz)return;
  if(!fusoDefinir(tz)){alert('Fuso não reconhecido: '+tz);return;}
  if(typeof probInvalidar==='function')probInvalidar();
  renderProb();
}
