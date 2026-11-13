# Crítica de design: Desempenho (Pulse)

Data: 2026-11-13 · Nota: **24/40 (Aceitável)** · P0: 0 · P1: 4 · P2: 15 · P3: 9

**Método:** dual-agent. A é a revisão de design e B é o detector com medições em Playwright headless. Rodaram isolados e sem ver o resultado um do outro. Formatos: celular 390×844 (toque, UA móvel), tablet 960×640 (toque) e PC 1440×900, em claro e escuro. Estados: dados completos (1020–1033 respostas, 12–17 semanas, 6–7 áreas, 6–7 instituições, 3–4 simulados), esparso (6–14 respostas) e usuário novo (vazio). Interações: períodos, origem, drill por área e subtema, "Onde focar", menu ⋯, tooltip, "Treinar 20". Referência: `PRODUCT.md` ("toda tela responde o que faço agora?" e "leitura longa e uso com uma mão") e `DESIGN.md`. Nenhum arquivo do projeto foi alterado e nenhum snapshot foi gravado em `.impeccable/critique/` (pedido: não editar nada). Não houve overlay no navegador do usuário (o live-server injetaria no HTML). Capturas e dados brutos ficaram no scratchpad da sessão (`A\` e `B\`). Os servidores das portas 8781 e 8782 foram encerrados (nada escutando).

Alvo: `MQ.views.desempenho` em `www/js/perf.js`, gráficos em `www/js/charts.js`, estilos em `www/css/app.css` (linhas 445–500, 757–795, 920–940, 981–990).

## Resumo

Não há P0: em todos os fluxos testados o estudante consegue ver seus números. Quando funciona, a tela é limpa, coerente com os tokens e tem boa base de contraste de texto (0 falhas nos 6 temas/formatos) e de teclado (anel âmbar de 2 px em tudo). Mas ela **responde "como estou?" e não "o que faço agora?"**: não há botão primário, há seis "Treinar 20" idênticos, e o dado mais acionável (Pontos fracos) vem depois do gráfico, abaixo da primeira tela. Há um **defeito visível**, o bloco "Por instituição" não desenha as barras. O único gráfico de tendência fica com rótulos de **6 px no celular** e só responde a mouse. No tablet com toque, as barras de "Por grande área" medem **29,6 px** de altura.

## Nota

| # | Heurística | Nota | Problema principal |
|---|---|---|---|
| 1 | Visibilidade do status | 3 | Períodos, subtítulos e "vs. período anterior" ajudam. Faltam n por ponto, aviso de amostra pequena e distinção entre "nunca respondeu" e "nada neste período". O heatmap ignora o filtro (avisado só em texto de 13 px). |
| 2 | Linguagem do usuário | 3 | "pp", "Q1–Q4", "Onde focar" e "período de 2 dias" são jargão. DESIGN.md promete evolução **semanal**; o padrão de 30 dias agrupa de 2 em 2 dias (`perf.js:106`). |
| 3 | Controle e liberdade | 2 | Período, origem e drill vivem só em memória (`MQ.perf`) e somem ao recarregar. O ⋯ só tem a ação destrutiva (`perf.js:121`). Voltar do drill funciona. |
| 4 | Consistência | 2 | Duas famílias de barra (`.bar-row` e `.hbar .bar`), só uma renderiza. Alvos de 44 px no celular e 29,6 px no tablet com toque. Limiares de vermelho diferentes: 60% (Pontos fracos), 55% (instituição), `xSplit` 60. |
| 5 | Prevenção de erros | 3 | "Excluir histórico" tem confirmação, mas DESIGN.md pede confirmação **digitada** e o código usa o confirm simples (`perf.js:123`). A exclusão vale para todos os aparelhos. |
| 6 | Reconhecimento | 2 | Bolhas por letra A–F exigem olhar a tabela embaixo. Q1–Q4 a 22% de opacidade. Data do heatmap só em `title`. |
| 7 | Flexibilidade | 2 | Tab chega a barras, bolhas e botões (24 paradas por padrão, 32–33 com "Onde focar" aberto), mas linha e heatmap não têm teclado. Sem CSV (prometido). Sem atalho de período. |
| 8 | Minimalismo | 2 | 4 KPIs + 8 painéis, 6 botões iguais, "Dias estudados" em três lugares (KPI "26/30", heatmap "79 dias" e legenda). Bolhas duplicam Pontos fracos. |
| 9 | Recuperação de erros | 3 | Estado vazio com CTA primário é bom. Tela de erro genérica de `app.js:42` serve. |
| 10 | Ajuda | 2 | Legenda dos quadrantes escondida num `<details>`. "mínimo de 5 respostas" só em subtítulo. Um KPI gasta a linha de apoio com explicação fixa. |
| **Total** | | **24/40** | **Aceitável** |

## Veredito de especificidade

**Parcialmente autoral, quase um template de dashboard.** Autoral: números em `--navy` tabulares, rótulo eyebrow em caixa alta, índigo só como ação e acento, subtítulos que explicam cada bloco ("cada resposta conta, mesmo ao refazer"). Intercambiável: fileira de 4 cartões iguais (o "hero metric"), barras todas da mesma cor índigo que não dizem nada sobre o valor, linha com pontos padrão, heatmap de "contribuições" e bolhas com quadrantes Q1–Q4, herança do app antigo que não está em PRODUCT.md nem em DESIGN.md. Nada lembra o "pulso que vira check" da marca nem o norte "caderno de quem treina todo dia".

**Detector (`impeccable detect --json www`):** 63 achados (exit 2), todos em `app.css` (62) e `index.html` (1). **`perf.js` e `charts.js` deram 0.** Regras: `design-system-font-size` 41, `design-system-radius` 12, `design-system-color` 9 (as três são `advisory`, medem aderência ao DESIGN.md e não defeito) e `low-contrast` 1. Na superfície Desempenho: `app.css:466` (12 px, real, mas o problema maior é o SVG a 0,5×), `:469` (`.quad`, real: 1,36:1), `:481` (`.path` 12,5 px, real), `:458/:461/:462/:475/:782` (raios, estéticos). Falsos positivos para esta tela: `.big-pct` 3rem (só o Resultado do simulado usa), o `low-contrast "index.html:0"` (é o `kbd.hint` do rail, 2,33:1 claro e 2,52:1 escuro, real na navegação do PC, não no conteúdo) e cerca de 45 achados de modal, marca-texto, login, Início e Resolver. **Falsos negativos:** o detector não sinalizou os textos de 11 px (`.pk .mk` `:924`, `.heat-legend` `:933`, rail) nem as barras de instituição sem altura.

## Concordâncias entre as duas avaliações

- Barras de "Por instituição" invisíveis: A viu na captura, B mediu `barH=0, iH=0` nos 6 combos.
- Gráfico de Evolução escalado: A calculou 6 px no celular, B mediu escala 0,5 (6 px), 0,67 no tablet (8 px) e 0,977 no PC (11,7 px).
- Linha sem teclado e tooltip só por mouse (`charts.js:167,176`): ambas. B achou o toque inconsistente entre dois testes (funciona só pelos eventos de mouse emulados, sem dispensa explícita).
- Alvos do tablet com toque: A mediu 29,6 / 32 / 40 px, B 29,6 × 7 barras, `#p-more` 54×40, selects 40. As duas apontam a regra de 44 px que não cobre `button.bar-row`, `select` e `#p-more`.
- Sem ação principal: A pelo critério do produto, B pela posição (primeiro "Treinar 20" em y=937, 1,11 tela; "Lista/Simulado com as erradas" a 94–95% da página).
- Quadrantes Q1–Q4 a ~1,3:1; heatmap com níveis 1–2 abaixo de 3:1; bolhas sobrepostas no celular; tabela de "Onde focar" cortada.
- O que só uma viu: A achou amostra pequena virando ruído, estado vazio genérico, menu ⋯ sem CSV, ordem dos painéis, delta cru e a ausência de tendência nos simulados. B achou o foco coberto pela barra inferior (sem `scroll-padding`), o `aria-label` das barras escondendo o valor, as 8 `<section>` sem nome acessível, o vermelho e o verde indistinguíveis por claridade (1,23:1) e `--font-scale` que não altera esta tela.
- Divergência de alvo no tablet: as duas concordam com toque emulado; vale a medição com `pointer: coarse`, que é o uso real.

## O que existe versus o prometido

| Promessa (PRODUCT.md / DESIGN.md) | Estado |
|---|---|
| Período 7/30/90/tudo e origem banco/listas/simulados | Existe, como 2 selects. Período tem 8 opções; origem cresce com listas/simulados. Não persiste. |
| 4 números: questões, acerto, tempo médio, dias estudados | Existe, com delta vs. período anterior em 3 deles. |
| Evolução semanal | Existe, mas o bucket varia (1 d, 2 d, 7 d); 30 dias = "período de 2 dias". Rótulos de 6 px no celular. |
| Tempo médio | Só KPI. Sem tempo por tema nem tendência. Exclui >600 s e nulos sem avisar (`perf.js:80`). |
| Pontos fracos com Treinar | Existe (mínimo 5 respostas, 6 itens). Vem depois da Evolução e sem primário. |
| Acerto por grande área com drill até subtema | Existe. Barras de uma cor, sem ação no último nível. |
| Por instituição | **Sem barras** (P1-2). Top 8, sem filtro nem drill. |
| Heatmap | Existe, 26 semanas, ignora filtros, dados só em `title`, sem foco nem toque. |
| Histórico de simulados | Lista de até 6 no período; sem evolução nem comparação. |
| Comparação com período anterior | Só nos KPIs. Não existe em "Todo o histórico". |
| Menu ⋯: exportar CSV, zerar com confirmação digitada | **Falta o CSV**; zerar usa confirm simples. |
| Alvos de 44 px (celular e tablet) | Celular ok (menu ⋯ e células do heatmap fora). **Tablet com toque falha.** |
| Certa e errada nunca só pela cor | Percentual baixo (`.pct.low`) só muda de cor. Barras de uma cor. |
| Contraste ≥ 4,5:1 | Texto ok. Marcas: trilho 1,22/1,09, heatmap 1,29–2,3, grade 1,45/1,29, Q1–Q4 ≈1,3. |
| Leitura mínima de 15 px | 91% dos nós de texto do celular abaixo de 15 px; 12 abaixo de 12 px. |
| CLAUDE.md: "subtelas novas e simulado de revisão sumiram; `multiLineChart` sem uso" | Confirmado: sem subtelas, sem simulado de revisão (só "Simulado com as erradas"), `multiLineChart` morto (`charts.js:97`). "Onde focar"/Q1–Q4 e "Lista/Simulado com as erradas" são do app antigo e não estão no DESIGN.md. |

## Pontos fortes

1. **Comparação com o período anterior nos KPIs** (`perf.js:84-91,101-103`). Delta com sinal e unidade (`+12 pp`, `−2 s`), mesmo tamanho de janela imediatamente anterior, omitido quando não existe. É a promessa mais bem entregue.
2. **Drill "Por grande área" até o subtema.** Migalha com Voltar de 44 px no celular, 4 níveis, `aria-label="Detalhar X"`, alternância "% de acerto | Total de respostas" com `aria-pressed`. Testado em 3 níveis nos 3 formatos.
3. **Base de acessibilidade.** Contraste de texto sem falhas, Tab previsível, anel âmbar visível (`#B45309` 5,02:1 no claro, `#FBBF24` 10,85:1 no escuro), bolhas com `tabindex=0` e `aria-label` com os números, números tabulares, h1 → h2 sem saltos, movimento reduzido respeitado. Sem rolagem horizontal em nenhum estado, sem erro de console, render em 65–90 ms.

## Problemas prioritários

### P1 (corrigir antes do lançamento)

**[P1-1] Sem ação principal; "o que faço agora?" não é respondido**
- Onde: `perf.js:106-107` (Evolução antes de Pontos fracos), `perf.js:174` (6× "Treinar 20"), `perf.js:115` (Lista/Simulado com as erradas no fim). Os 3 formatos, claro e escuro.
- Medido: com dados, `.btn.primary` = 0. No celular a primeira tela (844 px) mostra título, 2 selects (≈230 px, 27%) e KPIs; o gráfico começa em y≈1180, o primeiro "Treinar 20" em y=937 (1,11 tela) e "Lista/Simulado com as erradas" em y=2911/2963 de 3108. Página de 3108 px (3,7 telas); 2855–3108 conforme o estado.
- Por que importa: PRODUCT.md exige uma ação principal por tela e DESIGN.md manda ordenar "do mais acionável ao mais histórico". Hoje a ordem é histórico → ação. A persona do residente leva da tela "estou em 76%", não "estudo Ginecologia amanhã".
- Correção: faixa no topo "Seu ponto mais fraco: Pneumonia, 38%" com **um** botão primário "Treinar 20". Pontos fracos sobe para antes da Evolução. Os outros 5 viram link ou chevron, sem botão cheio. "Lista/Simulado com as erradas" vai para o ⋯ ou sai (duplica o caderno de erros automático). No celular, o primário fixo acima da barra (DESIGN.md: "ação principal fixa acima da barra").
- Comando: `/impeccable layout`, depois `/impeccable clarify`.

**[P1-2] "Por instituição" não desenha as barras**
- Onde: `perf.js:191` gera `<div class="bar"><i style="width:N%">`. O CSS de `.bar` só existe sob `.hm-card .bar` (`app.css:765`) e `.qh-card .bar` (`:711`); para `.hbar .bar` há só `grid-column` (`app.css:791`). Os 3 formatos, claro e escuro.
- Medido: `.hbar .bar` com altura 0 e fundo transparente, `<i>` com altura 0 e largura 0, nos 6 combos. A classe `.err` (<55%) nunca aparece.
- Por que importa: é uma promessa do DESIGN.md entregue como lista de números. Nos outros blocos o estudante lê comprimento de barra; aqui não.
- Correção: mover as regras de `.bar` para um seletor compartilhado (trilho `--sunk` de 8 px, preenchimento `--accent`, `.err` com `--err` e ícone) ou reusar `.bar-row`/`.bar-track`.
- Comando: `/impeccable polish`.

**[P1-3] Gráfico de Evolução ilegível no celular e só por mouse**
- Onde: `charts.js:141` (`W = 640` fixo, `viewBox` escalado), `charts.js:167` e `:176` (só `mousemove`/`mouseleave`), `app.css:466` (texto 12 px). Os 3 formatos.
- Medido: escala 0,50 no celular, então eixo, datas e o "76%" final ficam com **6 px**; 8 px no tablet; 11,7 px no PC. Pontos de 4,5 viram raio de 2,25 px. O `<svg>` tem `role="img"` e `aria-label="Evolução do percentual de acerto"` sem nenhum dado, e a linha tem 0 elementos focáveis. No toque o tooltip só aparece pelos eventos de mouse emulados, sem fechamento definido (resultado inconsistente entre dois testes).
- Por que importa: é o único gráfico de tendência e é inacessível exatamente no uso principal (celular com uma mão) e para quem não usa mouse. PRODUCT.md fixa 15 px para leitura.
- Correção: calcular `W` a partir de `container.clientWidth` (como `bubbleChart` já faz em `charts.js:38`) para manter 12–13 px reais. Pontos focáveis ou uma `<table>` equivalente oculta, com `aria-label` por ponto. `pointerdown` no lugar de `mousemove`. Legenda em texto: "de 62% (início) a 76% (hoje)".
- Comando: `/impeccable adapt`, depois `/impeccable harden`.

**[P1-4] Alvos abaixo de 44 px no tablet com toque (861–1199 px)**
- Onde: a regra de 44 px de `app.css:987` (grupo `pointer: coarse`) não inclui `button.bar-row`, `.btn.sm` do drill, `#p-more` nem `select`. `app.css:939` (`min-height: 40px`) vem depois e a anula para `.weak-list .btn.sm` e `.perf-actions .btn`. `button.bar-row` só recebe 40 px em `pointer: fine` ≥861 px (`app.css:981-983`).
- Medido a 960×640, toque: `button.bar-row` ×7 de **29,6 px** de altura (largura 429), "Voltar" do drill 86,7×32, `#p-more` 54×40, `select#p-period` 170×40, `select#p-origin` 520×40, `input#p-from`/`#p-to` 40. No celular tudo ≥44 px, exceto o item "Excluir todo o histórico" do ⋯ (257×40), a bolha (42,4 px) e as células do heatmap (9,4 px, informativas).
- Por que importa: PRODUCT.md dá 44 px para "celular e tablet" e as barras de área são o principal gesto da tela ("Toque numa barra").
- Correção: `@media (pointer: coarse), (max-width: 860px)` cobrindo `button.bar-row`, `.btn.sm`, `select`, `.popmenu button` e `#p-more`; apagar `app.css:939`.
- Comando: `/impeccable adapt`.

### P2 (próxima rodada)

**[P2-5] "Onde focar": bolhas sobrepostas, quadrantes quase invisíveis, legado fora do DESIGN.md** (`perf.js:113,235`, `charts.js:63-64`, `app.css:469`). Rótulos Q1–Q4 a `opacity .22` (1,36:1 / 1,37:1). No celular 8 pares de 7 bolhas se sobrepõem, 5 com o centro dentro de outra, e a letra some. Tocar na bolha faz drill na hora (`it.onClick`), então o tooltip nunca é visto no toque. A tabela (`perf.js:238`) rola dentro do card (406–441 px em ~320 px) e perde a coluna "Quadrante". Fica fechada no fim da página, duplica Pontos fracos e a legenda dos quadrantes está dentro do `<details>`. Decidir se fica; se ficar, lista ordenada no celular e legenda fora do `<details>`. `/impeccable distill`.

**[P2-6] Amostra pequena vira ruído.** `perf.js:157` plota bucket com 1 resposta como 0%/100% (no esparso a linha despenca de 100% a 0% e volta). `perf.js:189-191` mostra "ENARE 100% · 1". "100% (8/8)" parece tão sólido quanto "79% (140/177)". Só Pontos fracos tem mínimo (`MIN_WEAK = 5`, `perf.js:5`). Definir n mínimo e estilo tracejado/cinza com "poucas respostas". `/impeccable harden`.

**[P2-7] Estado vazio igual para "nunca respondeu" e "nada neste período".** `perf.js:99`: "Se você já respondeu, tente um período maior" é errado para o usuário novo. Os filtros ficam acima do vazio, o CTA está a 35–50% da altura e não na zona do polegar, e não mostra o que vai aparecer. Quando `MQ.alive('attempts')` está vazio: estado de onboarding ("Responda 10 questões e aqui aparecem…") com "Sessão rápida de 10 questões" e sem filtros. `/impeccable onboard`.

**[P2-8] Menu ⋯ só tem a ação destrutiva e falta CSV.** `perf.js:121-128`. DESIGN.md: "exportar CSV, zerar histórico (confirmação digitada)". Há só "Excluir todo o histórico", com confirm simples (`perf.js:123`) e item de 40 px no celular. Um ⋯ cujo único item apaga tudo, em tela de leitura, convida ao toque acidental. Adicionar "Exportar CSV" antes, pedir que digite "excluir", item de 44 px. `/impeccable harden`.

**[P2-9] Heatmap: dados só em `title`, níveis indistinguíveis, ignora filtros.** `perf.js:111,195`, `home.js:172`, `app.css:782`. 180 de 182 células só com `title` (0 focáveis, sem toque). Células de 9,4 / 13,6 / 21,1 px. Contraste dos níveis contra o painel: 1,29 / 2,30 / 4,61 / 8,86 no claro e 1,28 / 2,49 / 4,79 / 7,72 no escuro; l0 contra l1 é 1,06:1 / 1,18:1, então "estudou pouco" e "não estudou" quase se confundem. 26 semanas contra 17 no Início (DESIGN.md), legenda a 11 px (`app.css:933`). Toque mostrando "03/08 · 20 questões" num rodapé, `aria-label` com resumo semanal, 17 semanas no celular. `/impeccable adapt`.

**[P2-10] Barras de área sem ênfase e sem saída no último nível.** `app.css:462`, `perf.js:215`. Toda barra é índigo: Ginecologia (61%) parece igual a Pediatria (80%). No nível folha não há "Treinar este tema". Marcar a pior com `--err` + ícone ou uma linha de meta; oferecer "Treinar 20 de [tema]". `/impeccable colorize`.

**[P2-11] Filtros: 27% da primeira tela no celular, "Datas específicas" silencioso, estado volátil.** `perf.js:96-98`, `perf.js:9`. Período (8 opções) e Origem (5–6 e crescendo, sem `optgroup`) são duas linhas cheias empilhadas; ficam a 16–25% da altura, fora do polegar. Com "Datas específicas" vazio o app mostra todo o histórico sem avisar. Nada persiste ao recarregar. Chips segmentados 7/30/90/Tudo com ⋯ para os outros, origem em `<optgroup>`, uma linha rolável, salvar a escolha. `/impeccable layout`.

**[P2-12] Painéis com vazio morto (PC e tablet).** `app.css:445` (`align-items: start`). No PC a Evolução termina em y=617 e a próxima linha começa em 779 (≈160 px mortos); idem sob "Por instituição". DESIGN.md: "cada coluna que sobra recebe um painel útil… nada existe só para preencher". `align-items: stretch` com o gráfico crescendo, ou Pontos fracos largo em cima. `/impeccable layout`.

**[P2-13] Tipografia abaixo do piso nos blocos de apoio.** 146 dos 160 nós de texto no celular (91%) abaixo de 15 px; 12 abaixo de 12 px. `.pk .mk` 11 px (`app.css:924`), `.pk .st` 12 px (`:927`), `.heat-legend` 11 px (`:933`), `.weak-list .path` .78rem = 12,5 px (`:481`), `.dl` 12 px, `.sub` 13,4 px, rail 11 px. O caminho "Obstetrícia › Pré-natal · 10 respostas" é texto de decisão e quebra em até 5 linhas numa coluna de 184 px. O `--font-scale` não altera esta tela. Piso de 13 px para apoio, 14–15 px para o caminho. `/impeccable typeset`.

**[P2-14] Acessibilidade dos gráficos e do re-render.** `charts.js:48,146`, `perf.js:93,118-120,173-174,215`. SVG da linha sem dados; heatmap com `aria-label` só com a contagem; seis botões com o mesmo nome "Treinar 20"; `aria-label="Detalhar X"` nas barras **esconde o valor** ("85% (58/68)") do leitor de tela; barras de instituição sem nenhum aria; tooltip `role="tooltip"` sem `aria-describedby`; 8 `<section>` sem nome acessível (0 regiões); 0 live regions e `MQ.render()` reescreve `root.innerHTML` a cada mudança de Período/Origem/visão, então o foco volta ao `body` (inferido do código, não medido). Usar `aria-label="Treinar 20 questões de Pneumonia"`, `<figcaption>` com uma frase de tendência por gráfico, `aria-labelledby` nas seções e restaurar o foco. `/impeccable harden`.

**[P2-15] Foco coberto pela barra inferior fixa no celular.** `app.css:176-186`, sem `scroll-padding`. Com `elementFromPoint`, 3 paradas de Tab no padrão (2× "Treinar 20" e "Simulado com as erradas") e 7 com "Onde focar" aberto ficam sob a barra. Adicionar `scroll-padding-bottom` igual à altura da barra. `/impeccable harden`.

**[P2-16] Comparação com período anterior: delta cru e só nos KPIs.** `perf.js:90,101`. "+236 vs. período anterior" não diz "questões" nem a base; o verde de "−2 s" (tempo menor é bom) com sinal "−" confunde; sem ícone ↑/↓. Verde `#1F7A4D` e vermelho `#B3261E` têm 1,23:1 de luminância (1,11:1 no escuro), indistinguíveis por claridade. Pontos fracos, instituição e simulados não comparam nada. "+236 questões (30 d antes: 201)" e seta com texto. `/impeccable clarify`.

**[P2-17] Histórico de simulados sem tendência.** `perf.js:196-200`. Lista de no máximo 6 do período, sem gráfico de nota, sem "ver todos", sem comparação com a tentativa anterior. Vazio em 7 dias mostra só o último. Mini-gráfico de notas, delta e link para Listas › Simulados. `/impeccable layout`.

**[P2-18] Percentual baixo só por cor.** `.pct.low` (`perf.js:174`, `app.css:845`) difere do normal só pela cor (2,09:1 claro, 1,66:1 escuro contra o navy), sem ícone nem texto. PRODUCT.md: certo/errado nunca só por cor. Ícone ▼ + "abaixo da meta" ou o estado na ordem. `/impeccable polish`.

**[P2-19] Nome longo truncado sem alternativa em toque.** `app.css:460`, `perf.js:215`. "Saúde Coletiva, Epidemiol…" trunca (coluna `.lbl` de 106 px no celular, 185 px no PC) e o nome completo só aparece no tooltip de hover. Quebrar em 2 linhas em vez de `text-overflow`. `/impeccable adapt`.

### P3 (polimento)

- **[P3-20]** Código morto: `MQ.multiLineChart` (`charts.js:97-136`) sem uso; `.weak-list li` e `.bar-track` duplicados (`app.css:479,929` e `:461,463`).
- **[P3-21]** Limiares de cor inconsistentes: Pontos fracos `<60` (`perf.js:172`), instituição `<55` (`perf.js:191`), `xSplit` 60 (`perf.js:235`).
- **[P3-22]** O subtítulo do KPI Acerto usa a linha de apoio com explicação fixa em vez de n; poderia ir para `title` e liberar espaço.
- **[P3-23]** "Dias estudados" aparece no KPI (26/30), na legenda do heatmap (79 dias) e em "Últimas 26 semanas"; consolidar.
- **[P3-24]** Tempos >600 s e `timeSec` nulo são descartados em silêncio (`perf.js:80`); o rótulo diz "em 365 respostas" sem avisar que ~15% não têm tempo.
- **[P3-25]** O gráfico de Evolução usa sempre eixo 0–100%; com dados entre 60% e 100% metade do espaço fica vazia.
- **[P3-26]** `kbd.hint` do rail a 2,33:1 (claro) e 2,52:1 (escuro) no PC, e rótulos do rail a 11 px: pertencem à navegação, não a esta tela.
- **[P3-27]** Layout shift de 0,0001 no PC, vindo de `span.lbl` (troca de fonte). Irrelevante.
- **[P3-28]** Texto da frase final da tela ("Lista/Simulado com as erradas") sem frase que explique o que cada um faz.

## Carga cognitiva

Falham 4 dos 8 itens: **foco único** (sem primário, P1-1), **escolhas no ponto de decisão** (Período 8 opções, Origem 5–6 e crescendo, 6× "Treinar 20", 8 instituições, 4 KPIs + 8 painéis), **hierarquia visual** (8 painéis e 4 barras de mesmo peso, sem destaque para pior/melhor) e **memória de trabalho** (letra da bolha ↔ nome na tabela; Q1–Q4 ↔ legenda escondida). Passam: agrupamento, blocos, uma coisa por vez (filtros no topo) e divulgação progressiva ("Onde focar" fechado). Carga **moderada a alta**. Elementos interativos sem rolar: 9 (celular), 10 (tablet), 17 (PC com rail).

## Jornada emocional

- **Abertura:** 4 números grandes com deltas verdes acolhem; o título repete a promessa.
- **Meio:** o gráfico de evolução, onde mora a motivação, vem depois dos filtros e some em texto de 6 px.
- **Pico:** a descoberta ("Pneumonia 38%") está abaixo da dobra e sem peso.
- **Fim:** acaba em "Lista com as erradas / Simulado com as erradas", dois botões neutros depois de 8 painéis, sem uma frase do que fazer.
- **Novo usuário:** o vazio tem bom tom, mas culpa o período.

## Bandeiras vermelhas por persona

- **Casey (distraída, uma mão, celular):** filtros no topo, fora do polegar. Seis botões iguais, sem um "faça isto". Barras de área de 29,6 px no tablet. O gráfico não se lê (6 px). Menu ⋯ no topo com uma única opção destrutiva. Foco coberto pela barra inferior. A favor: 44 px no celular, KPIs grandes, barra inferior na zona do polegar.
- **Alex (teclado, PC):** 24 a 33 paradas de Tab antes de sair da página. Linha e heatmap sem teclado. Seis "Treinar 20" idênticos. Sem atalho de período nem CSV. Foco volta ao `body` a cada mudança de filtro. A favor: anel âmbar visível, bolhas focáveis com tooltip no foco, Enter faz drill.
- **Sam (acessibilidade):** SVG sem dados, heatmap por `title`, `aria-label` das barras sem o valor, rótulos de 6–11 px, Q1–Q4 a 22%, 0 regiões nomeadas, 0 live regions, verde/vermelho indistinguíveis por claridade. A favor: contraste de texto 4,5:1 em todos, `aria-pressed` correto, `role="group"` no segmentado, h1 → h2 sem saltos.
- **Residente estudando para a prova (persona do projeto):** quer saber onde melhorar amanhã. Os pontos fracos existem e têm "Treinar", mas aparecem tarde; com 5 respostas um tema já entra; o drill termina sem ação; a comparação some nos blocos; "Por instituição" não mostra barras. Leva da tela "estou em 76%".

## Perguntas para considerar

1. Se a tela existe para dizer onde errar menos, por que o melhor dado (o tema mais fraco) é o segundo bloco e o mesmo botão se repete seis vezes?
2. Um gráfico de 640 px encolhido para 320 px ainda é um gráfico no celular, ou só uma foto dele?
3. "Onde focar" com quadrantes e bolhas resolve algo que "Pontos fracos" já não resolve com uma frase?
4. A linha de evolução poderia ser a linha de pulso do logo, com o último ponto virando check quando a meta é batida?
5. Quando o estudante tem 6 respostas, o que a tela promete e entrega? Vale mostrar "0%" ou o quanto falta para ficar confiável?

## Plano sugerido

1. `/impeccable polish`: P1-2 (barras da instituição, 1 regra de CSS), P2-18.
2. `/impeccable layout` + `/impeccable clarify`: P1-1 (faixa "ponto mais fraco" + um primário), P2-11, P2-12, P2-16, P2-17.
3. `/impeccable adapt` + `/impeccable harden`: P1-3 (gráfico responsivo e acessível), P1-4 (44 px no tablet), P2-8, P2-9, P2-14, P2-15, P2-19.
4. `/impeccable onboard`: P2-7. `/impeccable distill`: P2-5.
5. `/impeccable typeset`, `/impeccable colorize` e `/impeccable polish`: P2-10, P2-13 e o P3.

## Limitações

- Sem leitor de tela real (NVDA/VoiceOver) nem toque físico; "celular" e "tablet" são emulação de Chromium headless com `hasTouch`. O tablet foi avaliado só em 960×640 e o celular só em retrato. O tooltip por toque deu resultado inconsistente entre dois testes.
- Dados sintéticos (1020–1033 respostas, 6–7 áreas, 6–7 instituições, 3–4 simulados). Não testei 50+ listas/simulados (o select de origem pode ficar enorme), anos de histórico nem temas com nomes muito longos além dos exemplos.
- O login Google foi bloqueado de propósito (script abortado): sincronização, restauração do Drive e o efeito de mesclagem no gráfico não foram vistos. O gate foi vencido gravando estado local, sem editar arquivo.
- Contraste de marcas SVG calculado por cores computadas e `opacity` (aproximação para `.quad` e `.bubble`); não medi o tooltip nem anéis de foco sobre cada marca; sem simulação de daltonismo, só razão de luminância.
- Não confirmei a exclusão do histórico (só abri o menu) nem os modais "Criar lista/Simulado com as erradas". O "Treinar 20" abriu `#/resolver`, mas a tela de destino não foi avaliada.
- Tempo de render medido no localhost sem throttling; em celular real será maior. Service worker bloqueado (offline não testado). Zoom do navegador a 200% e rotação do celular não foram exercitados. `D14` (foco ao re-renderizar) é inferido do código.
- `app.css` e `auth.js` têm alterações não commitadas; as medições refletem a árvore de trabalho atual.
