# AstroGraph — motor interpretativo tradicional (genérico)
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

## Sistema de termos

`js/termos.js` trata os limites como SISTEMAS selecionáveis. A tábua
**egípcia** é a que o projeto já usava e está completa. A tábua
**ptolomaica** está declarada mas **não preenchida**: a imagem indicada
como fonte de verdade não chegou, e reconstruí-la de memória foi
expressamente vedado. Para completar, basta preencher
`TERM_SYSTEMS.ptolemaic.limites` no mesmo formato da egípcia e marcar
`transcrito: true`; `termosValidar('ptolemaic')` confere soma de 30° por
signo, ordem crescente e ausência de Sol e Lua, e a suíte de testes
passa a exigir a comparação entre as duas tábuas.
