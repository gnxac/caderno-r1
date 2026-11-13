# Crítica de design: Simulado em andamento e Resultado (Pulse)

Data: 2026-11-13 · Nota: **24/40 (Aceitável)** · P0: 0 · P1: 5 · P2: 12 · P3: 8

**Método:** dual-agent. A é a revisão de design e B é o detector com medições em Playwright headless. Rodaram isolados e sem ver o resultado um do outro, em 390×844 (toque), 960×640 e 1440×900, em claro e escuro, nos estados: simulado recém-iniciado, no meio (respondidas, marcadas e em branco), cartão-resposta, confirmação de Finalizar, tempo quase no fim e esgotado, Resultado (nota alta e baixa) e revisão pós-prova. Referência: `PRODUCT.md` ("toda tela responde o que faço agora?" e "leitura longa e uso com uma mão") e `DESIGN.md`. Nenhum arquivo do projeto foi alterado e nenhum snapshot foi gravado em `.impeccable/critique/` (pedido: não editar nada). Não houve overlay no navegador do usuário (o live-server injetaria no HTML e abriria janela). Capturas e dados brutos ficaram no scratchpad da sessão (`A\` e `B\`).

Alvo: `MQ.views.simulado` e `MQ.views.resultado` em `www/js/sim.js`, `www/css/sim.css`, trechos de `app.css` e a revisão pós-prova (que reaproveita o Resolver).

## Resumo

Não há P0: em nenhum fluxo testado o estudante deixa de conseguir fazer a prova, finalizar e ver o resultado. A **prova em andamento é a melhor parte** (modo prova bem isolado, polegar bem servido, estado que sobrevive a recarregar). O **fim da jornada é o mais fraco**: o Resultado é uma parede de números sem veredito, sem ✓/✗ e sem ação principal ao alcance, e as saídas da prova (voltar, tempo esgotado) têm falhas reais. O momento de maior esforço do estudante termina na tela menos acolhedora do app.

## Nota

| # | Heurística | Nota | Problema principal |
|---|---|---|---|
| 1 | Visibilidade do status | 2 | Relógio sem rótulo (restante ou decorrido?). No celular a contagem de respondidas some (`sim.css:18`) e o botão diz "Cartão 5/12" (posição, não progresso). O timer sai da tela ao rolar. |
| 2 | Linguagem do usuário | 3 | "Finalizar", "Cartão-resposta" e "Marcar para revisar" são claros. DESIGN.md diz "Entregar". "Cartão 5/12" confunde. |
| 3 | Controle e liberdade | 2 | O Voltar do navegador prende no Resultado (laço de hash) e sai da prova sem confirmar, enquanto a seta da tela pergunta. Sem pausa e sem aviso antes de iniciar. |
| 4 | Consistência | 3 | Alternativas, tesoura, fonte e marca-texto iguais ao Resolver. Dois botões índigo cheios no celular (Finalizar no topo, Próxima embaixo). Atalho do cartão é `Shift+C` contra `C` no DESIGN.md. |
| 5 | Prevenção de erros | 3 | Finalizar tem confirmação que conta as em branco e fica longe do polegar (bom). Não conta as marcadas. A última resposta pode se perder se a aba recarrega em menos de 250 ms. |
| 6 | Reconhecimento | 2 | Cartão-resposta sem legenda. Ícones A↓, A↑ e bandeira sem texto. No Resultado a célula mostra só cor e a letra do usuário, não a certa. |
| 7 | Flexibilidade | 2 | PC tem `A–E`, `M`, setas e `Ctrl+Enter`. Mas o foco vira `BODY` depois de cada escolha, são ~16 paradas de Tab por questão e o `?` não lista nada do simulado. |
| 8 | Minimalismo | 3 | A prova é limpa. O Resultado empilha 5 botões + 4 cartões (1595 px de rolagem no celular). |
| 9 | Recuperação de erros | 2 | Tempo esgotado = redirecionamento imediato + toast de 3,2 s. Um modal aberto nessa hora fica sobre o Resultado. A revisão mostra "Resposta errada!" e um placar que contradiz o simulado. |
| 10 | Ajuda | 2 | A dica "Teclas A–E…" some assim que há resposta e aparece até no celular. Não há briefing antes de iniciar (sem pausa, o que acontece ao zerar). |
| **Total** | | **24/40** | **Aceitável** |

## Veredito de especificidade

**Parcialmente autoral.** A prova tem assinatura do produto: enunciado e alternativas em Literata, letra em círculo, tesoura sempre visível, índigo só em ação, cartão-resposta com número + letra dentro do círculo, barra do app removida (`body.in-sim`). O **Resultado é intercambiável**: um "17%" preto grande, uma lista Certas/Erradas/Em branco, barras por área e cinco botões iguais; serviria a qualquer app de cursos. 75% e 25% têm o mesmo visual. O cronômetro é uma pílula cinza genérica, sem rótulo.

**Detector (`impeccable detect --json`):** 63 achados em `www` (exit 2), todos em `www/css/app.css` (62) e `www/index.html` (1). **Nenhum em `sim.js` nem em `sim.css`** (`detect` deu 0 nos dois). Regras: `design-system-font-size` 41, `design-system-radius` 12, `design-system-color` 9 (todos avisos de desvio de token, não defeitos de uso) e `low-contrast` 1. Os de componentes compartilhados da prova no `app.css` (`.toast` :235, `.modal` :245, `.btn.big` :277, `.qcode` :353, `.alt .share` :387, `.badge` :433, `.big-pct` :452, `.bar-row` :458-462, `mark.hl` :514-521, `kbd` :657) são todos desse tipo. As cores hex de `mark.hl` são do marca-texto e intencionais. O `low-contrast` (`#717187` sobre `#0f0f18`, 4,0:1, em `index.html`) é o rail e o `kbd.hint`: falso positivo no exame (o rail fica oculto) e verdadeiro no Resultado a partir de 861 px, onde a medição real foi 2,33:1 no claro e 2,52:1 no escuro (o detector trata a `opacity` .55 de outro jeito). Os outros 40 achados são de outras telas.

## Concordâncias entre as duas avaliações

- Voltar preso no Resultado: A e B reproduziram o laço de forma independente.
- Certa e errada só por cor no cartão do Resultado e nas alternativas da revisão: A pelo visual, B pelo DOM (`.sc.ok`/`.sc.bad` só com "1A"/"4E", `.alt.right` sem SVG).
- Timer, Finalizar e ação de avançar fora do alcance: A pela zona do polegar, B pela posição medida (`.solve-bar` estático, timer em top −422 com scroll 500).
- Foco perdido para `BODY` após responder e atalhos incompletos: ambas.
- Alvos <44 px em botões auxiliares e bordas de baixo contraste: B mediu, A confirmou no tablet.
- O que só uma viu: A achou o tablet em paisagem sem Próxima fixo, o cartão como modal centrado (não "por baixo"), o Resultado sem veredito e a perda de resposta em <250 ms. B achou o modal aberto sobrevivendo à expiração, a ausência de focus trap e a Próxima desabilitada sem Finalizar à mão na última questão.
- Divergência de medida: B mede alvos de 44–48 px no tablet porque não emulou toque em 960×640; A emulou toque e achou 40 px (`#sim-flag`, `#q-fplus`, botões do confirm). Vale a medição com toque, que é o uso real de tablet.
- Linha do enunciado a 1440: A mediu até 74 caracteres, B média de 76,9 (máx. 84). As duas passam de ~68.

## O que existe versus o prometido

| Promessa (PRODUCT.md / DESIGN.md) | Estado |
|---|---|
| Modo prova: sem estatísticas nem navegação | Existe. A barra do app some, só relógio, cartão-resposta e questão. PC e tablet mostram "x/12 respondidas"; o celular não. |
| PC e tablet: questão \| cartão-resposta; celular: abre por baixo | Meio. Painel lateral ≥861 px. No celular é modal centrado, não "por baixo", e no escuro quase some contra o fundo. |
| Certa `--ok-soft`, errada `--err-soft`, atual `--accent`, marcada com contorno `--doubt` | Círculos de 44 px (DESIGN.md diz 30 px). Atual usa borda `--navy`, não `--accent`. |
| Certa e errada nunca só por cor (✓ e ✗) | **Falta** no cartão do Resultado e nas alternativas da revisão. |
| Atalhos `M`, `C`, `Ctrl Enter` | `M` e `Ctrl Enter` ok. O cartão é `Shift+C` (`C` é a alternativa C). O `?` não lista nenhum. |
| Ação grande: pílula de 48 px, "Entregar" | Não. Botão de 44 px, canto de 8 px, rótulo "Finalizar", no topo. |
| Concluído "com nota, data e tempo" | O Resultado mostra os três. Em Listas, só "Nota X%". |
| Primeiro o simulado em andamento, com tempo restante | Não. Aparece por último e sem tempo (achado da crítica anterior, ainda vale). |
| Revisão pós-prova | Existe, mas reusa o Resolver com banner, relógio e placar sem sentido. |
| Alvos de 44 px (celular e tablet) | Celular ok. Tablet com toque: 40 px em bandeira, A−/A+ e confirm. |
| Linha do enunciado ~68 caracteres, mínimo 15 px | PC passa (74–77). Escala 0,8 dá 13,6 px (`solve.js:293`). |
| Contraste ≥ 4,5:1 nos dois temas | Texto ok (relógio 13,9, muted 5,4–5,9, Finalizar 8,9 e 7,4). Falha em `kbd.hint` e nos contrastes não textuais. |
| Números tabulares no cronômetro e no cartão | Ok. |

## Pontos fortes

1. **Modo prova bem isolado.** A barra do app some, o cartão-resposta tem círculos de 44 px com a letra marcada dentro, o tempo por questão é gravado e o Resultado traz "As 5 que mais demoraram" e a tabela de tentativas a partir da 2ª prova.
2. **Zona do polegar no celular.** Cartão e Próxima ficam numa barra fixa de 48 px a 10 px da borda inferior, com área segura respeitada. Todos os alvos da prova (tesoura, bandeira, Finalizar, células) medem 44 px ou mais, e Finalizar fica longe do polegar de propósito.
3. **Robustez.** Recarregar no meio mantém rota, questão atual, respostas e marcas; o tempo restante vem de `startedAt` e continua correndo (33:55 virou 33:52). Sem rolagem horizontal em 72 combinações, sem erro de console. Contrastes de texto sólidos nos dois temas. `aria-label` completo nas células ("Questão 5, respondida, letra D, marcada para revisar").

## Problemas prioritários

### P1 (corrigir antes do lançamento)

**[P1-1] Resultado sem veredito, sem ✓/✗ e sem ação principal ao alcance**
- Onde: `sim.js:374-390`, `sim.js:197-207`, `sim.css:51-53`, `app.css:451-455`. Os 3 formatos, claro e escuro; pior no celular.
- Problema: a nota é preta e igual para 25% e 75%. O cartão final distingue certa de errada só por cor + a letra do usuário (`.sc.ok`/`.sc.bad` com "1A"/"4E", sem ícone nem legenda). Há cinco botões de mesmo peso no topo (Listas, Criar lista com os erros, Refazer, Revisar só as erradas, Revisar questões); no celular o primário é o 3º, a 26% do topo (`#r-review` y 220–264). "Tempo usado" desalinha as duas colunas. "Tempo esgotado" só existe num toast. Repete o P1 da crítica de Listas e Simulados.
- Por que importa: PRODUCT.md pede uma ação principal por tela e "certa e errada nunca só pela cor". Daltonismo e tela ao sol tornam o cartão ilegível, e o estudante sai sem saber o que fazer com a nota.
- Correção: bloco de nota com anel + ✓/✗ e uma frase ("9 de 12 em 29 min. 2 erradas, 1 em branco"; se o tempo acabou, faixa "Tempo esgotado: 3 em branco"); comparação com a tentativa anterior; no celular "Revisar as erradas" fixo na base (ou "Revisar questões" se não houver erro) e o resto em ⋯; ícone ✓/✗ nas células do cartão; mostrar também a letra certa.
- Comando: `/impeccable layout`, depois `/impeccable clarify`.

**[P1-2] Botão Voltar preso no Resultado**
- Onde: `sim.js:219`, `:308`, `:317` (`location.hash = '#/resultado/…'`). Os 3 formatos.
- Problema: cada redirecionamento empilha uma entrada. Depois de Finalizar ou de o tempo acabar, 3–4 toques em Voltar continuam em `#/resultado/<id>` (histórico 6 e 11 nas duas medições), porque o Voltar cai na rota do simulado, que empurra o Resultado de novo. No Android o botão físico usa `history.back()` (`app.js:77`), o mesmo laço. O estudante só sai pelo botão "Listas".
- Por que importa: liberdade de saída; um app instalado em que o Voltar não funciona parece quebrado.
- Correção: `location.replace('#/resultado/' + run.id)` nos três pontos, para a rota da prova sair do histórico.
- Comando: `/impeccable harden`.

**[P1-3] Fim do tempo abrupto, mudo e sem rastro; modal aberto sobrevive**
- Onde: `sim.js:313-323`, `app.css:415`, `sim.js:237` (`aria-live="off"`), `util.js:65-75`. Os 3 formatos.
- Problema: o relógio só muda de cor abaixo de 5 min e não anuncia nada; `.low` só entra 1 s depois do render. Ao zerar, a tela salta para o Resultado com um toast de 3,2 s. Se havia um modal aberto (cartão-resposta ou "Ainda há 7 questões em branco"), o `.modal-back` **não é removido** e fica sobre o Resultado, oferecendo "Finalizar" numa prova já encerrada. Se o usuário está em Listas quando o tempo acaba, o card segue "Em andamento / Continuar" (`run.status` continua `andamento`) até clicar.
- Por que importa: é a quebra mais brusca da prova e não explica o que aconteceu com as respostas. Para leitor de tela é o pior caso (tudo mudo).
- Correção: rótulo "restam" no relógio; avisos aos 10/5/1 min numa região `aria-live="polite"` separada, também com texto; ao zerar, fechar os modais e mostrar "Tempo esgotado. Suas N respostas foram salvas" com "Ver resultado"; ao abrir Listas, finalizar as provas vencidas e mostrar "Tempo esgotado · Ver resultado".
- Comando: `/impeccable harden`.

**[P1-4] Timer e Finalizar somem ao rolar; na última questão não há "terminar" à mão**
- Onde: `.solve-bar` é `position:static`; barra fixa `.sim-bar` só com Cartão e Próxima. Celular e tablet.
- Problema: com `scrollY` 500 em 390×844, o timer fica em top −422 e o Finalizar em −428; em 960×640 o timer fica em −483. Em enunciados longos o estudante perde o relógio justamente quando mais precisa dele. Na última questão a "Próxima" fica `disabled` (contraste 1,5:1) e é a única ação da barra inferior; o Finalizar existe só no topo.
- Por que importa: "o que faço agora?" na última questão não tem resposta visível; o tempo é a informação central de uma prova cronometrada.
- Correção: relógio compacto fixo no cabeçalho (ou dentro da barra inferior); na última questão trocar "Próxima" por "Finalizar" (pílula de 48 px, a ação que encerra a tela, como pede o DESIGN.md).
- Comando: `/impeccable layout`.

**[P1-5] Tablet (861–1199 px, toque): Próxima fora da tela e alvos de 40 px**
- Onde: `sim.css:20-31` esconde `.sim-bar` a partir de 861 px.
- Problema: em 960×640 o "Próxima" fica em y=655 numa tela de 640, e com questão longa o documento tem 1247 px: cada questão exige rolar para avançar. Bandeira, A−/A+ e botões do confirm medem 40 px contra o mínimo de 44 px do DESIGN.md para "celular e tablet".
- Por que importa: "uso com uma mão" vale para tablet também; tablets com toque são o caso de uso de simulado em casa.
- Correção: manter a barra fixa em `@media (pointer: coarse)` (ou `.qnav` sticky no rodapé) e 44 px de alvo com `pointer: coarse`.
- Comando: `/impeccable adapt`.

### P2 (próxima rodada)

**[P2-6] Foco perdido, sem focus trap e teclado incompleto** (`MQ.render()` recria o DOM)
- Depois de escolher alternativa, marcar ou cortar, `activeElement` vira `BODY` e o próximo Tab recomeça do topo; o mesmo ao tocar numa célula do cartão. São ~16 paradas de Tab por questão (5 alternativas + 5 tesouras). `role=radio` com `button` aninhado, todos com `tabindex=0`; `ArrowRight` num radio troca de questão e `ArrowDown` não move. Os modais têm `aria-modal` mas **sem focus trap** (no confirm, Tab sai de Finalizar para o fundo, que ainda rola) e o `?` não lista `A–E`, `M`, `Shift+C` nem `Ctrl+Enter`. PRODUCT.md exige teclado completo. Correção: devolver o foco ao elemento ativo após o render, tabindex roving com setas, tesouras com `tabindex=-1` (`Shift+letra` anunciado), trap nos modais, seção "Simulado" no `?`. `/impeccable harden`.

**[P2-7] Janela de perda de resposta.** `save()` → `MQ.put` → `MQ.touch` com debounce de 250 ms (`db.js:93-96`, `sim.js:255`), sem flush em `pagehide`. Clicar numa alternativa e recarregar logo em seguida voltou com `answers: {}` (testado por A). PRODUCT.md: "nenhum histórico se perde". Correção: `MQ.saveNow()` no `save()` do simulado e em `pagehide`/`visibilitychange`. `/impeccable harden`.

**[P2-8] Relógio sem rótulo e progresso escondido no celular** (`sim.js:237-238`, `sim.css:18`). Ícone + "36:00" sem "restam"; `role="timer"` sem `aria-label`; "x/12 respondidas" some e o botão mostra a posição. Correção: `aria-label="Tempo restante 36:00"` e "respondidas" no botão da barra ("Cartão · 6/12"). `/impeccable clarify`.

**[P2-9] Cartão-resposta sem legenda e com sinais fracos** (`sim.js:194-214`, `sim.css:48-50`). Atual é borda `--navy` (DESIGN.md pede `--accent`), difícil de ver sobre círculo índigo; marcada + atual perde o âmbar no escuro; marcada é só anel âmbar, sem glifo de bandeira; célula em branco com contraste 1,22:1 / 1,09:1; no celular é modal centrado e no escuro quase se funde ao fundo; no PC `Shift+C` abre um modal que duplica o painel visível. Correção: legenda de uma linha, ícone de bandeira no círculo marcado, bottom sheet no celular, `Shift+C` leva o foco ao painel no PC. `/impeccable polish`.

**[P2-10] Revisão pós-prova reaproveita o Resolver** (`sim.js:351-356`). Título "Questão 1" (posição nas 6 erradas, não a do simulado), relógio "–", banner vermelho de largura total "Resposta errada!", painel "Resultado 0 de 6 respondidas, 0 acertos, 0 erros" que contradiz o simulado, alternativas sem ✓/✗ (o ícone fica só no banner, que no celular pode deixar a correta abaixo da dobra). Recarregar em `#/resolver` perde a sessão e cai em `#/questoes`. Correção: modo revisão sem relógio, sem banner e sem o cartão Resultado; "Questão 7 do simulado · sua resposta A, correta C" com ícones. `/impeccable clarify`.

**[P2-11] "Marcar para revisar" longe do polegar e só por cor.** A bandeira é só ícone, no cabeçalho do card (y≈149 no celular), estado marcado só por fundo (`aria-pressed` + `accent-soft`, o ícone não muda); `M` só no teclado; o confirm de Finalizar conta em branco mas não as marcadas. Correção: botão "Marcar" com rótulo e estado preenchido na barra inferior; confirmação "6 em branco e 3 marcadas" com "Ver marcadas". `/impeccable adapt`.

**[P2-12] Alvos abaixo do mínimo.** `#sim-clear` 121,9×32 e "Ir para a próxima em branco" (`.btn.sm.sc-next`) 322×32 a 390 px (a regra de 44 px perde para `.btn.sm`); `#q-back` 38,6×44 na revisão; `input#q-page` 64×37 no PC (mínimo 40). `/impeccable adapt`.

**[P2-13] Contraste não textual abaixo de 3:1.** Borda de `.alt` e `.alt .letter` 1,89 / 1,64; borda de `.btn` 1,72 / 1,77; célula em branco do cartão 1,22 / 1,09. O texto passa, mas o limite do controle some em tela fraca. `/impeccable polish`.

**[P2-14] Timer baixo e marcada só por cor.** `.timer.low` só muda a cor (5,5:1 / 6,3:1 de texto, ok), sem ícone nem texto; `.sc.flag` só anel âmbar. Junto com P1-3. `/impeccable harden`.

**[P2-15] Anterior fora da barra fixa; A−/A+ no cabeçalho** (`sim.css:11-17`). Anterior fica no fluxo (y=740, 7 px sob a barra fixa com a página no topo) enquanto Próxima e Cartão estão fixos; A−/A+ ocupam o cabeçalho de uma tela de prova. Correção: [‹] [Cartão 5/12] [Próxima] na barra; A−/A+ no cartão ou num menu ⋯. `/impeccable layout`.

**[P2-16] Cabeçalho do Resultado no tablet e placar desalinhado.** A 960 px o título vira coluna de ~75 px ("ENARE / 2025 / — / prova") e "Finalizado em" quebra em 4 linhas; no celular o `dl` desalinha em "Tempo usado" (`app.css:453`). Correção: `flex-wrap` na `.page-head` e ações abaixo do título em ≤1100 px. `/impeccable adapt`.

**[P2-17] Fontes abaixo de 12 px e `kbd.hint` ilegível no Resultado.** Letra do cartão 11,2 px, `.badge` 11,5 px, rótulos do rail e `kbd.hint` 11 px; `kbd.hint` a 2,33:1 / 2,52:1 na rota Resultado ≥861 px. `/impeccable typeset`.

### P3 (polimento)

- Celular em paisagem (844×390): cabeçalho + barra consomem ~37% da altura e só uma alternativa fica visível.
- PC: linha do enunciado de 74–77 caracteres (alvo ~68; o `max-width:68ch` rende ~670 px porque o `ch` do "0" é largo); card de 820 px e vão de 248 px até o cartão-resposta.
- Escala de letra 0,8 dá enunciado de 13,6 px, abaixo do piso de 15 px (`solve.js:293`).
- "Iniciar" e "Começar prova" disparam o relógio direto (`sim.js:117`), sem "pronto?" nem aviso de que não há pausa.
- A dica "Teclas A–E…" aparece no celular (`sim.js:249`) e some assim que há resposta.
- Voltar do navegador sai da prova sem confirmar (a seta da tela confirma e avisa que o tempo continua).
- Modal do cartão não trava a rolagem do fundo; foco inicial vai à Q1, não à questão atual. Título do simulado truncado a 390 px; sem `<h1>` no exame; `main#view` focado sem outline.
- Em Listas, o card concluído mostra "Concluído · Nota 8%", sem data nem tempo. "As 5 que mais demoraram" lista em branco com 0:00. "Medicina Prev…" truncado nas barras. `C` repetido desmarca a resposta. Tesoura no escuro a 4,2:1 (aceitável para ícone).

## Carga cognitiva

Prova: 6 de 8 itens passam (foco único, agrupamento, blocos, uma coisa por vez, hierarquia, divulgação progressiva). Falham **escolhas no ponto de decisão** (o celular tem ~20 alvos: voltar, A−, A+, Finalizar, bandeira, borracha, 5 alternativas, 5 tesouras, Anterior, Cartão, Próxima) e **memória de trabalho** (relógio sem rótulo, progresso só dentro do modal, legenda do cartão para decorar). Resultado: 3 falhas (escolhas: 5 botões de mesmo peso; hierarquia: nota e ação principal não se destacam; divulgação progressiva: tudo empilhado). Total: 4 itens distintos de 8, carga **moderada a alta**, concentrada no fim da jornada.

## Jornada emocional

- **Início:** "Iniciar" dispara o relógio na hora, sem "pronto?" e sem dizer que não pausa.
- **Meio:** tela calma, Próxima e Cartão no polegar. A tensão sobe aos 5 min, mas só como cor.
- **Pico:** 1 min restante ou o clique em Finalizar. A confirmação é fria ("Ainda há 6 questões em branco. Finalizar mesmo assim?").
- **Fim (ponto mais fraco):** salto para uma parede de números. Se o tempo acabou, só um toast de 3 s. "17%" e "75%" são idênticos, sem ✓, sem tom, sem comparação com a tentativa anterior, sem frase do que fazer a seguir. O momento de maior esforço termina no menos acolhedor da interface.

## Bandeiras vermelhas por persona

- **Casey (distraída, uma mão, celular):** Finalizar, relógio, A−/A+ e bandeira entre y=18 e y=149, fora do alcance do polegar; relógio some ao rolar; Anterior fora da barra; no Resultado o principal é o 3º de cinco botões, no topo. A favor: Próxima e Cartão a 96% da altura e alvos de 44 px.
- **Alex (teclado, PC):** foco vai a `BODY` após cada ação, ~16 Tabs por questão, `?` sem os atalhos do simulado, `Shift+C` duplica o painel visível, `C` repetido desmarca a resposta. A favor: `A–E`, `M`, setas e `Ctrl+Enter` funcionam e ficam bloqueados com modal aberto.
- **Sam (acessibilidade):** relógio mudo (`aria-live="off"`) e sem aviso de tempo, sem setas nos radios, sem focus trap, cartão final só por cor, fim de prova só em toast. A favor: foco âmbar visível (outline 2 px) e `aria-label` completo nas células.
- **Residente estudando para a prova (persona do projeto):** quer treinar o ritmo da prova real e sair sabendo onde perdeu pontos. O Resultado entrega números mas não conta nada, deixa a análise por área abaixo da dobra, e "Tempo esgotado" aparece só num toast.

## Perguntas para considerar

1. Se o Resultado é o final da jornada, por que 75% e 25% parecem a mesma tela?
2. O relógio pode zerar com o usuário em outra tela e a prova some sozinha: isso é "modo prova" ou uma prova que o app decide por ele?
3. O cartão-resposta hoje só serve para navegar. Ele não deveria ser também o mapa do que o estudante errou, com a letra certa ao lado da sua?
4. A revisão pós-prova existe para aprender com o erro. Por que ela abre com um banner vermelho "Resposta errada!"?

## Plano sugerido

1. `/impeccable harden`: P1-2 (`location.replace`), P1-3 (tempo esgotado, fechar modais, avisos), P2-6, P2-7, P2-14.
2. `/impeccable layout` e `/impeccable clarify`: P1-1 (Resultado com veredito e ação principal), P1-4 (relógio fixo, "Finalizar" na última questão), P2-8, P2-10, P2-15.
3. `/impeccable adapt`: P1-5 (tablet com toque), P2-11, P2-12, P2-16.
4. `/impeccable polish` e `/impeccable typeset`: P2-9, P2-13, P2-17 e o P3.

## Limitações

- Sem leitor de tela real (NVDA/VoiceOver) nem toque físico; "celular" é emulação de Chromium headless (UA mobile), sem teclado virtual nem gesto de voltar do iOS. Tab no 390 não foi testado.
- Dados sintéticos (12 questões, 36 min, enunciado de ~640 caracteres que estressa a dobra). Não testei provas de 100+ questões, questões com imagem nem enunciados com tabela.
- O "tempo esgotado" foi forçado alterando `startedAt` e esperando o `setInterval` (~7 s); não esperei 36 min reais nem testei aba em segundo plano.
- Sem login Google real nem sincronização (`googleWebClientId` vazio): o efeito de uma sincronização no meio da prova não foi medido.
- O botão Voltar foi testado com `page.go_back()` no Chromium; o `backButton` do Capacitor/Android foi só lido em `app.js:71-81`.
- Contraste de elementos com `opacity` é aproximação; alvos medidos não têm gradiente nem imagem de fundo. Redução de movimento (regra em `sim.css:69`) e zoom do navegador não foram exercitados.
- `app.css` e `auth.js` têm alterações não commitadas, que podem diferir de críticas anteriores. O Playwright pediu o Chromium 1248 e só o 1254 existia; foi usado via `executable_path`.
- Servidores `http.server` das portas 8771 e 8772 foram encerrados no fim (um processo da 8771 ficou de resto e foi parado na síntese).
