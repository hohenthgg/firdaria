/* ============================================================
   TIP-UI.JS — a apresentação da camada tipológica, em seis seções:

     Visão geral · Funções e elementos · Hipóteses ·
     Comparação entre sistemas · Refinar com respostas ·
     Fontes e método

   Princípios da apresentação:
     · leitura breve por padrão, expandida sob clique;
     · nenhuma porcentagem de certeza; barras apenas onde há
       grandeza comparável (apoio × contradição na mesma escala);
     · nada de radar decorativo;
     · cada função ou elemento clicado responde às cinco perguntas:
       o que significa neste sistema, o que favorece a hipótese,
       o que a contradiz, como se distingue da alternativa, e
       qual é a fonte.
   ============================================================ */

let TIP_INF=null;          // cache da sessão: {mbti, soc, pontes, quando}
let TIP_SEL=null;          // função/elemento selecionado
let TIP_SEL_SIS=null;

function tipInferir(recalcular){
  if(TIP_INF&&!recalcular)return TIP_INF;
  if(typeof NATAL==='undefined'||!NATAL)return null;
  const F=ponteFatos();
  const mbti=inferirMBTI(F), soc=inferirSocionica(F);
  TIP_INF={fatos:F, mbti, soc, pontes:pontesComparar(mbti,soc), quando:Date.now()};
  return TIP_INF;
}
/* o mapa mudou → a hipótese precisa ser refeita; a data NÃO muda nada */
function tipInvalidar(){ TIP_INF=null; TIP_SEL=null; }

const tipAviso=(curto)=>'<p class="tip-aviso">'
  +(curto||PONTE_META.limitacao_curta)
  +' <button class="tip-mais" data-tipsec="fontes">método e limites</button></p>';

/* ============ 1 · VISÃO GERAL ============ */
function tipVisaoGeral(){
  const I=tipInferir(); if(!I)return tipVazio();
  const card=(titulo,sub,inf,rotuloTipo,nomeDe)=>{
    if(inf.insuficiente){
      return '<article class="tip-c tip-insuf"><header><em>'+titulo+'</em><i>'+sub+'</i></header>'
        +'<div class="tip-nada"><b>Evidência insuficiente</b>'
        +'<p>'+inf.porqueInsuficiente+'. O app não escolhe um candidato quando os '
        +'testemunhos não o separam dos demais — e não preenche a lacuna com um '
        +'valor médio.</p></div>'
        +(inf.ranking.length?('<p class="tip-ord">Ordenação parcial, sem conclusão: '
          +inf.ranking.map(r=>r.tipo).join(' · ')+'</p>'):'')
        +'</article>';
    }
    const p=inf.principal, a=inf.alternativa, t=inf.terceira||inf.ranking[2]||null;
    /* os dois motores guardam o detalhe em campos próprios: o MBTI por
       posição da pilha, a Sociônica por posição do Modelo A */
    const just=(rotuloTipo==='mbti'
      ? (p.porProcesso||[]).filter(x=>x.apoio>0).slice(0,2)
          .map(x=>x.processo+' em posição '+MBTI_POSICOES[x.posicao].rotulo)
      : (p.sustentadas||[]).filter(x=>x.apoio>0).slice(0,2)
          .map(x=>x.elemento+' em posição '+x.nome)
      ).join(' e ');
    return '<article class="tip-c"><header><em>'+titulo+'</em><i>'+sub+'</i></header>'
      +'<div class="tip-princ"><b>'+p.tipo+'</b>'
        +(nomeDe?('<span>'+nomeDe(p)+'</span>'):'')+'</div>'
      +'<p class="tip-just">'+(just?('Sustentado sobretudo por '+just+'.')
        :'Nenhum processo isolado sustenta a escolha; a ordenação vem do conjunto.')+'</p>'
      +'<ul class="tip-alt">'
        +(a?('<li><span>alternativa</span><b>'+a.tipo+'</b><em>margem de '
            +inf.margem.toFixed(2)+'</em></li>'):'')
        +(t?('<li><span>terceira</span><b>'+t.tipo+'</b></li>'):'')
      +'</ul>'
      +(inf.sensibilidade.estavel?'':'<p class="tip-inst">'+inf.sensibilidade.nota+'</p>')
      +'<button class="tip-mais" data-tipsec="hipoteses">ver o que sustenta e o que contraria</button>'
      +'</article>';
  };
  return '<section class="tps">'
    +tipAviso('Hipótese exploratória a partir do mapa. Não é medida, não é '
      +'diagnóstico, e não existe conversão validada de mapa natal em tipo.')
    +'<div class="tip-cards">'
      +card('MBTI','convenção de dinâmica de tipo declarada', I.mbti, 'mbti',
        p=>MBTI_FRASE_CURTA[p.tipo]||'')
      +card('Sociônica','Modelo A · inferência independente', I.soc, 'soc',
        p=>(SOC_FRASE[p.tipo]||p.nome)+' — quadra '+p.quadra+', tipo '
           +p.racionalidade.rotulo)
    +'</div>'
    +'<p class="tip-nota">Os dois candidatos acima foram produzidos por motores '
      +'separados, com regras próprias. Não há no app nenhuma conversão de letras '
      +'MBTI em sociotipo, e nenhum dos dois foi ajustado para concordar com o outro.</p>'
    +'</section>';
}
function tipVazio(){
  return '<section class="tps"><p class="tip-nada">Importe um mapa natal para que '
    +'a camada tipológica tenha fatos com que trabalhar. Sem mapa não há hipótese — '
    +'e nenhuma é inventada no lugar.</p></section>';
}

/* ============ 2 · FUNÇÕES E ELEMENTOS ============ */
function tipFuncoes(){
  const I=tipInferir(); if(!I)return tipVazio();
  let h='<section class="tps"><h3>MBTI · dinâmica funcional</h3>';
  if(I.mbti.principal){
    const E=I.mbti.principal.estrutura;
    h+='<p class="tip-sub">Estrutura que o modelo atribui a <b>'+E.tipo+'</b>, '
      +'na convenção <i>'+MBTI_CONVENCAO.nome+'</i>. Clique numa função.</p>'
      +'<div class="tip-pilha">'
      +['dom','aux','tert','inf'].map(pos=>{
        const proc=E[pos], a=I.mbti.apoios[proc];
        const sust=a&&a.apoio>0;
        return '<button class="tip-fn'+(sust?' tem':'')+'" data-tipfn="'+proc+'" data-tipsis="mbti">'
          +'<em>'+MBTI_POSICOES[pos].rotulo+'</em><b>'+proc+'</b>'
          +'<i>'+(sust?'há testemunho':'sem testemunho')+'</i></button>';}).join('')
      +'</div>'
      +'<p class="tip-nota">O que está acima é <b>o que o modelo afirma</b> para '
      +'este tipo. As posições marcadas como “há testemunho” são as únicas que os '
      +'dados do mapa efetivamente tocam; as demais vêm da estrutura, e não de '
      +'observação alguma.</p>';
  } else h+='<p class="tip-nada">Sem candidato MBTI: evidência insuficiente.</p>';
  h+='</section><section class="tps"><h3>Sociônica · Modelo A em quatro blocos</h3>';
  if(I.soc.principal){
    const S=I.soc.principal;
    h+='<p class="tip-sub">Modelo A de <b>'+S.tipo+'</b> ('+S.nome+'), quadra '
      +S.quadra+', tipo '+S.racionalidade.rotulo+' — '+S.racionalidade.porque+'</p>';
    ['Ego','Superego','Super-Id','Id'].forEach(bl=>{
      const pos=S.posicoes.filter(p=>p.bloco===bl);
      h+='<div class="tip-bloco"><span class="tip-bl">'+bl
        +'<i>'+SOC_BLOCOS[bl].o_que_e+'</i></span><div class="tip-bg">'
        +pos.map(p=>'<button class="tip-el'+(p.sustentadoPelosDados?' tem':'')
          +'" data-tipfn="'+p.elemento+'" data-tipsis="socionica">'
          +'<em>'+p.posicao+' · '+p.nome+'</em><b>'+p.elemento+'</b>'
          +'<span class="tip-tags">'
            +'<i class="tg-f'+(p.forca==='forte'?' on':'')+'">'+p.forca+'</i>'
            +'<i class="tg-v'+(p.valorada?' on':'')+'">'
              +(p.valorada?'valorada':'não valorada')+'</i></span>'
          +'<i class="tip-sust">'+(p.sustentadoPelosDados?'há testemunho':'só o modelo')+'</i>'
          +'</button>').join('')+'</div></div>';
    });
    h+='<p class="tip-nota"><b>Posição, força e valoração são três coisas diferentes.</b> '
      +'As posições 7 e 8 são fortes e NÃO valoradas; as 5 e 6 são fracas e valoradas. '
      +'Os rótulos acima dizem qual é qual, e não se substituem uns aos outros.</p>';
  } else h+='<p class="tip-nada">Sem candidato sociônico: evidência insuficiente.</p>';
  h+='</section>';
  if(TIP_SEL)h+=tipDetalheFuncao(TIP_SEL,TIP_SEL_SIS);
  return h;
}

/* as cinco perguntas, ao clicar numa função ou elemento */
function tipDetalheFuncao(proc,sistema){
  const I=tipInferir(); if(!I)return '';
  const inf=sistema==='socionica'?I.soc:I.mbti;
  const def=sistema==='socionica'?SOC_ELEMENTOS[proc]:MBTI_PROCESSOS[proc];
  if(!def)return '';
  const a=inf.apoios[proc]||{apoio:0,contra:0,testemunhos:[],contraTestemunhos:[]};
  const alt=inf.alternativa;
  let distingue='—';
  if(alt&&inf.principal){
    if(sistema==='socionica'){
      const i=inf.principal.modelo.indexOf(proc);
      distingue=i>=0
        ? ('Em '+inf.principal.tipo+', «'+proc+'» ocupa a posição '
           +SOC_POSICOES[i].nome+'. Em '+alt.tipo+', a mesma posição é ocupada por «'
           +alt.modelo[i]+'» — e «'+proc+'» fica '
           +(alt.modelo.indexOf(proc)>=0?('na posição '+SOC_POSICOES[alt.modelo.indexOf(proc)].nome):'noutro lugar')+'.')
        : '—';
    } else {
      const pos=['dom','aux','tert','inf'].find(p=>inf.principal.estrutura[p]===proc);
      distingue=pos
        ? ('Em '+inf.principal.tipo+', «'+proc+'» é a função '+MBTI_POSICOES[pos].rotulo
           +'. Em '+alt.tipo+', essa posição cabe a «'+alt.estrutura[pos]+'».')
        : '—';
    }
  }
  const fontes=(sistema==='socionica'?SOC_FONTE:MBTI_FONTE);
  const listaT=L=>L.length
    ? '<ul class="tip-tl">'+L.map(t=>'<li><b>'+t.regra+'</b> <i>v'+t.versao+'</i>'
        +'<span class="tip-ev">sinais que ocorreram ('+t.sinaisOcorridos.length+' de '
          +(t.sinaisOcorridos.length+t.sinaisAusentes.length+t.sinaisIndeterminados.length)
          +', mínimo '+t.minimo+'): '+t.sinaisOcorridos.join(' · ')+'</span>'
        +(t.sinaisAusentes.length?('<span class="tip-ev">não ocorreram: '
          +t.sinaisAusentes.join(' · ')+'</span>'):'')
        +(t.sinaisIndeterminados.length?('<span class="tip-ev">sem dados: '
          +t.sinaisIndeterminados.join(' · ')+'</span>'):'')
        +'<span class="tip-hip">'+t.hipotese+'</span>'
        +'<span class="tip-dist">'+t.distincao+'</span></li>').join('')+'</ul>'
    : '<p class="tip-nada">Nenhum.</p>';
  /* barra: apoio × contradição — grandezas da MESMA escala, por isso comparáveis */
  const tot=Math.max(1,a.apoio+a.contra);
  const barra='<div class="tip-bar" role="img" aria-label="apoio '+a.apoio.toFixed(2)
    +', contradição '+a.contra.toFixed(2)+'">'
    +'<span class="bp" style="width:'+(a.apoio/tot*100).toFixed(1)+'%"></span>'
    +'<span class="bc" style="width:'+(a.contra/tot*100).toFixed(1)+'%"></span></div>'
    +'<p class="tip-barl">apoio '+a.apoio.toFixed(2)+' · contradição '+a.contra.toFixed(2)
    +' — soma de pesos de regra, na mesma escala. Não é probabilidade.</p>';
  return '<section class="tps tip-det"><h3>'+proc+' — '+def.nome+'</h3>'
    +'<button class="tip-fechar" data-tipfn="">fechar</button>'
    +'<dl class="tip-q">'
    +'<div><dt>O que significa neste sistema?</dt><dd>'
      +(sistema==='socionica'?def.o_que_e:def.processo)
      +'<br><span class="tip-naoe">Não é: '+(def.nao_e||def.nao_confundir||'—')+'</span></dd></div>'
    +'<div><dt>O que favorece esta hipótese?</dt><dd>'+listaT(a.testemunhos)+'</dd></div>'
    +'<div><dt>O que a contradiz?</dt><dd>'+listaT(a.contraTestemunhos)+'</dd></div>'
    +'<div><dt>Como se distingue da alternativa?</dt><dd>'+distingue+'</dd></div>'
    +'<div><dt>Qual é a fonte?</dt><dd>'
      +'<b>Definição:</b> '+(sistema==='socionica'?fontes.escola:MBTI_CONVENCAO.nome)+'. '
      +'<b>Elo com o mapa:</b> hipótese deste app, sem fonte externa. '
      +'<span class="tip-naoe">'+AVISO_FONTE+'</span></dd></div>'
    +'</dl>'+barra+'</section>';
}

/* ============ 3 · HIPÓTESES ============ */
function tipHipoteses(){
  const I=tipInferir(); if(!I)return tipVazio();
  const bloco=(titulo,inf)=>{
    let h='<section class="tps"><h3>'+titulo+'</h3>';
    if(inf.insuficiente)
      h+='<p class="tip-nada"><b>Evidência insuficiente:</b> '+inf.porqueInsuficiente+'.</p>';
    h+='<div class="tip-rank">'+inf.ranking.map((r,i)=>
      '<div class="tip-rk'+(i===0&&!inf.insuficiente?' top':'')+'">'
      +'<span class="tip-rn">'+(i+1)+'º</span><b>'+r.tipo+'</b>'
      +'<span class="tip-rs">apoio '+r.apoio.toFixed(2)+' · contradição '+r.contra.toFixed(2)+'</span>'
      +(r.contradicoes.length
        ? '<ul class="tip-contra">'+r.contradicoes.map(c=>'<li>'+c+'</li>').join('')+'</ul>'
        : '<p class="tip-semcontra">Sem contradição registrada entre os testemunhos disponíveis.</p>')
      +'</div>').join('')+'</div>';
    if(inf.comparacoes&&inf.comparacoes.length){
      h+='<h4 class="tip-h4">Por que o primeiro, e não o segundo</h4>'
       +'<ul class="tip-cmp">'+inf.comparacoes.map(c=>'<li>'+c.texto+'</li>').join('')+'</ul>'
       +'<p class="tip-obs"><b>O que distinguiria os dois:</b> '+inf.comparacoes.distingue+'</p>';
    }
    h+='<p class="tip-nota">'+inf.sensibilidade.nota+'</p>';
    if(inf.indeterminadas.length){
      h+='<h4 class="tip-h4">Regras que não puderam ser aplicadas</h4><ul class="tip-ind">'
        +inf.indeterminadas.map(x=>'<li><b>'+x.regra+'</b> — '+x.porque+'</li>').join('')
        +'</ul>';
    }
    return h+'</section>';
  };
  return bloco('MBTI · candidatos ordenados',I.mbti)
    +bloco('Sociônica · candidatos ordenados',I.soc);
}

/* ============ 4 · COMPARAÇÃO ENTRE SISTEMAS ============ */
function tipComparacao(){
  const I=tipInferir(); if(!I)return tipVazio();
  const C=I.pontes;
  let h='<section class="tps"><h3>Pontes e diferenças</h3>'
    +'<p class="tip-sub">'+PONTES_META.regra+'</p>';
  if(C.indisponivel)return h+'<p class="tip-nada">'+C.nota+'</p></section>';
  h+='<p class="tip-div">'+C.leituraDivergencia+'</p>'
    +'<div class="tip-par"><span>'+C.mbti+'</span><i>e</i><span>'+C.soc+'</span></div>';
  if(C.linhas.length)
    h+='<h4 class="tip-h4">Onde o mesmo símbolo aparece nos dois</h4><ul class="tip-lin">'
      +C.linhas.map(l=>'<li>'+l.texto+'</li>').join('')+'</ul>';
  if(C.simbolos.length)
    h+='<h4 class="tip-h4">Mesmo símbolo, definições diferentes</h4>'
      +C.simbolos.map(s=>'<div class="tip-sim"><b>'+s.simbolo+'</b>'
        +'<div><em>MBTI</em><p>'+s.mbti+'</p></div>'
        +'<div><em>Sociônica</em><p>'+s.socionica+'</p></div>'
        +'<p class="tip-dif">'+s.diferenca+'</p></div>').join('');
  h+='<h4 class="tip-h4">Testemunhos que sustentam cada lado</h4>'
    +'<div class="tip-2col">'
    +['mbti','socionica'].map(s=>'<div><em>'+(s==='mbti'?'MBTI':'Sociônica')+'</em>'
      +(C.testemunhos[s].length
        ? '<ul>'+C.testemunhos[s].map(t=>'<li><b>'+t.regra+'</b> → '+t.favorece+'</li>').join('')+'</ul>'
        : '<p class="tip-nada">nenhum</p>')+'</div>').join('')+'</div>'
    +'<p class="tip-imp">'+C.impedimento+'</p>'
    +'<h4 class="tip-h4">Pares que costumam ser tomados por equivalentes</h4>'
    +C.exemplos.map(e=>'<div class="tip-ex"><b>'+e.par.join(' × ')+'</b>'
      +'<p><em>parecido:</em> '+e.parecido+'</p>'
      +'<p><em>diferente:</em> '+e.diferente+'</p>'
      +'<p class="tip-imp2"><em>o que impede a equivalência:</em> '+e.impede+'</p></div>').join('')
    +'</section>';
  return h;
}

/* ============ 5 · REFINAR COM RESPOSTAS ============ */
function tipRefinar(){
  const I=tipInferir();
  const perguntas=I?autoSelecionar(I.mbti,I.soc,6):AUTO_PERGUNTAS.slice(0,6);
  const est=autoCarregar(), R=est.respostas||{}, decl=est.declarado||{};
  let h='<section class="tps"><h3>Refinar com respostas</h3>'
    +'<p class="tip-sub">'+AUTO_META.aviso+'</p>'
    +'<p class="tip-nota">'+AUTO_META.regra+'</p>';
  h+='<div class="tip-perg">'+perguntas.map(q=>{
    const r=R[q.id]||{};
    return '<article class="tip-p"><em>'+(q.sistema==='mbti'?'MBTI':'Sociônica')
      +' · separa '+q.distingue.join(' × ')+'</em>'
      +'<p class="tip-sit">'+q.situacao+'</p>'
      +'<div class="tip-op">'
      +AUTO_OPCOES.map(o=>{
        const txt=o.v==='a'?q.a.texto:o.v==='b'?q.b.texto:o.rotulo;
        return '<button class="tip-o'+(r.valor===o.v?' on':'')+'" data-tipq="'+q.id
          +'" data-tipv="'+o.v+'">'+txt+'</button>';}).join('')
      +'</div><p class="tip-qn">'+q.nota+'</p></article>';}).join('')+'</div>';
  /* tipo declarado pela pessoa */
  h+='<h4 class="tip-h4">O tipo que você mesmo atribui a si</h4>'
    +'<p class="tip-nota">Guardado como terceira fonte, ao lado das outras duas, '
    +'e nunca sobrescrito por elas.</p>'
    +'<div class="tip-decl">'
    +'<label>MBTI <input id="tip-decl-mbti" value="'+(decl.mbti||'')+'" '
      +'placeholder="ex.: INTP" maxlength="4"></label>'
    +'<label>Sociônica <input id="tip-decl-soc" value="'+(decl.socionica||'')+'" '
      +'placeholder="ex.: LII" maxlength="4"></label>'
    +'<button class="tip-salvar" data-tipdecl="1">guardar</button></div>';
  /* confronto das três fontes */
  const C=autoConfronto(I?I.mbti:null, I?I.soc:null);
  h+='<h4 class="tip-h4">As três fontes, lado a lado</h4>'
    +C.linhas.map(l=>'<div class="tip-conf"><b>'+(l.sistema==='mbti'?'MBTI':'Sociônica')+'</b>'
      +'<ul><li><span>hipótese natal</span><i>'+(l.natal||'—')+'</i></li>'
      +'<li><span>hipótese por respostas</span><i>'+(l.respostas||'—')+'</i></li>'
      +'<li><span>tipo declarado</span><i>'+(l.declarado||'—')+'</i></li></ul>'
      +'<p>'+l.leitura+'</p></div>').join('');
  /* respostas “depende” e “não sei”, registradas como tais */
  ['mbti','socionica'].forEach(s=>{
    const H=autoHipotese(s);
    if(H.ignoradas&&H.ignoradas.length)
      h+='<p class="tip-ign"><b>'+(s==='mbti'?'MBTI':'Sociônica')+':</b> '
        +H.ignoradas.map(i=>i.pergunta+' — '+i.porque).join('; ')+'.</p>';
  });
  return h+'</section>';
}

/* ============ 6 · FONTES E MÉTODO ============ */
function tipFontes(){
  const I=tipInferir();
  let h='<section class="tps"><h3>O que este app faz, e o que não faz</h3>'
    +'<p class="tip-decl-forte">'+PONTE_META.declaracao+'</p>'
    +'<p class="tip-nota">'+PONTE_META.o_que_seria_evidencia+'</p>';
  h+='<h4 class="tip-h4">Os quatro estágios da ponte</h4><ol class="tip-est">'
    +PONTE_ESTAGIOS.map(e=>'<li><b>'+e.nome+'</b> <i>'+e.natureza+'</i><p>'+e.o_que_e+'</p></li>').join('')
    +'</ol>';
  /* as definições cruas de cada sistema — estavam nos módulos e não
     apareciam em lugar nenhum da interface */
  h+='<h4 class="tip-h4">Jung · as quatro funções e as duas atitudes</h4>'
    +'<p class="tip-sub">'+JUNG_DOMINANCIA.o_que_e+'</p>'
    +'<p class="tip-lim">'+JUNG_DOMINANCIA.o_que_nao_diz+'</p>'
    +'<div class="tip-defs">'
    +Object.values(JUNG_FUNCOES).map(f=>'<div><b>'+f.nome+'</b>'
      +'<i>'+f.classe+'</i><p>'+f.o_que_e+'</p>'
      +'<p class="tip-lim">'+f.nao_e+'</p></div>').join('')
    +Object.values(JUNG_ATITUDES).map(a=>'<div><b>'+a.nome+'</b>'
      +'<i>atitude</i><p>'+a.o_que_e+'</p>'
      +'<p class="tip-lim">'+a.nao_e+'</p></div>').join('')
    +'</div>'
    +'<p class="tip-nota">Combinando as quatro funções com as duas atitudes '
    +'chegam-se às oito que Jung nomeou: '
    +JUNG_OITO.map(x=>x[2]).join(' · ')+'. '
    +'A divisão racional/irracional é dele e classifica FUNÇÕES — '
    +JUNG_RACIONALIDADE.racional.o_que_e+' '+JUNG_RACIONALIDADE.irracional.o_que_e+'</p>';

  h+='<h4 class="tip-h4">MBTI · as quatro dicotomias, e o que elas não são</h4>'
    +'<div class="tip-defs">'
    +Object.values(MBTI_DICOTOMIAS).map(d=>'<div><b>'+d.nome+'</b>'
      +'<i>'+d.par.join(' × ')+'</i><p>'+d.o_que_e+'</p>'
      +'<p class="tip-lim">'+d.nao_e+'</p></div>').join('')
    +'</div>'
    +'<p class="tip-nota">A convenção de pilha adotada é «'+MBTI_CONVENCAO.nome
    +'», e as suas regras são estas: '+MBTI_CONVENCAO.regra.join(' ')+'</p>';

  h+='<h4 class="tip-h4">Sociônica · notação e relações intertipo</h4>'
    +'<p class="tip-sub">A identificação primária é o código de três letras. '
    +'Ao lado, a notação sociônica de quatro letras — que não é a do MBTI:</p>'
    +'<div class="tip-not">'+SOC_TIPOS.map(t=>'<span><b>'+t+'</b> '+SOC_QUATRO[t]
      +'<i>'+SOC_NOMES[t]+'</i></span>').join('')+'</div>'
    +'<p class="tip-lim">'+SOC_FONTE.notacao+'</p>'
    +'<div class="tip-defs">'+Object.entries(SOC_RELACOES).map(([k,v])=>
      '<div><b>'+k+'</b><p>'+v+'</p></div>').join('')+'</div>'
    +'<p class="tip-lim">'+SOC_RELACOES_AVISO+'</p>';

  h+='<h4 class="tip-h4">Os três vocabulários, separados</h4>'
    +'<div class="tip-voc">'
    +'<div><b>Jung</b><p>'+JUNG_FONTE.obra+' — '+JUNG_FONTE.loc+'.</p>'
      +'<p class="tip-lim">'+JUNG_FONTE.limite+'</p></div>'
    +'<div><b>MBTI</b><p>'+MBTI_FONTE.o_que_mede+'</p>'
      +'<p class="tip-lim"><b>Convenção adotada:</b> '+MBTI_CONVENCAO.nome+'. '
      +MBTI_CONVENCAO.divergencia+'</p>'
      +'<p class="tip-lim">'+MBTI_CONVENCAO.nao_e_jung+'</p>'
      +'<p class="tip-lim">'+MBTI_CONVENCAO.nao_e_socionica+'</p>'
      +'<p class="tip-naoverif">'+MBTI_FONTE.naoVerificado+'</p></div>'
    +'<div><b>Sociônica</b><p>'+SOC_FONTE.escola+'.</p>'
      +'<p class="tip-lim">'+SOC_FONTE.notacao+'</p>'
      +'<p class="tip-lim">'+SOC_FONTE.camadas_posteriores+'</p>'
      +'<p class="tip-lim">'+SOC_FONTE.limite+'</p></div>'
    +'</div>';
  h+='<h4 class="tip-h4">Mal-entendidos que o app se recusa a cometer</h4>'
    +'<ul class="tip-mal">'
    +JUNG_MAL_ENTENDIDOS.concat(MBTI_MAL_ENTENDIDOS,SOC_MAL_ENTENDIDOS)
      .map(m=>'<li><b>'+m.erro+'</b> — '+m.porque+'</li>').join('')
    +'</ul>';
  /* o registro das regras aplicadas, com versão e proveniência */
  if(I){
    const regras=REGRAS_MBTI.concat(REGRAS_SOC);
    const usadas=new Set(I.mbti.testemunhos.concat(I.soc.testemunhos).map(t=>t.regra));
    h+='<h4 class="tip-h4">Registro das regras ('+regras.length+' no total, '
      +usadas.size+' aplicadas a este mapa)</h4><div class="tip-reg">'
      +regras.map(R=>'<details'+(usadas.has(R.id)?' open':'')+'><summary><b>'+R.id
        +'</b> <i>v'+R.versao+'</i> <span>'+(usadas.has(R.id)?'aplicada':'não aplicada')+'</span></summary>'
        +'<p><em>sistema:</em> '+R.sistema+' · '+R.escola+'</p>'
        +'<p><em>condições:</em> configuração de pelo menos '+R.minimo
          +' destes sinais — '+R.sinais.map(x=>x.texto).join(' · ')+'</p>'
        +'<p><em>leitura astrológica (fonte):</em> '+R.leitura+'</p>'
        +'<p><em>fontes:</em> '+R.fontesNatais.map(f=>f.autor+', <i>'+f.obra+'</i>'
          +(f.loc?(' — '+f.loc):'')).join('; ')+'</p>'
        +'<p><em>hipótese (do app, sem fonte):</em> '+R.hipotese+'</p>'
        +'<p><em>favorece:</em> '+R.favorece.map(x=>x[0]+' ('+x[1]+')').join(', ')
        +(R.contraria?(' · <em>contraria:</em> '+R.contraria.map(x=>x[0]+' ('+x[1]+')').join(', ')):'')+'</p>'
        +'<p class="tip-lim"><em>o que não autoriza concluir:</em> '+R.distincao+'</p>'
        +'<p class="tip-naoe">'+AVISO_FONTE+'</p></details>').join('')
      +'</div>';
  }
  h+='<h4 class="tip-h4">Sobre pontuação</h4>'
    +'<p class="tip-nota">Os números exibidos são somas de pesos de regra, usadas '
    +'apenas para ORDENAR candidatos. Não são probabilidades, não são porcentagens '
    +'de certeza e não medem quanto o app acerta. Quando pequenas variações de peso '
    +'trocariam o primeiro colocado, isso é dito na própria seção de hipóteses, e a '
    +'ordenação passa a ser apresentada como instável.</p>'
    +'<p class="tip-nota">Evidência correlacionada é limitada: regras que dependem '
    +'do mesmo fator do mapa são agrupadas por família, e a segunda regra de uma '
    +'família entra com metade do peso, a terceira em diante com um quarto. Um mesmo '
    +'fato não conta duas vezes por estar redigido de duas maneiras.</p>';
  return h+'</section>';
}

/* ============ montagem ============ */
const TIP_SECOES=[
  ['visao','Visão geral',tipVisaoGeral],
  ['funcoes','Funções e elementos',tipFuncoes],
  ['hipoteses','Hipóteses',tipHipoteses],
  ['comparacao','Comparação entre sistemas',tipComparacao],
  ['refinar','Refinar com respostas',tipRefinar],
  ['fontes','Fontes e método',tipFontes]
];
