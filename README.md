# AstroGraph — motor interpretativo tradicional (genérico)

## Changelog

**Ciclo 2 — calibração**
- **Contato principal por natureza.** Um ingresso nunca é o principal de
  um aglomerado havendo aspecto: lunação > ângulo > luminar/regente do
  Asc > regente da casa profectada > aspectos > ingressos. Sem isto a
  resposta certa saía por 0,13 ponto.
- **Ambiguidade de 67% para 40%.** Limiar a 0,85 e a alternativa passa a
  exigir voto de regência ou de eixo — ocupação e promissor sozinhos são
  eco, não assunto. Calibração medida em `docs/antes-depois.md`.
- **Janelas de ingresso**: o cruzamento ±3 meses, não a permanência
  inteira na casa. A permanência fica no modo técnico. Máxima no mapa de
  teste: 12 meses, contra 277.
- **Moldes variados** no nível simples, por hash determinístico do id do
  evento; o ciclo confirmador passa a ser nomeado.


- **Campo do evento por votação ponderada.** O campo deixa de ser "a
  primeira casa encontrada" — que era sempre a casa OCUPADA — e passa a
  ser votado, com a regência a pesar mais do que a posição. Corrige o
  caso em que um contato contra o regente da 5ª saía rotulado como
  mudança de residência. Campos disputados são declarados **ambíguos**,
  com as duas casas nomeadas por ordem.
- **Significadores de pessoas** (`js/pessoas.js`): pai, mãe, irmãos,
  filhos e cônjuge por casa, por natureza (com seita) e por presença,
  cada candidato com a origem declarada. Um planeta pode ser duas
  pessoas, e o texto diz as duas em vez de escolher em silêncio.
- **Dois níveis de leitura** com um interruptor global *modo técnico*,
  desligado por omissão. O nível simples diz o acontecimento, a janela e
  o porquê em português comum; o técnico traz tudo o que já havia, mais
  a votação de campo com as pontuações.
- **Revolução Solar:** o regente do Ascendente passa a ser lido também
  NA revolução, projetado sobre as casas natais — e não só na posição
  natal. `rsGoto(ano|data)` fica exposto.
- **Termos ptolomaicos** transcritos da imagem *Table of Essential
  Dignities*, com a correção de Virgem (♄ 18–24, ♂ 24–30).
- Ver `docs/antes-depois.md` (saída comparada no mapa de teste) e
  `docs/divergencias.md` (onde o pedido e a tradição não coincidem).

Sistema estático que interpreta **qualquer mapa natal e revoluções solares informadas pelo usuário** com técnicas da astrologia tradicional. Sem conteúdo pré-carregado: cole os dados na aba **Dados** e a estrutura interpretativa inteira é gerada.

## O que o sistema computa a partir dos dados colados
- Regência das casas pelos signos das cúspides; **regra dos 5 graus** na natal e nas RS.
- Dignidades essenciais (domicílio, exaltação, exílio, queda), **termos** (tábua tradicional), combustão/cazimi, retrogradação; força sintética por planeta.
- **Seita** (pela casa do Sol, com opção manual), Lotes de Fortuna e **Espírito** (fórmulas por seita).
- **Recepções** (domicílio/exaltação + aspecto) e recepções mútuas; cadeias de dispositores, **dispositor final** e anéis fechados.
- **Firdária** na ordem da seita, profecções a partir do signo do Asc, razão ano-a-ano com juízo literal.
- **Temperamento** por pesos (Asc + regente + planetas na I + Lua/fase → estação → senhor da genitura), com confiança e contradições.
- **48 eixos** de personalidade avaliados por testemunhos genéricos (elementos, modos, força planetária, aspectos) — debilidade inverte a forma, não apaga a natureza.
- **Promessas do mapa** geradas por regras (regente do Asc, planeta mais forte, dispositor final, anel, maléfico contra a seita), com anos de ativação.
- **Revoluções Solares**: leitura automática — casa natal do Asc da RS, condição do Senhor do Ano na RS, confirmação de Abu Mashar (signo natal repetido), retornos/planetas sobre pontos natais, aglomerados, aspectos mais apertados, estrelas angulares — e alimentação do motor de relevância dos trânsitos (angularidade e ecos).
- Trânsitos (Hoje / 30 dias / por planeta / por área), corda do tempo, mandala profectada, comparador A/B, retrospectiva com avaliação, eletiva, grafo natal 3D com fallback 2D, exportação em PDF (imprimir).
- Estrelas fixas: as conjunções informadas nos dados ganham glosa da tábua interna (~120 estrelas); desconhecidas aparecem sem glosa.

## Formato de entrada
O mesmo formato de exportação em texto usado nos dados deste projeto: blocos de planeta (glifo / signo / grau / [℞] / casa), cúspides `H1 - Asc` … `H12`, aspectos e conjunções de estrela em inglês (`Moon Square Mars`, `Venus Conjunct Algol`) com orbe e A/S. O parser é tolerante a variações de linha.

## Publicar no GitHub Pages
1. Crie um repositório e envie **todo o conteúdo desta pasta** (o `index.html` deve ficar na raiz do repositório; o arquivo `.nojekyll` acompanha).
2. Em **Settings → Pages → Build and deployment**: *Deploy from a branch* → branch `main` → pasta `/ (root)` → Save.
3. O site sobe em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`. Os caminhos são todos relativos — funciona em subdiretório.

Rodar local: `python3 -m http.server` na pasta (necessário para o RAG carregar os corpora; abrindo direto do disco, tudo funciona exceto a busca completa no corpus, que cai no fallback rotulado).

## Privacidade e persistência
Mapas e revoluções ficam **apenas no localStorage do navegador**; nada é enviado a servidor. Backup por exportar/importar JSON na aba Dados.

## Limitações honestas
- Efemérides precisas via Astronomy Engine (CDN) quando online; offline, longitudes médias aproximadas (etiquetadas).
- Temperamento assume hemisfério norte na estação do Sol.
- A leitura das RS interpreta os **dados informados** (não recalcula o mapa anual); RS sem cúspides perdem os itens que dependem delas.
- O corpus *Planetas nas Casas* não contém Mercúrio: para Mercúrio vale a linha genérica do próprio motor.
- Eletiva sem Ascendente local (sem coordenadas); avaliação por Lua, significador, trânsitos, Senhor do Ano e firdária, em UTC.

## Testes

O app é estático: abrir `index.html` basta. Os testes precisam de um servidor
local e de um Chromium controlado por Playwright.

```bash
npm install                 # traz playwright-core (só para os testes)
npm run serve &             # python3 -m http.server 8099
npm test                    # as quatro suítes
```

Suítes individuais: `npm run test:astrologia`, `test:tipologia`,
`test:probabilidades`, `test:preditivas`.

Variáveis de ambiente aceitas: `BASE_URL`, `CHROME_PATH`, `VIEWPORT`,
`MAPAS` / `MAPA_URL`. Se o Chromium não estiver no caminho padrão do
ambiente, indique-o com `CHROME_PATH=/caminho/para/chrome`.

### Sem Chromium

Se não houver Chromium em `CHROME_PATH`, a suíte pode correr em jsdom.
O caminho é: subir o servidor a partir do próprio script
(`child_process.spawn('python3',['-m','http.server','8099'])`), carregar
`index.html` com `runScripts:'dangerously'` e `resources:'usable'`,
esperar o evento `load`, chamar `boot()` se ainda não tiver corrido,
preencher `#imp-url` e disparar `#imp-run`, e aguardar até `#imp-status`
conter "importado".

Ressalva honesta: as asserções que medem **geometria de tela** —
transbordo horizontal, filas da barra de abas, largura das barras dos
gráficos — não valem em jsdom, que não faz layout. Essas ficam
condicionadas ao Chromium; as de cálculo e de texto correm nos dois.

## Campo do evento: votação ponderada

Um contato não diz sozinho de que assunto trata. O planeta tocado
*significa* as casas que **rege** e *age* a partir da casa que **ocupa**
— é a distinção de **Morin**, *Astrologia Gallica* XXI e XXIII. O motor
tomava sempre a casa ocupada, porque era a primeira da lista e existia
sempre; as casas regidas eram calculadas e nunca decidiam nada.

Num mapa com Ascendente em Áries, o Sol ocupa a 4ª e rege a 5ª. Uma
lunação progredida contra o Sol natal saía lida como mudança de
endereço, quando o assunto é a 5ª.

Cada contato distribui votos:

| quem | via | peso |
|---|---|---|
| alvo natal | casa que ocupa | 2 |
| alvo natal | cada casa que rege por **domicílio** | 3 |
| alvo natal | regente do **termo** do Asc ou do MC | 1,5 |
| promissor | casa que ocupa | 1 |
| promissor | cada casa que rege | 1,5 |
| eixo tocado | casa do eixo (Asc/Dsc/MC/IC) | 3 |
| Lote (Fortuna, Espírito) | casa que ocupa · regente do Lote | 2 · 1 |
| bónus | alvo rege a casa profectada do ano | +2 |
| bónus | alvo é senhor da firdária ou subfirdária | +1 |

A **face não entra**: é dignidade fraca demais para mover o assunto de
um evento (ver `docs/divergencias.md`).

Três regras que o motor faz valer, e que a suíte tranca:

1. **Cada facto conta uma vez.** "A Lua rege a 4ª" é um facto do mapa,
   não um por contato. Os testemunhos são deduplicados por
   (casa + justificação), com o maior peso — a mesma disciplina que o
   motor de probabilidades já aplica por `originId`.
2. **Ambiguidade declarada.** Quando a segunda casa alcança 70% da
   primeira, o evento é ambíguo e o texto nomeia as duas, nessa ordem —
   *"mais provável: filhos; também possível: casa"*.
3. **Invariante da regência.** Se a casa vencedora é a que o alvo
   **ocupa** e o mesmo alvo **rege** outra com apoio real, a casa regida
   entra como alternativa mesmo abaixo dos 70%. O limiar compara casas
   quaisquer; aqui o conflito é dentro do mesmo significador, e a
   regência não desaparece diante da própria posição do planeta.

A **lunação progredida sobre o Sol natal** (Lua ☌/☍ Sol) é evento-nível:
decide o campo pelas casas do Sol, e a Lua não vota — numa lunação a Lua
é o relógio do ciclo, não a matéria.

No nível técnico a votação aparece aberta: barra por casa, a razão
contra o limiar, e de onde veio cada ponto.

## Significadores de pessoas

O app dizia "4ª = casa, família de origem, pai" e "10ª = carreira". O pai
vinha colado à 4ª como se a pessoa e o imóvel fossem a mesma coisa, e a
mãe não aparecia em lado nenhum.

`js/pessoas.js` atribui cada figura por três vias, que não se confundem:

- **por casa** — o regente da casa da figura, e os planetas nela.
  *Lilly, Christian Astrology I.20 (as casas) e III (juízos por casa).*
- **por natureza** — o significador natural, que muda com a **seita**:
  Sol de dia / Saturno de noite para o pai; Vênus de dia / Lua de noite
  para a mãe; Mercúrio para os irmãos; Júpiter para os filhos. O da
  seita contrária fica secundário — nunca desaparece.
  *Ptolomeu, retomado por Lilly (CA I.20) e Morin (AG XXI).*
- **por presença** — planetas efetivamente colocados na casa da figura.

O regente da casa e o significador natural **da seita** são pretensões
fortes; as outras vias são testemunhos, e nenhuma soma de testemunhos
passa à frente de uma pretensão forte. (Sem esta regra, num mapa noturno
o Sol liderava "pai" por estar na 4ª mais natureza secundária, à frente
de Saturno — a seita ficava revogada por uma soma.)

### Um planeta pode ser duas pessoas

É o ponto que o módulo existe para tornar explícito. Num mapa noturno
com Áries ascendendo, a **Lua** rege a 4ª (pai, por casa) e é a mãe por
natureza; **Saturno** rege a 10ª (mãe) e é o pai por natureza. Quando um
contato toca a Lua, o texto escreve:

> Lua aqui pode ser o pai (regente da 4ª) ou a mãe (significador natural
> em mapa noturno); nada no contato desempata, e as duas leituras ficam
> de pé.

O desempate, quando existe, vem das regras e é dito: (a) o contato toca
também a casa, o regente ou o significador natural de uma das figuras;
(b) o planeta está na casa da figura. Quando nada decide, **as duas
ficam com igual peso** — nunca se escolhe em silêncio.

O **cônjuge** depende do sexo do nativo, que o app não deduz do mapa.
Sem esse dado, entram Vênus, Marte e Sol, com a falta escrita na própria
origem do candidato.

## Dois níveis de leitura

Um interruptor global **modo técnico**, guardado no navegador e
**desligado por omissão**.

- **Simples** — três linhas: o acontecimento e a janela; o porquê em
  linguagem comum; a pessoa envolvida e, se o campo for ambíguo, as
  alternativas por ordem. Sem "progredida", "dirigido", "orbe",
  "recepção", "combusto".
- **Técnico** — tudo o que já existia: contatos, arcos, orbes,
  dignidades, confirmações, a votação de campo com as pontuações e a
  origem de cada significador. Nada foi removido.

O nível técnico não é escondido por CSS: as funções de render perguntam
`modoTecnico()` e **não emitem** o texto quando ele está desligado.
Esconder com `display:none` deixaria o vocabulário de ofício no
documento, legível por leitores de ecrã e presente em `textContent`.

## Sistema de termos

`js/termos.js` trata os limites como SISTEMAS selecionáveis. A tábua em
uso é a **ptolomaica**, transcrita célula a célula da imagem
*“Table of Essential Dignities”* indicada como fonte de verdade deste
projeto. Duas células estavam ilegíveis na resolução recebida — os dois
últimos termos de Gêmeos e de Virgem, onde ♂ e ♄ não se distinguiam — e
foram confirmadas antes de escritas.

**A tábua que o projeto chamava de “egípcia” não era egípcia.** O
`TERMS` de `tables.js` tem Áries `♃6 ♀14 ☿21 ♂26 ♄30`; o egípcio é
`♃6 ♀12 ☿20 ♂25 ♄30`, e diverge em onze dos doze signos. Era, de facto,
a própria tábua ptolomaica — com um erro: em Virgem tinha ♂ de 18° a 24°
e ♄ de 24° a 30°, quando a imagem dá ♄ e depois ♂. Quem tivesse um
planeta entre 18° e 30° de Virgem via o senhor de termo errado. `TERMS`
fica em `tables.js` apenas como registo do que havia antes; nenhum
código a lê.

O rótulo “egípcio” foi **retirado** em vez de servir limites ptolomaicos
sob o nome de outra escola: o slot fica declarado e vazio, e volta assim
que uma tábua egípcia conferida for transcrita em
`TERM_SYSTEMS.egyptian.limites`. Quem tivesse essa opção guardada passa a
ver o ptolomaico, **com aviso na tela** — a troca nunca é silenciosa.

`termosValidar(id)` confere soma de 30° por signo, ordem crescente e
ausência de Sol e Lua. A suíte tranca os 60 limites um a um contra a
tábua da imagem, e regista a divergência encontrada em Virgem.
