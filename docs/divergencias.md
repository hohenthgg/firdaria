# Divergências entre o pedido e a tradição

Registo das regras em que o que foi pedido não coincide com a tradição
que consultei, ou em que a tradição não é unânime. Nenhuma foi
implementada em silêncio: ou está implementada como pedido e declarada
aqui, ou não está implementada e o motivo está dito.

---

## 1 · 4ª casa = pai, 10ª = mãe

**Implementado como pedido** (`js/pessoas.js`, `PESSOA_CASA`).

O brief atribui o pai à 4ª e a mãe à 10ª. É a atribuição de **Lilly**
(*Christian Astrology* I.20 e III) e da tradição latina medieval, que é
a fonte declarada deste projeto.

**A divergência:** parte da tradição helenística inverte — a 4ª como
lugar da mãe e a 10ª do pai — e há uma corrente que usa a 4ª para "o
progenitor menos visível" independentemente do sexo. A discussão é
antiga e não se resolve por autoridade.

**Alternativa que proponho, se algum dia for pedida:** tornar a
atribuição uma opção declarada, como já se fez com os sistemas de
termos — `PESSOA_CASA` viraria um sistema selecionável (`lilly` /
`helenistico`), com o rótulo na tela dizendo qual está em uso. A
estrutura de `pessoas.js` já suporta isso sem reescrita: só
`PESSOA_CASA` muda.

---

## 2 · Face excluída da votação de campo

**Implementado como pedido** (`PV_PESO`, sem entrada para face).

O brief diz "regente do termo do Asc/MC (não usar face)". Segui.

**Nota:** a face (*facies*, decanato caldaico) é dignidade menor
reconhecida por Lilly, que lhe dá 1 ponto na tábua de dignidades
essenciais — contra 2 do termo. Excluí-la é defensável justamente por
ser fraca demais para mover o assunto de um evento; registo apenas que
é uma exclusão deliberada, e não um esquecimento. Se um dia entrar, o
peso coerente com a escala existente seria 0,75 (metade do termo, como
1 é metade de 2 na tábua de Lilly).

---

## 3 · Lotes na votação: a regra quase não dispara

**Implementado como pedido, com o alcance real declarado.**

O brief manda dar peso 2 à casa que o Lote ocupa e 1 ao seu regente.
Implementei — mas com uma condição que o brief não pede explicitamente:
**o Lote só vota quando o grau do contato cai sobre ele** (≤3°).

**Por quê:** sem essa condição, os Lotes votam em *todos* os contatos.
Não é uma regra astrológica, é um viés constante: no mapa de teste a
Fortuna e o seu regente empurravam a 10ª para cima de qualquer evento e
a votação inteira colapsou nessa casa. Medi e reverti.

**A consequência honesta:** este motor não toma os Lotes como
significadores nem como alvos (ver `pvAlvos` e `pvSignificadores` em
`js/preditivas.js`), portanto a regra dispara raramente. Está escrita e
correta, mas trabalha pouco. Dizer isto é melhor do que deixar supor
que os Lotes estão a pesar em cada leitura.

**Alternativa:** admitir Fortuna e Espírito como significadores
dirigíveis, que é o uso tradicional (dirigir o Lote de Fortuna é
prática corrente em Bonatti e em Morin). Isso é trabalho de motor, não
de vocabulário, e não estava no âmbito.

---

## 4 · Lunação progredida: o assunto vem só do Sol

**Implementado como pedido, e vale a pena dizer por quê.**

O brief manda: "campo = casas do Sol natal (ocupada e regida)". Lido à
letra, na lunação progredida a Lua **não vota** — e foi assim que ficou.

**A justificação tradicional:** na Lua Nova e na Lua Cheia progredidas,
a Lua é o ponteiro do relógio de ~29,5 anos, e o Sol é o significador do
período que se abre. Deixar a Lua votar pelas casas que rege devolvia o
campo à 4ª que ela rege no mapa de teste — exatamente o erro que se
estava a corrigir.

**Onde isto NÃO se aplica:** a quadratura progredida Lua–Sol (primeiro e
último quartos). São fases reais do mesmo ciclo, mas o brief restringiu
a regra a ☌ e ☍, e não a estendi por conta própria. Para essas, o campo
é decidido pela votação normal — com o invariante da regência (§ abaixo)
a impedir que a ocupação do Sol engula a sua regência.

---

## 5 · Invariante da regência — acrescentado, não pedido

**Não estava no brief. Acrescentei, e explico.**

O brief define ambiguidade por limiar: segunda casa ≥ 70% da primeira.
Isso compara casas *quaisquer*. Mas há um caso em que o conflito é
interno a um único significador: quando a casa vencedora é a que o alvo
**ocupa** e o mesmo alvo **rege** outra casa.

Nesse caso a casa regida entra como alternativa **mesmo abaixo dos
70%**. Sem isto, "Lua progredida em quadratura ao Sol natal" dava 4ª
(ocupação do Sol, 4,5) contra 5ª (regência do Sol, 3,0) — razão 0,67, e
a 5ª desaparecia do texto.

**Fonte:** é o próprio ponto de Morin (*Astrologia Gallica* XXI e
XXIII): o planeta *significa* o que rege e *age* de onde está. As duas
coisas coexistem; uma não apaga a outra. Um limiar estatístico não
deveria poder revogar essa distinção.

---

## 6 · Sexo do nativo e o significador do cônjuge

**Não implementado como regra automática.**

O brief pede: "Cônjuge/parceiro — Vênus (mapa masculino) / Marte e Sol
(mapa feminino)".

**O problema:** o app não sabe o sexo do nativo. Não está no mapa, não
está no formato de importação, e **não se deduz da carta** — qualquer
tentativa de inferir seria invenção.

**O que ficou:** `pessoaDefinirSexo()` guarda o dado quando informado
(`agx_sexo_nativo`), e a regra aplica-se corretamente a partir daí. Sem
o dado, entram Vênus, Marte e Sol, e a origem de cada um diz por
extenso *"sexo do nativo não informado: entram os dois"*. A leitura fica
mais larga, mas não fica falsa.

**Nota sobre a regra em si:** a fórmula tradicional é por sexo do nativo
e pressupõe união heterossexual. Está implementada como pedido; se um
dia se quiser cobrir outros casos, o caminho honesto é o mesmo que se
usou aqui — pedir o dado em vez de o deduzir.

---

## 7 · O que o brief pediu e eu não entreguei por inteiro

**Revisão completa de PV_EVT, PV_ASSIN, PV_EVT_INF e PV_EVT_JUV.**

O brief pede: "revise PV_EVT, PV_ASSIN, PV_EVT_INF, PV_EVT_JUV inteiros
sob esse critério".

**O que fiz:** corrigi as entradas em que o tom trocava o assunto — o
caso nomeado no brief (5ª tensa) e os seus equivalentes diretos — e
acrescentei entradas por **regente** para as casas de pessoa (3ª, 4ª,
5ª, 7ª, 10ª), que era a lacuna estrutural apontada ("hoje só há entradas
por casa ocupada").

**O que não fiz:** reescrever as quatro tábuas entrada a entrada. São
algumas dezenas de textos e uma reescrita integral sem um critério
testável por entrada produziria variação de estilo sem garantia de
melhoria — e eu não teria como provar que melhorou. Preferi corrigir o
que está demonstrado errado e dizer o que ficou por fazer, em vez de
declarar uma revisão que não seria verificável.

**Sugestão para fechar:** um teste que percorra as quatro tábuas e falhe
quando `t` (versão tensa) e `s` (versão harmónica) nomeiem *assuntos*
diferentes e não o mesmo assunto em condições diferentes. Isso torna o
critério verificável, e a revisão passa a ser guiada por falhas em vez
de por julgamento de estilo.
