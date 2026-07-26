/* ============================================================
   MOTOR.JS — MOTOR DE CONVERGÊNCIA E SÍNTESE
   Distingue sempre, sem misturar:
     · casas regidas pelo planeta   = assuntos que ele ADMINISTRA
     · casa natal ocupada           = campo onde ele EXECUTA
     · casa profectada              = matéria PRIORITÁRIA do ano
     · Senhor do Ano                = ADMINISTRADOR anual
     · casa na revolução escolhida  = AMBIENTE atual de manifestação
     · sobreposição revolução×natal = área natal REATIVADA
     · aspectos natais repetidos    = promessa natal REFORÇADA
     · dignidade/recepção/aspectos  = QUALIDADE da entrega
   Base: Döser (framework-001, firdaria-002, profeccao-001, rs-001/002,
   transitos-001/002, motor-001) e módulo egípcio (eg-lua-venus-001).
   A pontuação é interna: serve só para ORDENAR, nunca é probabilidade.
   ============================================================ */

/* ---------- vocabulário literal (sem frases vagas) ---------- */
const VERBO=['tende a','favorece','aumenta a inclinação a','pode se manifestar como'];
const casaTag=h=>HOUSE_TAG[h]||'assuntos gerais';
const casasTag=hs=>{
  if(!hs||!hs.length)return 'assuntos gerais';
  const t=hs.map(casaTag);
  if(t.length===1)return t[0];
  // evita "A e B e C": junta por ponto-e-vírgula quando os rótulos já contêm "e"
  return t.some(x=>x.includes(' e '))?t.join('; '):t.slice(0,-1).join(', ')+' e '+t[t.length-1];
};
const ordinal=h=>h+'ª';
const cap1=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;

/* ---------- estado temporal completo numa data ---------- */
function tempoState(d){
  if(typeof NATAL==='undefined'||!NATAL)return null;
  const age=ageAt(d), f=firdAt(age), p=profAt(age);
  const mk=f.majorKey, sk=(f.subKey&&f.subKey!==mk&&PT_NAME[f.subKey])?f.subKey:null;
  const rev=(typeof revNow==='function')?revNow(d):null;
  return {
    d, age, f, mk, sk, p,
    lord:p.lordKey,                              // Senhor do Ano
    profHouse:p.houseN,
    rulesMk:mk?ruledHouses(mk):[],               // casas administradas pela firdária
    rulesSk:sk?ruledHouses(sk):[],
    rulesLord:p.lordKey?ruledHouses(p.lordKey):[],
    occMk:(mk&&NATAL.pts[mk])?NATAL.pts[mk].h:null,   // campo de execução natal
    occSk:(sk&&NATAL.pts[sk])?NATAL.pts[sk].h:null,
    occLord:(p.lordKey&&NATAL.pts[p.lordKey])?NATAL.pts[p.lordKey].h:null,
    rev
  };
}

/* ---------- qualidade da entrega (dignidade · recepção · aspectos) ---------- */
function qualidade(k){
  if(!k||!NATAL.pts[k])return {nivel:'—',txt:'condição não avaliável'};
  const p=NATAL.pts[k], dig=(p.dig||'').toLowerCase(), fr=(STR[k]||4);
  const rec=(NATAL.meta.receptions||[]).some(r=>r.includes(PT_GLYPH[k]));
  let nivel, txt;
  if(/domicílio|exalta/.test(dig)) {nivel='boa'; txt='dignificado ('+p.dig+')';}
  else if(/exílio|queda/.test(dig)) {nivel='travada'; txt='debilitado ('+p.dig+')';}
  else if(fr>=5) {nivel='boa'; txt=p.dig;}
  else if(fr<=2) {nivel='travada'; txt=p.dig;}
  else {nivel='condicional'; txt=p.dig};
  if(rec) txt+=' · recebido';
  return {nivel, txt, rec, forca:fr};
}

/* ---------- pesos da convergência (internos) ---------- */
const W=new Proxy({},{get:(_,k)=>((typeof CFG!=='undefined'&&CFG.cw&&CFG.cw[k]!=null)?CFG.cw[k]:({promessa:3,firdaria:3,sub:2,casaProf:3,senhorAno:3,revAlta:2.5,revMedia:1.5,repete:1.5,bonus:1.5})[k])});

/* Testemunhos de um planeta+casa numa data. Devolve {score, itens:[[peso,texto]], papeis}. */
function testemunhos(k, houseN, d, S){
  S=S||tempoState(d); if(!S)return {score:0,itens:[],papeis:0};
  const it=[]; let sc=0, papeis=0;
  const add=(w,txt)=>{sc+=w;it.push([w,txt]);};
  if(k===S.mk){add(W.firdaria,'senhor da firdária maior');papeis++;}
  if(k===S.sk){add(W.sub,'senhor da sub-firdária');papeis++;}
  if(k===S.lord){add(W.senhorAno,'Senhor do Ano');papeis++;}
  if(houseN&&S.profHouse===houseN){add(W.casaProf,'a casa da promessa é a casa profectada do ano');papeis++;}
  if(k&&ruledHouses(k).includes(S.profHouse)) add(W.sub,'administra a casa profectada ('+ordinal(S.profHouse)+')');
  if(S.rev){
    (revReinforces(S.rev,k,houseN)||[]).forEach(([nv,txt])=>{
      add(nv==='alto'?W.revAlta:W.revMedia,txt); if(nv==='alto')papeis++;});
    if(k&&S.rev.repeats.some(r=>r.a===k||r.b===k)) add(W.repete,'aspecto natal seu repetido na '+S.rev.label);
  }
  if(papeis>=3) add(W.bonus,'o mesmo planeta acumula '+papeis+' funções temporais');
  return {score:sc, itens:it, papeis};
}

/* ---------- estado de uma promessa natal ---------- */
function promiseState(pr,d,S){
  S=S||tempoState(d);
  const casas=(pr.casas||[]).filter(x=>x);
  let best={score:0,itens:[],papeis:0};
  casas.forEach(h=>{const t=testemunhos(pr.pl,h,d,S); if(t.score>best.score)best=t;});
  if(!casas.length) best=testemunhos(pr.pl,null,d,S);
  // promessa natal explícita (o próprio testemunho de raiz) pesa alto e é sempre contada
  const raiz=(pr.testemunhos&&pr.testemunhos.length)||1;
  const score=best.score+Math.min(W.promessa,raiz*0.6);
  const estado=score>=7?'ativada':score>=3.5?'disponível':'latente';
  return {score, estado, itens:best.itens, papeis:best.papeis, raiz};
}

/* ---------- assunto dominante por REGÊNCIA (não por casa ocupada) ---------- */
function assuntoFird(S){
  if(!S.mk||!PT_NAME[S.mk])return 'passagem de nodo, sem casa administrada';
  return casasTag(S.rulesMk);
}
function assuntoSub(S){
  if(!S.sk)return null;
  return casasTag(S.rulesSk);
}

/* ---------- SÍNTESE LITERAL — curta, sintética, por camadas ---------- */
function synthLiteral(d){
  const S=tempoState(d); if(!S)return '';
  const F=[];
  // 1. firdária maior = agenda ampla, pelas casas REGIDAS
  if(PT_NAME[S.mk]) F.push('Período de '+PT_NAME[S.mk]+': em destaque, '+assuntoFird(S)
    +(S.occMk?('; a execução passa por '+casaTag(S.occMk)):'')+'.');
  else F.push('Passagem de nodo: capítulo curto, sem casa administrada.');
  // 2. sub-firdária = assunto secundário/imediato (fase, não repetição mecânica)
  if(S.sk) F.push('Fase de '+PT_NAME[S.sk]+': em segundo plano, '+assuntoSub(S)+'.');
  // 3. profecção = assunto do ano + administrador
  F.push('Matéria do ano: '+casaTag(S.profHouse)+' ('+ordinal(S.profHouse)+'), administrada por '
    +PT_NAME[S.lord]+(S.occLord?('; ele atua por '+casaTag(S.occLord)):'')+'.');
  // 4. revolução selecionada = ambiente/forma da manifestação
  if(S.rev){
    F.push('Na Revolução '+S.rev.label+', o ambiente é '+casaTag(S.rev.ascNatalHouse)
      +' — Ascendente em '+S.rev.ascSignNm+', regido por '+PT_NAME[S.rev.ascRuler]+'.');
  }
  return F.map(x=>'<span>'+x+'</span>').join(' ');
}

/* ---------- cartão executivo do período (curto) ---------- */
function periodExec(age){
  const S=tempoState(new Date(BIRTH+age*365.2425*DAY)); if(!S)return null;
  return {
    agenda:PT_NAME[S.mk]?(PT_NAME[S.mk]+' — '+assuntoFird(S)):'—',
    fase:S.sk?(PT_NAME[S.sk]+' — '+assuntoSub(S)):'a fase repete o regente do ciclo',
    ano:casaTag(S.profHouse)+' · Senhor '+PT_NAME[S.lord],
    ambiente:S.rev?(S.rev.label+' — '+casaTag(S.rev.ascNatalHouse)):'—', S
  };
}
function execCardHTML(age,compact){
  const E=periodExec(age); if(!E)return '';
  const row=(k,v)=>'<div class="ex-r"><span class="ex-k">'+k+'</span><span class="ex-v">'+v+'</span></div>';
  return '<div class="exec">'+row('Agenda',E.agenda)+row('Fase',E.fase)+row('Ano',E.ano)+row('Ambiente',E.ambiente)
    +(compact?'':'<p class="ex-s">'+synthLiteral(E.S.d)+'</p>')+'</div>';
}

/* ============================================================
   TRÂNSITOS — seleção curta e priorizada + textos de 1 frase
   Prioridade (framework-001 §5, pn4-001 §7): senhores do tempo primeiro.
   ============================================================ */
function transitPriority(hit,d,S){
  S=S||tempoState(d); if(!S)return {score:0,porque:''};
  let sc=0, porque=null;
  const T=hit.tKey, alvo=hit.nk;
  if(T===S.mk){sc+=5;porque=porque||'rege a firdária maior em curso';}
  if(T===S.sk){sc+=4;porque=porque||'rege a fase (sub-firdária) atual';}
  if(T===S.lord){sc+=5;porque=porque||'é o Senhor do Ano';}
  if(S.rev){
    if(T===S.rev.planetKey){sc+=4;porque=porque||'é o planeta da Revolução '+S.rev.label+' selecionada';}
    if(T===S.rev.ascRuler){sc+=4;porque=porque||'rege o Ascendente da Revolução '+S.rev.label;}
  }
  if(alvo===S.lord){sc+=3;porque=porque||'toca o Senhor do Ano no natal';}
  if(alvo===S.mk||alvo===S.sk){sc+=2;porque=porque||'toca um senhor do tempo no natal';}
  if(['asc','mc','sun','moon'].includes(alvo)){sc+=3;porque=porque||'toca um ponto vital do mapa';}
  if(alvo==='fort'){sc+=2;porque=porque||'toca a Fortuna';}
  // contatos com planetas/casas de promessas ativadas
  const proms=(typeof PROMESSAS!=='undefined'?PROMESSAS:[]).filter(pr=>promiseState(pr,d,S).estado==='ativada');
  const pAlvo=proms.find(pr=>pr.pl===alvo||pr.pl===T);
  if(pAlvo){sc+=3;porque=porque||'toca o administrador de uma promessa natal ativada';}
  const casasAtivas=[S.profHouse].concat(proms.map(pr=>pr.h));
  if(ruledHouses(alvo).some(h=>casasAtivas.includes(h))){sc+=2;porque=porque||'o ponto tocado administra uma casa ativada no período';}
  if(hit.orb<1)sc+=2; else if(hit.orb<2.5)sc+=1;
  return {score:sc, porque:porque||'contato secundário no período', lento:['saturn','jupiter'].includes(T)};
}
/* os 3–5 trânsitos realmente relevantes */
function transitosRelevantes(d,max){
  if(typeof NATAL==='undefined'||!NATAL)return [];
  const S=tempoState(d); if(!S)return [];
  const seen={};
  return transitHits(d).map(h=>Object.assign(h,{pri:transitPriority(h,d,S)}))
    .filter(h=>h.pri.score>=5)
    .sort((a,b)=>b.pri.score-a.pri.score||a.orb-b.orb)
    .filter(h=>{const k=h.tKey+h.nk;if(seen[k])return false;seen[k]=1;return true;})
    .slice(0,max||5);
}
/* efeito literal em até 24 palavras — regências do TRANSITANTE são bagagem
   dele; as do ALVO pertencem ao alvo (nunca trocar). */
const TR_ACAO={
  sun:{conj:'ilumina e expõe',harm:'dá visibilidade a',tens:'pressiona por reconhecimento'},
  moon:{conj:'agita e torna imediato',harm:'facilita o trato com',tens:'desestabiliza o cotidiano de'},
  mercury:{conj:'movimenta papéis e conversas sobre',harm:'destrava conversas e documentos de',tens:'embaralha prazos e informações de'},
  venus:{conj:'suaviza e aproxima',harm:'facilita acordos em',tens:'confunde valores e afetos em'},
  mars:{conj:'acelera e força a ação em',harm:'dá impulso a',tens:'acirra disputas e desgasta'},
  jupiter:{conj:'amplia e abre',harm:'favorece crescimento em',tens:'infla expectativas em'},
  saturn:{conj:'cobra estrutura de',harm:'consolida com esforço',tens:'pressiona, atrasa e exige revisão de'}};
function transitoTexto(hit,d,S){
  S=S||tempoState(d);
  const T=hit.tKey, alvo=hit.np;
  const acao=(TR_ACAO[T]&&TR_ACAO[T][hit.cls])||'ativa';
  const alvoCasas=ruledHouses(hit.nk);                     // regências do ALVO
  const campo=alvoCasas.length?casasTag(alvoCasas.slice(0,2)):casaTag(alvo.h);
  const titulo=PT_NAME[T]+' em '+({conj:'conjunção a',harm:hit.ang===60?'sextil a':'trígono a',tens:hit.ang===90?'quadratura a':'oposição a'})[hit.cls]+' '+alvo.nm+' natal';
  let efeito=cap1(PT_NAME[T])+' '+acao+' '+campo+'; '
    +(hit.cls==='tens'?'exige revisão e cautela.':hit.cls==='harm'?'abre espaço para avançar.':'pede integração consciente.');
  // corta em 24 palavras
  const w=efeito.split(/\s+/); if(w.length>24) efeito=w.slice(0,24).join(' ')+'…';
  const janela=hitWindow(hit,d);
  return {titulo, efeito,
    porque:cap1(PT_NAME[T])+' '+hit.pri.porque+'.',
    janela, lento:hit.pri.lento,
    tecnico:PT_NAME[T]+' a '+zfmt(hit.lon)+', orbe '+hit.orb.toFixed(1)+'° · '
      +alvo.nm+' natal a '+zfmt(alvo.lon)+' (casa '+alvo.h+')'
      +(alvoCasas.length?(' · '+alvo.nm+' rege '+alvoCasas.map(ordinal).join(' e ')):'')
      +(ruledHouses(T).length?(' · '+PT_NAME[T]+' natal rege '+ruledHouses(T).map(ordinal).join(' e ')):'')
      +' · relevância interna '+hit.pri.score};
}
