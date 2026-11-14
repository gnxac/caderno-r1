# Pendências de design (consolidado das 9 críticas)

Data: 2026-11-13 · Fonte: `Início`, `Questões`, `Resolverquestão`, `ListaseSimulados`, `SimuladoeResultado`, `Desempenho`, `Anotações`, `Configurações`, `Teladelogin` (todas em `docs/critiques/`).

- **Nenhum P0** em nenhum relatório. Todas as telas ficaram entre 24 e 26 de 40.
- **Arquivo:linha** vem dos relatórios, não foi reconferido. `app.css` e `auth.js` tinham mudanças sem commit nas medições, então as linhas podem ter se deslocado. Abra o trecho antes de editar.
- Nada de código foi editado para montar este arquivo.
- **C-22 a C-30** vêm da auditoria técnica (`audit.md`): PWA, desempenho no celular, teclado, leitor de tela e movimento.
- Siglas das telas: **INI** Início · **QST** Questões · **RES** Resolver · **LST** Listas · **SIM** Simulado e Resultado · **DES** Desempenho · **NOT** Anotações · **CFG** Configurações · **LOG** Login.
- `C-n` é um item compartilhado. Cada tela lista no começo quais `C-n` a afetam e depois só o que é exclusivo dela.

---

# Compartilhado (CSS/componentes)

## P1

- [x] **C-1 · Alvos abaixo de 44 px no tablet com toque**
- Causa: o piso de 44 px vale só por largura (≤ 860 px). De 861 px em diante o app usa 40 px (`pointer: fine`) ou 32 px (`.btn.sm`), e o tablet com toque cai nessa faixa.
- Onde: `app.css:204` (`.btn.sm` 32), `:205-207` (`.icon-btn` 40), `:167-173`, `:732`, `:805`, `:915`, `:939` (`min-height:40px` anula o 44 de `.weak-list .btn.sm` e `.perf-actions .btn`), `:950`/`:972`, `:980-988`, `:981-983` (`button.bar-row`).
- Correção: um bloco `@media (pointer: coarse), (max-width: 860px)` com 44 px para `.btn`, `.btn.sm`, `.icon-btn`, `select`, `input`, `button.bar-row`, `.qchip`, `.popmenu button`, `.qindex-grid button`, `#q-page`, `#p-more`, `.sc-next`, `#fs-range` (32 px) e `.nt-foot`. Apagar `:939`.
- Telas e medidas: INI (Continuar 40, Mudar meta 32) · QST (`#f-reset` 32, `qa-actions` 40, `#q-page` 64×37) · RES (`#q-back`/`#q-focus`/`#q-index` 40) · LST (menu 40, ⋯ 34×44, `.sc-next` 32) · SIM (`#sim-flag`, `#q-fplus`, `#sim-clear` 32) · DES (`button.bar-row` 29,6) · NOT (32/40, Excluir a 6 px de Editar) · CFG (9 de 20 alvos em 40, slider 32).

- [x] **C-2 · Certa/errada e outros estados só pela cor**
- Contraria o PRODUCT.md ("nunca dependem só da cor").
- Onde: alternativas `.alt.right/.wrong` (`app.css:382-385`, `solve.js:110-118`, `:117` insere `<span>` vazio); cartão do Resultado `.sc.ok/.sc.bad/.sc.flag` (`sim.js:197-207`, `sim.css:48-53`); `.pct.low` (`perf.js:174`, `app.css:845`); barras de uma cor só; ponto de sync; crumb ativo (`notes.js:63-64`); `.timer.low`.
- Correção: ícone Lucide `check`/`x` na letra, texto oculto ("Gabarito", "Sua resposta, errada") e selo de texto. Marcada ganha bandeira.
- Telas: RES, QST, SIM (cartão e revisão), DES, NOT, INI/CFG (sync).

- [x] **C-3 · Foco cai no `body` a cada render e o modal não prende o foco**
- Causa: `MQ.render()` troca o DOM inteiro. Modal só trata Esc.
- Onde: `solve.js:177`, `:242`, `:263`; `notes.js:28`, `:62-68`; `perf.js` (re-render a cada filtro); `util.js:101` (`prevFocus.focus()` aponta para nó destruído), `util.js:104-105` (sem trap nem `inert` no fundo), `util.js:88` (`aria-modal`); `auth.js:129` (`disabled` derruba o foco).
- Correção: guardar o elemento ativo antes do render e restaurar depois; trap e `inert` no modal; `aria-disabled` no lugar de `disabled`. Enter na alternativa com `stopPropagation()` (`solve.js:245,263,276`). `MQ.confirm` sem `role="dialog"`.
- Telas: RES, QST, SIM, NOT, DES, CFG, LOG.

- [x] **C-4 · Sem ação principal: botões primários demais ou nenhum**
- Padrão repetido. INI tem 2 `btn primary` (`home.js:100,136`). QST tem "Filtros avançados" cheio (`app.css:272`). LST tem primário em cada cartão e "Fazer prova" secundário. SIM tem 5 botões de mesmo peso (`sim.js:376`). DES tem 0 primários e 6× "Treinar 20" (`perf.js:174`). NOT tem 45 primários (`notes.js:75`). CFG tem "Sincronizar agora" sempre primário (`sync.js:363`).
- No celular a ação principal fica no topo, fora do polegar. O DESIGN.md:262 promete ação fixa acima da barra, mas nada é `fixed`/`sticky` fora de `.qh-fab`.
- Correção: um único componente de barra de ação fixa acima da nav (reaproveitar `.qh-fab`), e um só botão cheio por tela.

- [x] **C-5 · Status de sincronização invisível em ≤ 1200 px**
- Onde: `app.css:147` (`.sync-label{display:none}`), `home.js:222` (ponto sem `aria-label`), `settings.js:35` (`.set-pill`), `app.css:604-605`, `sync.js:229` (ramo offline sem toast). Sem `aria-live`. `MQ.syncStatus` é lido uma vez no render.
- Correção: texto ou ícone com `aria-label` em qualquer largura, `role="status"`, um só lugar por formato (no PC "Sem sincronização" aparece duas vezes).
- Telas: INI (P2), CFG (P1).

- [x] **C-6 · Escala de fonte: piso de 80% dá 13,6 px, e a nota ignora a escala**
- Onde: `solve.js:293` (`Math.max(0.8, …)`), `settings.js:44` (`min="80"`) e `:46` (texto "nunca fica abaixo de 80%"). Nota: `.nt-text` 14,5 px (`app.css:911`), `.nt-q` 13,5 px (`:910`), `#nt-edit` 14 px (`:914`) sem `--font-scale`.
- Correção: piso `15/17` (≈ 0,88) nos dois arquivos, mostrar o nível atual, e `calc(15px * var(--font-scale))` na nota.
- Telas: RES, CFG, NOT, SIM.

- [x] **C-7 · Perda de resposta ou edição no debounce de 250 ms**
- Onde: `db.js:93-96` (`MQ.touch`), `sim.js:255`, `notes.js:28`. Sem flush em `pagehide`/`visibilitychange`. Reproduzido: responder ou salvar e recarregar logo em seguida volta sem o dado.
- Correção: `MQ.saveNow()` no `save()` do simulado e das notas, e flush em `pagehide`.
- Telas: SIM, NOT. Nos relatórios é P2. Subi para P1 porque é perda de dado e o PRODUCT.md diz "nenhum histórico se perde".

- [x] **C-22 · Primeira sessão não guarda o app para uso offline**
- Onde: `sw.js:5` (`install` só faz `addAll(['./','index.html'])`) e `app.js:97` (o SW só é registrado depois do login). Medido: logo após entrar, o cache tinha 2 entradas; chegou a 27 só depois de recarregar online. Depois disso o reload offline abriu o Início.
- Impacto: entrar, fechar e abrir sem internet antes da segunda visita online dá página sem CSS nem JS, apesar do login prometer "Funciona até sem internet".
- Correção: listar no `install` todos os arquivos (HTML, 2 CSS, 21 JS, 3 fontes, manifesto, 2 ícones) e subir `CACHE` a cada release.
- Telas: todas (LOG primeiro).

## P2

**C-8 · Contraste do `kbd.hint` do menu (PC ≥ 861 px)**
- `app.css:113-114` (`opacity:.55`, 11 px). Medido 2,33:1 (claro) e 2,52:1 (escuro); item ativo no escuro 4,20:1. É o único achado do detector em `www/index.html`. CFG mediu 3,79 e 4,03 com outro método, mesma regra.
- Correção: tirar a `opacity` ou usar `--ink-3` com ≥ 4,5:1.
- Telas: INI, QST, LST, SIM, DES, NOT, CFG.

**C-9 · Contraste não textual abaixo de 3:1**
- `--line-2` (`app.css:216`): borda de `.btn`, `.alt`, `select`, `input`, chips em 1,64–1,89. Trilhos `.lbar`, `.bar-track`, controle segmentado em 1,09–1,22. Textarea da nota com `border-color:transparent` (`:914`). Verde `#1F7A4D` e vermelho `#B3261E` com claridade de 1,23:1. Botão do Google no login em 1,72:1.
- Correção: subir `--line-2` e o token de trilho; borda do botão do Google `#747775` (claro) e `#8E918F` (escuro).
- Telas: RES, QST, LST, SIM, DES, NOT, CFG, LOG.

**C-10 · Texto abaixo de 12 px (e 15 px na leitura)**
- Onde: `app.css:113` (`.hint`), `:136-137` (rótulos do menu), `:698`/`:756` (`.mk`), `:662` (`.qp-card h3`), `:778` (semana), `:787` e `:933` (legenda do heatmap), `:924` (`.pk .mk`), `:481` (`.path` 12,5 px), `:433` (`.badge` 11,5 px), letras do cartão-resposta 11,2 px, `.nt-lab`, `.qchip .qn`.
- Correção: piso de 12 px nos rótulos, 13 px no apoio, 14–15 px no que se lê.
- Telas: INI, QST, LST, SIM, DES, NOT, LOG.

**C-11 · Placeholder sem estilo próprio**
- `app.css` não define `::placeholder`, então vale `#757575`: 4,15:1 no claro, 2,89:1 e 3,93:1 no escuro.
- Correção: `::placeholder{color:var(--ink-3)}`.
- Telas: QST (`#q-note`, `#q-search`), RES (`#q-note`), NOT (`#nt-q`).

**C-12 · Barra inferior do celular: 6 itens e foco coberto**
- Onde: `index.html:22` (Anotações só com `.l-f`, sem rótulo curto), `app.css:142` (`.ic-slot` 52 px), `:176-186` (sem `scroll-padding-bottom`). A 320 px a página ganha overflow (`scrollWidth` 336 > 320) e "Ajustes" é cortado. Em Desempenho 3–7 paradas de Tab, e em Anotações 12 de 75, ficam sob a barra.
- Correção: `<span class="l-r">Notas</span>`, `ic-slot` menor abaixo de 360 px, `scroll-padding-bottom` igual à altura da barra.
- Telas: NOT, CFG, DES, LST, LOG.

**C-13 · Estrutura e semântica para leitor de tela**
- Faltam `h2` (INI só tem `h1`; QST `h1→h3` em `bank.js:403,434`; RES sem `h1`/`h2` em `solve.js:141,154,159,171-173`). Seções e `article` sem nome (8 em INI/DES, 47 em NOT `notes.js:70`). Contagem sem `role="status"` (`notes.js:42,58`). Sem skip-link. Alternativas `role="button"` com `<button>` aninhado e `aria-pressed` (`solve.js:115-117`), `tabindex=0` mantido depois de revelar. `role="timer"` sem `aria-label`.
- Correção: `h2` + `aria-labelledby`; alternativas como `radiogroup`/`radio` com `aria-checked` e tesoura fora da ordem de Tab; skip-link.
- Telas: INI, QST, RES, SIM, DES, NOT, CFG.

**C-14 · Heatmap (Início e Desempenho)**
- Onde: `home.js:172`, `perf.js:111,195`, `app.css:782-787`.
- Nível 1 quase some contra o nível 0 (1,05–1,29:1). O dado só aparece em `title`, sem foco nem toque. Letras S/Q repetidas. Desempenho mostra 26 semanas, Início 17–33.
- Correção: subir `--heat-1`, `aria-label` com resumo, linha de detalhe ao toque, "seg ter qua…", uma contagem de semanas só.

**C-15 · Texto longo que vaza ou trunca**
- `.nt-path`, `.nt-meta` sem `overflow-wrap` (`app.css:909`): `scrollWidth` 745/390. `.kv dd` em CFG com e-mail de 95 caracteres: 586/390. `.qchip{height:32px}` (`app.css:688`, `:694`). `.lbl` com `text-overflow` (`app.css:460`, `perf.js:215`) sem alternativa no toque.
- Correção: `overflow-wrap:anywhere`, chips com `height:auto; white-space:normal`, nomes quebrando em 2 linhas.
- Telas: NOT, CFG, DES.

**C-16 · Banner de resposta pesado e mal posicionado**
- Faixa sticky de 56–60 px, igual para acerto e erro, cobre a alternativa ao rolar e, no PC, o mapa (362–1093). Some ao reabrir a lista (`hideBanner`, `solve.js:19`). Na revisão pós-prova (`sim.js:351-356`) aparece "Resposta errada!" e placar `0 de 6`.
- Correção: feedback na própria alternativa (ver C-2), banner no fluxo, uma linha, `--ok-soft`/`--err-soft`.
- Telas: RES, QST, SIM.

**C-17 · Linha do enunciado acima do alvo de ~68 caracteres**
- `.stem{max-width:68ch}` (`app.css:357`) rende ~670 px, ou 74–88 caracteres. QST classificou como P1. RES mediu 64–68 contando de outro jeito, então as medições divergem. Medir de novo antes de mexer.
- Correção: limite em `em` (~34em a 17 px).
- Telas: QST, RES, SIM.

**C-23 · Service worker espera a rede antes de usar o cache**
- Onde: `sw.js:7-13` (`fetch(r).then(...).catch(() => hit)`). Em sinal ruim cada arquivo espera o tempo limite da rede. Derivado do código, não medido.
- Correção: stale-while-revalidate nos estáticos; rede primeiro com limite de ~3 s só na navegação.
- Telas: todas.

**C-24 · 21 scripts bloqueantes e peso carregado sempre**
- Onde: `index.html:33-54` (sem `defer`; `gsi/client` carrega até logado). Medido no perfil lento (CPU 4×, 200 KB/s, 150 ms): FCP 2 652 ms, 27 pedidos, 702 KB sem gzip. `app.css` 83 KB bloqueia a renderização; `editor.js`, `dedupe.js`, `seed.js` e `sim.js` carregam para todos.
- Correção: `defer` em todos; `preload` de `manrope.woff2`; depois, carregar `editor`/`dedupe`/`sim`/`perf` só na rota.
- Telas: todas.

**C-25 · Título da página fixo e foco no `main` sem nome**
- Onde: `app.js:20` (`MQ.render` não muda `document.title`; medido "Pulse" em 5 rotas) e `app.js:58` (foca `#view`). WCAG 2.4.2.
- Correção: `document.title = tela + ' · Pulse'` e focar o `h1` (`tabindex="-1"`).
- Telas: INI, QST, LST, NOT, DES, CFG, RES, SIM.

**C-26 · Login deixa o app de trás acessível**
- Onde: `auth.js:108-125`. Medido: 2 `main` e o `h2` da tela de trás na árvore de acessibilidade. O Tab está certo.
- Correção: `inert` em `.shell` com `body.logged-out`.
- Telas: LOG.

**C-27 · Nova versão não é procurada nem avisada**
- Onde: `sw.js:5-6` (`skipWaiting` + `claim`, sem mensagem) e `app.js:97` (sem `registration.update()`). PWA aberto por dias fica na versão velha. Não testado com dois deploys.
- Correção: `update()` em `visibilitychange` e por hora; aviso "Nova versão. Atualizar".
- Telas: todas.

**C-28 · Manifesto incompleto para instalar no Android**
- Onde: `manifest.webmanifest` sem ícone `maskable`, `id`, `screenshots` e `shortcuts`; `index.html` sem `<meta name="description">`.
- Correção: ícone maskable 512, `"id":"./"`, atalhos "Sessão rápida" e "Questões".
- Telas: LOG, INI.

**C-29 · `Ctrl 1–6` colide com a troca de abas do navegador**
- Onde: `shell.js:11-16` e os `kbd.hint` de `index.html`. Chrome/Edge reservam `Ctrl+1…8`; provavelmente só funcionam no app instalado. Não confirmado em navegador real (o Playwright ignora a reserva). `shell.js:12` também ignora `Alt`.
- Correção: `Alt+1…6` ou sequência (`g` + letra), e atualizar `kbd.hint` e `shortcutsDialog`.
- Telas: INI, QST, LST, NOT, DES, CFG (PC).

## P3

**C-18 · Rolagem**
- `app.js:58` faz `scrollTo(0,0)` a cada rota (NOT perde a posição ao voltar do Resolver). `scrollIntoView({behavior:'smooth'})` ignora `prefers-reduced-motion` (`solve.js:227`, índice de `settings.js`).

**C-19 · Avisos do detector em `app.css`**
- 62 avisos (41 de fonte, 12 de raio, 9 de cor), todos de escala do DESIGN.md. A escala 12·13·14·16·18·22·28 está na prosa do DESIGN.md e o detector só lê o YAML. Linhas citadas: `811-872` (`.lst*`), `433`, `466`, `652`, `666`, `1030`, `1034`, `1057`. As cores do marca-texto (`:514-521`) são intencionais.

**C-20 · Código morto e duplicado**
- `MQ.multiLineChart` (`charts.js:97-136`) sem uso. `.weak-list li` e `.bar-track` duplicados (`app.css:479,929` e `:461,463`).

**C-21 · DESIGN.md contradiz o código ou a si mesmo**
- 5 abas (`:262`) contra 6 (`:289`). "Entregar" contra "Finalizar". Cartão-resposta de 30 px contra 44 px. `C` contra `Shift+C`. "Grande área"/"UF" contra "Assunto"/"Região". Atalhos `H` e `C` contra `settings.js:10-11`. "Publicar banco" em Administrador contra `settings.js:38`. Decidir qual lado está certo antes de corrigir o código.

**C-30 · "Reduzir movimento" desliga tudo de uma vez**
- `app.css:503` (`* { transition:none!important; animation:none!important }`). Perde a transição que mostra a mudança de estado (modal, filtro, toast). Trocar o deslize por um fade curto. O `scrollIntoView` está em C-18.

---

# Por tela

## Início (INI)

Compartilhados: C-1, C-4, C-5, C-8, C-10, C-13, C-14.

**P1**
- [x] **INI-1 · "Continuar de onde parei" nunca expira.** `home.js:102-116`; `solve.js:94-97` grava `last` em toda sessão e nada o limpa. Aparece "Continuar: Sessão rápida · Questão 10 de 10". Limpar `last` ao terminar, ou só oferecer se `idx < total-1`.
- [x] **INI-2 · Ação principal fora da zona do polegar.** "Continuar" a 25% da altura, "Revisar agora" a 69%. Resolve com C-4.

**P2**
- **INI-3 · Primeiro uso no PC e tablet.** `.hm-grid.first` (900 px) deixa ~70% vazio, "Meta 0/20" é ruído e não diz que o banco é de exemplo (12 questões). Passos concretos e "Banco: N questões".
- **INI-4 · PC com histórico sobrecarregado.** 8 cartões, 12 interativos, heatmap quase vazio de 241 px, página 52 px maior que a janela. Heatmap de 33 semanas só em Desempenho; na Início, uma linha de 7 dias.
- **INI-5 · "Ponto mais fraco" sem ação com poucos dados.** `home.js:140`. Mostrar progresso ("8 de 15") e "Resolver por tema".
- **INI-6 · Nada de residência na tela.** Falta prova-alvo, tamanho do banco ou dias até a prova. Nada explica a revisão 1-3-7-15-30.

**P3**
- "Em dia" em verde, DESIGN.md pede ciano (`home.js:134`).
- [x] "0 acertos, 0 erros" com contadores zerados (`home.js:109`).
- [x] `ago()` diz "há 24 horas" em vez de "ontem".
- [x] "Boa noite" de 0h às 5h (`home.js:218`).
- No PC o botão de "Continuar" fica a ~700 px do título.
- Sem skip-link nem atalho da ação principal.

## Questões (QST)

Compartilhados: C-1, C-8, C-9, C-10, C-11, C-13, C-17.

**P1**
- [x] **QST-1 · Beco sem saída quando tudo já foi resolvido.** `bank.js:430-448`. "0 questões" em vermelho, "Limpar filtros", Resolver, Lista e Simulado desabilitados, sem CTA. É o estado normal de quem estuda de verdade. Trocar por "Você resolveu tudo" com "Incluir já resolvidas" e "Refazer erradas".
- [x] **QST-2 · Celular: resultado e chips abaixo de ~600 px de filtros, e o FAB cobre o contador.** `.fbtns` vai até y≈630; `.qh-fab` (y707–776) cobre `#qh-n`; `#qh-summary` em y924. Resumo e chips logo abaixo da busca, filtros em grade ou acordeão.

**P2**
- **QST-3 · Checkbox "marcar tudo" de 22×22** (celular e tablet). `bank.js:249`, `app.css:304`. A linha inteira não é `label` nessas linhas.
- **QST-4 · "Filtros avançados" é o maior bloco saturado.** `app.css:272`. Usar borda e `--soft`. O ícone de settings confunde com Configurações.
- **QST-5 · Contadores por opção ignoram os outros filtros** e a contagem só atualiza depois de Confirmar. Mostrar "Confirmar (N questões)".
- **QST-6 · "Situação" avançada com opções sobrepostas**, todas "Obrigatório", e lixeira como "Restaurar padrão". Trocar por controle segmentado (Todas / Não resolvi / Errei / Acertei) e ícone `rotate-ccw`.
- **QST-7 · Busca e atalhos só no PC.** Sem Ctrl K no toque, dica "Ctrl K" ausente da pílula de busca, `/` e 1–5 não existem (`solve.js:269` usa `/^[A-E]$/`).
- **QST-8 · Aba genérica.** Filtros "Assunto/Região/Finalidade/Banca"; falta entrada direta por assunto ou prova ("treinar Cardiologia ENARE").

**P3**
- PC com metade inferior vazia (poderia ter "Continuar" e "Revisões de hoje").
- Seed "Exemplo autoral · 2026" sem aviso.
- "Limpar filtros" restaura `newFilter()`, não o padrão salvo em Configurações (lido no código).
- Ctrl K abre só as 40 primeiras.
- Índice do resolver nasce aberto no PC com um botão por questão (134 com 200, 1.204 com 2.000): risco futuro.

## Resolver (RES)

Compartilhados: C-1, C-2, C-3, C-6, C-9, C-11, C-13, C-16, C-17.

**P1**
- [x] **RES-1 · Depois de errar, o comentário fica fora da tela e a ação oferecida é pular.** `#q-comment` em y=730, atrás da barra fixa (y≈747); a lâmpada "Solução" está no topo. Rodapé com "Ver solução" primária e "Próxima" ao lado, ou comentário já aberto sob as alternativas.

**P2**
- [x] **RES-2 · Tablet 960×640: o cromo ocupa a tela.** Cabeçalho, ferramentas, "Limpar marcas" desabilitado numa 2ª linha de 48 px, chips e rodapé deixam 1 de 5 alternativas visível. Esconder "Limpar marcas" quando desabilitado (como já é no celular).
- **RES-3 · Sete ferramentas só com ícone, no topo do celular.** `solve.js:125-132`, `app.css:1068`. A lâmpada só dispara um toast antes de responder. Voltar, foco e cronômetro somem ao rolar (`#q-back`, `#q-focus`, `#q-index` em y18–62). Esconder "Solução" até haver resposta, mover Lista e Anotação para "⋯" ou para o rodapé.
- **RES-4 · "Fim da lista" é botão desabilitado.** No último item virar "Ver resultado" com acertos, erros e rota de revisão.
- **RES-5 · Responder desabilitado sem motivo no celular.** `#q-answer` a 3,09:1 e a dica "escolha com o toque ou A–E" some (`.hide-m`).
- **RES-6 · Busca e teclado sem descoberta.** Atalhos só pelo `?` e por uma frase que fica depois de responder. Sem atalho para solução nem histórico.

**P3**
- Alternativa descartada a `opacity .5` com tachado fica ilegível (`app.css:376-377`).
- "Limpar marcas" desabilitado a 1,87:1.
- O ícone `maximize` não muda no modo foco; A↓/A↑ esticados nas pontas.
- Duas setas "próxima" lado a lado.
- "Resultado 0/0" e painel âmbar de anotação vazio pesam no PC antes da primeira resposta.
- Cronômetro sempre visível pode gerar pressão.

## Listas (LST)

Compartilhados: C-1, C-4, C-8, C-9, C-10, C-12. Itens de simulado (cartão-resposta, resultado, timer) estão em SIM.

**P1**
- [x] **LST-1 · Listas vazia não diz o que fazer.** `lists.js:309`: o Caderno de erros sempre existe, então `cards ? grid : empty` nunca cai no vazio. No PC o painel "Escolha uma lista…" aparece sem lista. Mostrar o estado vazio com "Ir para Questões" e esconder o detalhe vazio.
- [x] **LST-2 · Simulado em andamento enterrado e sem tempo restante.** `lists.js:212,219`. Vem depois de 4 cartões de prova, ordenado por data, com "Sem tentativa". O DESIGN.md pede "primeiro o simulado em andamento, com tempo restante". Fixar um cartão no topo: "Em andamento · 12:40 restantes · Continuar".
- [x] **LST-3 · "Provas por instituição" vem antes do conteúdo do usuário.** `lists.js:286-289,308`. ~760 px no celular, "Fazer prova" secundário contra primário nos cartões do usuário, "Exemplo autoral 2026" listado como instituição. Recolher a seção, pôr depois dos simulados do usuário.

**P2**
- **LST-4 · Detalhe da lista só no PC.** No celular e tablet o toque abre direto o Resolver (`lists.js:338`). Menu ⋯ com 11 itens, 5 deles variações de "Duplicar apenas com…" (`lists.js:141-159`); `[data-lmenu]` encolhe para 34×44 com nome longo. Bottom sheet de detalhe e submenu.
- **LST-5 · "Nova lista" e "Novo simulado" não criam nada.** `lists.js:346-347` só mandam ao banco com um toast curto. Criar a lista vazia ali, ou banner persistente em Questões.
- **LST-6 · "Criar" e "Recentes" a ~12% da altura no celular** (`lists.js:306`), fora do polegar.
- **LST-7 · Aproveitamento da largura.** PC: coluna de cartões de 540 px dentro de 1148, nomes quebrando em até 6 linhas. Tablet sem painel de detalhe e sem indicar o cartão selecionado (`.lcard.sel` só no PC).
- [x] **LST-8 · Métricas sem sentido em simulado novo.** `lists.js:259-260` ("0 de 4 respondidas na última prova", "4 em branco"). "Resolver" ativo em lista vazia, e a primeira lista vazia vem selecionada no PC (`lists.js:297`).
- **LST-9 · A lista inteligente nasce só em Questões**, o filtro não aparece nem se edita em Listas. Concluídos mostram só a nota (sem data e tempo); faltam predefinições de instituição editadas pelo admin.

**P3**
- Copy: "Continuar da 1" (`lists.js:261`), "Nota 50%" sem contexto, título "Cardio — revisão — simulado — revisão".
- Caderno de erros usa `--err-soft` (`app.css:831`, `lists.js:229`) para uma função neutra.
- Pastas de Simulados repetem as de Listas e mostram 0.
- "Mostrar todas (n)" só com mais de 4 provas.

## Simulado e Resultado (SIM)

Compartilhados: C-1, C-2, C-3, C-7, C-8, C-9, C-10, C-13, C-16.

**P1**
- [x] **SIM-1 · Resultado sem veredito, sem ✓/✗ e sem ação principal ao alcance.** `sim.js:374-390`, `sim.js:197-207`, `sim.css:51-53`, `app.css:451-455`. Nota igual para 25% e 75%; 5 botões de mesmo peso no topo (o primário é o 3º, a 26% do topo, `#r-review` y220–264); sem frase de leitura, sem comparação com a tentativa anterior. Bloco de nota com ✓/✗ e frase; "Revisar as erradas" fixo na base do celular; o resto em ⋯; mostrar a letra certa ao lado da marcada.
- [x] **SIM-2 · Botão Voltar preso no Resultado.** `sim.js:219`, `:308`, `:317` fazem `location.hash = '#/resultado/…'`, empilhando entradas. Trocar por `location.replace(...)`. No Android o botão físico usa `history.back()` (`app.js:77`) e cai no mesmo laço.
- [x] **SIM-3 · Fim do tempo abrupto e mudo; modal aberto sobrevive.** `sim.js:313-323`, `:237` (`aria-live="off"`), `app.css:415`, `util.js:65-75`. Ao zerar, o `.modal-back` não é removido e fica sobre o Resultado oferecendo "Finalizar". Só um toast de 3,2 s. Fechar modais, mostrar "Tempo esgotado. Suas N respostas foram salvas", avisos aos 10/5/1 min em região `aria-live="polite"`, e Listas finalizar provas vencidas.
- [x] **SIM-4 · Timer e Finalizar somem ao rolar, e na última questão não há "terminar" à mão.** `.solve-bar` é estático, `.sim-bar` só tem Cartão e Próxima. Na última questão "Próxima" fica desabilitado (1,5:1). Relógio compacto fixo, e na última questão "Próxima" vira "Finalizar".
- [x] **SIM-5 · Tablet (861–1199 px, toque): Próxima fora da tela.** `sim.css:20-31` esconde `.sim-bar` a partir de 861 px; em 960×640 "Próxima" fica em y=655. Manter a barra em `pointer: coarse`.

**P2**
- **SIM-6 · Teclado.** ~16 paradas de Tab por questão (5 alternativas + 5 tesouras), setas sem função nos radios (`ArrowRight` troca de questão, `ArrowDown` não move), `?` não lista `A–E`, `M`, `Shift+C`, `Ctrl+Enter`. Roving tabindex, tesouras com `tabindex=-1`, seção "Simulado" no `?`. `C` repetido desmarca a resposta.
- **SIM-7 · Relógio sem rótulo e progresso escondido no celular.** `sim.js:237-238`, `sim.css:18`. Sem "restam", `role="timer"` sem `aria-label`, "x/12 respondidas" some e o botão mostra a posição ("Cartão 5/12").
- **SIM-8 · Cartão-resposta sem legenda e com sinais fracos.** `sim.js:194-214`, `sim.css:48-50`. Atual em `--navy` (DESIGN.md pede `--accent`), marcada só anel âmbar, célula em branco a 1,22:1, no celular é modal centrado e não "por baixo", `Shift+C` no PC duplica o painel visível. Botão "Ir para a próxima em branco" (`.btn.sm.sc-next`) mede 322×32 porque `.btn.sm` vence o `min-height:44px` de `sim.css`.
- **SIM-9 · Revisão pós-prova reaproveita o Resolver.** `sim.js:351-356`. Título "Questão 1" (posição entre as erradas), relógio "–", placar `0 de 6`, recarregar em `#/resolver` perde a sessão. Modo revisão sem relógio, sem banner e sem cartão Resultado.
- **SIM-10 · "Marcar para revisar" longe do polegar e só por cor.** Bandeira só ícone no cabeçalho (y≈149), estado só por fundo. A confirmação de Finalizar conta em branco, mas não as marcadas (`sim.js:305`).
- **SIM-11 · Anterior fora da barra fixa; A−/A+ no cabeçalho** (`sim.css:11-17`). "Anterior" em y=740, 7 px sob a barra.
- **SIM-12 · Cabeçalho do Resultado esmagado no tablet.** `sim.js:375-376`, `app.css:124`, `:453`. A 960 px o título vira coluna de ~75 px; `dl` desalinha em "Tempo usado". `flex-wrap` em `.page-head`.
- **SIM-13 · Modal "Criar simulado".** `sim.js:58`: o total some atrás do rodapé; "min/questão" e "tempo total" acoplados por `manualTime`; `−`/`+` são glifos de texto.
- **SIM-14 · Timer da prova sem aviso fora da tela e sem pausa.** "Iniciar" dispara o relógio na hora (`sim.js:117`), sem "pronto?" nem aviso de que não há pausa.

**P3**
- Celular em paisagem (844×390): só uma alternativa visível.
- Dica "Teclas A–E…" aparece no celular (`sim.js:249`).
- Voltar do navegador sai da prova sem confirmar.
- Modal do cartão não trava a rolagem do fundo; foco inicial vai à Q1; sem `<h1>` no exame.
- "As 5 que mais demoraram" lista em branco com 0:00. Concluído mostra "Nota 8%" sem data nem tempo.
- Copy: "1 disponíveis" e "1 marcadas" (`sim.js:42,212`), "0:04 de 18 min".

## Desempenho (DES)

Compartilhados: C-1, C-2, C-3, C-4, C-9, C-10, C-12, C-13, C-14, C-15, C-20.

**P1**
- [x] **DES-1 · Sem ação principal; Pontos fracos vem depois do histórico.** `perf.js:106-107` (Evolução antes de Pontos fracos), `:174` (6× "Treinar 20"), `:115` ("Lista/Simulado com as erradas" a 94–95% da página). Faixa no topo "Seu ponto mais fraco: Pneumonia, 38%" com um primário; Pontos fracos sobe; os outros 5 viram link; "Lista/Simulado com as erradas" vai para o ⋯.
- [x] **DES-2 · "Por instituição" não desenha as barras.** `perf.js:191` gera `<div class="bar"><i style="width:N%">`, mas o CSS de `.bar` só existe sob `.hm-card .bar` (`app.css:765`) e `.qh-card .bar` (`:711`); para `.hbar .bar` só há `grid-column` (`app.css:791`). Medido: altura 0 nos 6 combos. Mover as regras para um seletor compartilhado (trilho 8 px, preenchimento `--accent`, `.err` com `--err` e ícone). **É correção de uma regra de CSS.**
- [x] **DES-3 · Gráfico de Evolução ilegível no celular e só por mouse.** `charts.js:141` (`W = 640` fixo, escala 0,5 = rótulos de 6 px), `:167` e `:176` (só `mousemove`/`mouseleave`), `app.css:466` (12 px). SVG sem dados e sem ponto focável. Calcular `W` por `clientWidth` (como `bubbleChart` em `charts.js:38`), `pointerdown`, tabela oculta equivalente, legenda em texto.

**P2**
- **DES-4 · "Onde focar": bolhas sobrepostas e quadrantes invisíveis.** `perf.js:113,235`, `charts.js:63-64`, `app.css:469` (Q1–Q4 a `opacity .22`, 1,36:1). Tocar na bolha faz drill, então o tooltip nunca aparece no toque. Legenda dentro do `<details>`. Decidir se fica (não está no DESIGN.md).
- **DES-5 · Amostra pequena vira ruído.** `perf.js:157` plota bucket de 1 resposta como 0% ou 100%; `perf.js:189-191` mostra "ENARE 100% · 1". Só Pontos fracos tem mínimo (`MIN_WEAK = 5`, `perf.js:5`). Definir n mínimo e estilo tracejado.
- **DES-6 · Estado vazio igual para "nunca respondeu" e "nada neste período".** `perf.js:99`. Onboarding quando `MQ.alive('attempts')` está vazio, sem filtros, com "Sessão rápida de 10 questões".
- **DES-7 · Menu ⋯ só tem a ação destrutiva.** `perf.js:121-128`. Falta "Exportar CSV"; zerar usa confirm simples (`perf.js:123`) e o DESIGN.md pede confirmação digitada; item de 40 px.
- **DES-8 · Barras de área sem ênfase e sem saída no último nível.** `app.css:462`, `perf.js:215`. Toda barra índigo; sem "Treinar este tema" na folha. Marcar a pior com `--err` + ícone.
- **DES-9 · Filtros ocupam 27% da primeira tela e não persistem.** `perf.js:96-98`, `:9`. Período (8 opções) e Origem (5–6, sem `optgroup`) em duas linhas cheias; "Datas específicas" vazio mostra tudo sem avisar. Chips 7/30/90/Tudo e salvar a escolha.
- **DES-10 · Painéis com vazio morto no PC e tablet.** `app.css:445` (`align-items:start`): ~160 px mortos sob a Evolução.
- **DES-11 · Acessibilidade dos gráficos.** `charts.js:48,146`, `perf.js:93,118-120,173-174,215`. `aria-label="Detalhar X"` esconde o valor; seis botões "Treinar 20" com o mesmo nome; barras de instituição sem `aria`; tooltip sem `aria-describedby`.
- **DES-12 · Comparação com período anterior só nos KPIs e crua.** `perf.js:90,101`. "+236 vs. período anterior" sem unidade; o "−2 s" em verde confunde. Escrever "+236 questões (30 d antes: 201)" com seta.
- **DES-13 · Histórico de simulados sem tendência.** `perf.js:196-200`. Máx. 6 no período, sem gráfico de nota nem comparação.
- **DES-14 · Evolução "semanal" agrupa de 2 em 2 dias no padrão de 30 dias** (`perf.js:106`), contra o DESIGN.md.

**P3**
- Limiares de vermelho diferentes: 60% (`perf.js:172`), 55% (`perf.js:191`), `xSplit` 60 (`perf.js:235`).
- "Dias estudados" em três lugares.
- Tempos > 600 s e `timeSec` nulo descartados em silêncio (`perf.js:80`).
- Eixo da Evolução sempre 0–100%.
- Linha de apoio do KPI Acerto gasta com explicação fixa.

## Anotações (NOT)

Compartilhados: C-1, C-3, C-4, C-6, C-7, C-8, C-9, C-10, C-11, C-12, C-13, C-15.

**P1**
- [x] **NOT-1 · Busca e filtros não ficam fixos.** `app.css:902` (`.nt-filters` sem `position`), `:896-903`; `app.js:58` faz `scrollTo(0,0)`. A página tem 15.000–29.000 px no celular, e os filtros ocupam 341 px (40% da altura). Voltar de "Abrir questão" mantém filtro e busca, mas leva a rolagem a 0. Cabeçalho compacto fixo, "voltar ao topo", restaurar a rolagem. Feito: cabeçalho com busca fixo, botão "Voltar ao topo" e rolagem restaurada ao voltar de "Abrir questão".
- [x] **NOT-2 · Excluir é irreversível, sem desfazer e sem identificar a nota.** `notes.js:98` (texto genérico), `db.js:120-125` (`MQ.remove` troca por lápide e descarta o texto). Mostrar código e primeiras palavras no diálogo; toast "Anotação excluída · Desfazer" por ~8 s; toast ao salvar. Feito: o diálogo mostra código e início da nota; toast "Anotação excluída" com Desfazer (8 s) e "Anotação salva".
- [x] **NOT-3 · Chip de assunto longo vaza da pílula (celular).** `app.css:688` (`.qchip{height:32px}`) com `min-height:44px` no toque (`:694`). Só um dos avaliadores reproduziu; B mediu 44 px. `height:auto; min-height:44px; white-space:normal`. Feito: chip com altura automática e mínimo de 44 px no toque.

**P2**
- **NOT-4 · Nota longa sem recolher; cartão estica os vizinhos.** `app.css:905-911`. Cartão de 2.110–2.570 px; vazio de até 2.194 px no PC. Limitar a ~8 linhas com "Ver tudo" e alinhar o rodapé (`margin-top:auto`).
- **NOT-5 · Editar move o cartão para o topo** (`notes.js:11` ordena por `updatedAt`, `:28`), e nada confirma o salvamento.
- **NOT-6 · A nota some ao "Abrir questão" e a sessão registra tentativa.** `notes.js:93-95`, `solve.js:129`, `app.css:1068`. Contamina Desempenho e a revisão espaçada. Mostrar a nota como faixa no Resolver aberto por Anotações. **Decisão de produto** sobre um modo de leitura que não registre resposta.
- **NOT-7 · O sync repinta e tira o foco da busca.** `sync.js:261` (`MQ.render()` quando `changed`), `notes.js:41`. Repintar só `#nt-list`.
- **NOT-8 · Busca ignora a hierarquia e casa com o enunciado inteiro.** `notes.js:17`. "Hérnia" (assunto) retorna 0; "conduta" retorna 45 de 47.
- [x] **NOT-9 · Crumb ativo só por cor e `aria-pressed` errado.** `notes.js:63-64`. Trilha deveria ser `nav` com `aria-current`. Feito: trilha em `nav`, item ativo com `aria-current`.

**P3**
- Caminho completo repetido em cada cartão dentro de um filtro (`notes.js:72`).
- `Ctrl K` abre a busca de questões, não o campo local; `/` não faz nada.
- Estado vazio cita a tecla N, inútil no toque (`notes.js:38`).
- Nota de questão removida mostra só "Questão removida" (`notes.js:70`).
- "×" nativo do `type=search`; URL na nota não vira link; Esc no modal descarta sem aviso e sem contador de 4000.
- Render de 300 notas: 78–87 ms, sem virtualização.

## Configurações (CFG)

Compartilhados: C-1, C-3, C-5, C-6, C-8, C-9, C-12, C-15.

**P1**
- [x] **CFG-1 · "Sincronizar agora" não responde.** `sync.js:229` (offline sem toast), clique sem Google configurado não faz nada, requisição pendurada sem timeout (medido 2,5 s), botão sem `aria-busy`, mensagem técnica "Google Drive respondeu 500…". Linha de estado no topo ("Tudo salvo às 14:32"), botão com estado carregando. Feito: "Sincronizar agora" mostra "Sincronizando…" (aria-busy), avisa sem internet e sem Google, desiste após 60 s e explica cada falha em português com a ação (Reconectar, Gerenciar espaço, Tentar de novo).
- [x] **CFG-2 · Restaurar backup: texto engana, contador não atualiza.** `editor.js:222-232`, `settings.js:56,58`. Backup de 5 respostas e 1 anotação diz "0 questões novas, 12 repetidas (serão ignoradas)"; a tela continua "0 respostas · 0 anotações" (`MQ.touch()` não re-renderiza). "1 questões novas". Sem validação de esquema: `{"questions":{"x2":{"id":"x2"}}}` entra como questão vazia. Contar por coleção, `MQ.render()` depois, rejeitar questão sem enunciado. Feito: a confirmação conta por coleção (respostas, anotações, listas, imagens) e avisa remoções; arquivo sem nada novo ou sem questão válida é recusado com motivo; a tela atualiza os contadores.
- [x] **CFG-3 · "Sincronizar agora" é sempre o primário e "Sair e apagar" tem o peso de "Sair".** `sync.js:363`, `auth.js:92`. O app já sincroniza sozinho (`sync.js:283-287`). "Sair e apagar" apaga questões e respostas com um clique, sem opção de exportar antes. Feito: "Sair e apagar" saiu da linha para um bloco recolhido "Computador compartilhado?", em `danger`, com "Exportar backup antes".
- **CFG-4 · Estrutura diverge do DESIGN.md e faltam os dados que dão segurança.** Celular com 3,1–3,5 telas de chips de âncora (DESIGN.md pede lista com valor à direita e subtelas); PC sem painel de status à direita. Sem "alterações pendentes", "último backup" nem versão do banco. "Exportar backup" a 1,8 tela de rolagem. **Decidir se a estrutura do DESIGN.md é meta ou descartada** (C-21).
- [x] **CFG-5 · Sem conta, o risco não é um aviso e "Entrar com o Google" é primário sem Google configurado.** `sync.js:361,364`; `auth.js:31` (até 10 s) e `:121`. Aviso em destaque com "Exportar backup" como ação principal; esconder o botão quando `MQ.syncConfigured()` for falso. Feito: sem Google configurado o botão some e o primário é "Exportar backup", com aviso de risco.

**P2**
- **CFG-6 · Índice de âncoras fraco.** `settings.js:32,72`, `app.css:945-956`. Todos os links com o mesmo `href="#/configuracoes"`, sem scroll-spy nem `aria-current`, 7 Tabs antes do primeiro controle, 4º chip cortado a 390 px.
- [x] **CFG-7 · Meta diária aceita decimal e mostra o valor errado.** `settings.js:78-84`: 12,7 grava 13, o campo continua 12.7. Largura de 96 px inline (`settings.js:49,50`). Feito: o campo mostra o valor arredondado.
- [ ] **CFG-8 · Exportar backup sem retorno e sem registro.** `settings.js:95`, `editor.js:215`. Sem toast e sem "Último backup em…"; o backup não leva as preferências locais. Feito em parte: toast ao exportar; falta "Último backup em…".
- [x] **CFG-9 · Atalhos de teclado ocupam ~28% da página no celular** (`settings.js:60`). Esconder em toque ou recolher em `<details>`. Feito: recolhido em `<details>`, aberto só com mouse.
- [x] **CFG-10 · "Publicar banco" sem bloqueio para 0 selecionadas (admin; lido no código).** `sync.js:207-220`, `settings.js:38`. Com 0 marcadas o banco publicado viraria lápide para todos. Desabilitar com 0 e mostrar "Vão sair do banco: N questões". Feito em parte: "Publicar" fica desabilitado com 0 marcadas e explica o risco; falta mostrar quantas questões sairão do banco.

**P3**
- Dois `h2` seguidos (`settings.js:34-35`, `sync.js:360`).
- Slider sem `aria-valuetext`; `output#fs-val` com `aria-live` anuncia a cada passo.
- "Banco: ainda sem versão baixada" (`settings.js:37`) aparece para quem nunca terá banco.
- Lembrete só no Android (`settings.js:51`) e promete algo que a web não faz.
- Filtro padrão com 2 opções e cópia que não diz que vale só neste aparelho (`settings.js:52-53`).
- "Sobre" quase vazio; `MQ.VERSION = '1.6.0'` fixo (`settings.js:5`).

## Login (LOG)

Compartilhados: C-3, C-9, C-10, C-12, C-18.

**P1**
- **LOG-1 · O painel de marca flutua com margens.** `main{padding:28px 36px 60px}` (`app.css:121`) vaza para `<main id="login">`, que só define grid e fundo (`:1028`). O painel índigo ocupa x=36..720 e y=28..840 em 1440×900. No celular soma 84 px de padding embaixo (`:184`) de uma barra que o login não tem. `#login{padding:0; max-width:none}`.
- [x] **LOG-2 · Sem Google (único estado real hoje), o aviso domina e o botão não parece o primário.** `auth.js:121`. `.lg-warn` de 171 px abre com "…ainda não está disponível neste endereço"; "Continuar sem conta neste navegador" é branco com borda cinza e quebra em 2 linhas a 320 px. Avisar em 2 linhas, fazer "Continuar neste navegador" o primário. Feito: aviso de 2 linhas e "Continuar neste navegador" como botão primário.
- [x] **LOG-3 · Sem estado de carregamento.** `auth.js:25-35`, `:129`. Offline são 11,1 s antes de "Sem conexão com o Google"; se o popup nunca responde, o botão fica desabilitado para sempre. Checar `navigator.onLine`, mostrar "Abrindo o Google…" com spinner, teto de ~60 s. Feito: offline responde na hora, o botão mostra "Abrindo o Google…" e um popup mudo desiste em 2 min.

**P2**
- **LOG-4 · O botão se desloca 30–51 px quando o erro entra.** `app.css:1036` (`align-self:center`). Ancorar no topo ou reservar a altura do erro.
- **LOG-5 · O logo some no painel claro e vira placa clara no escuro.** O tile `#4338A8` é igual ao fundo `--accent`; no escuro o painel é o objeto mais claro da tela. Usar o glifo sem tile em `currentColor`.
- **LOG-6 · O aviso de acesso não cobre o que o Google vai pedir.** `auth.js:120` fala de "pasta oculta e e-mail"; `SCOPE` (`auth.js:8`) também pede `drive.file` e `profile`. Pedir `drive.file` só ao administrador, no momento de publicar.
- **LOG-7 · Telas baixas, paisagem e zoom: o botão sai da dobra e o erro é cortado.** 844×390, 390×500, 320×568, 195×422. Rodapé `sticky` com a ação, ocultar `.lg-points` abaixo de ~640 px de altura, `scrollIntoView` no erro.
- **LOG-8 · O celular nunca diz o que é o Pulse.** `auth.js:113`; `.lg-brand` é `display:none` abaixo de 861 px (`app.css:1050`). O `h1` é só "Entrar".
- **LOG-9 · O painel de marca (`aria-hidden`) esconde os benefícios do leitor de tela** (`auth.js:113`).
- **LOG-10 · "Funciona até sem internet" não vale antes do primeiro login.** O service worker só registra no fim de `init()`, depois do `gate` (`app.js:97` depois de `:87`). Registrar antes do `gate`.
- **LOG-11 · O app vazio aparece antes do login em conexão lenta.** `app.css:1027` (`body.logged-out .shell`) só entra depois do `gate`: 42 frames (~717 ms) com CPU 6× e 3G. `<body class="logged-out">` no HTML.
- **LOG-12 · Sem privacidade, termos nem ajuda.** Nenhum link na tela, e o Google exige política de privacidade na verificação do app.
- **LOG-13 · Tablet em paisagem recebe o layout de PC.** Quebra em 860 px (`app.css:1049`); o DESIGN.md diz "só o cartão" para tablet.

**P3**
- Bolinhas índigo decorativas (`.lg-points li::before`, `app.css:1059`); texto do painel (4 itens) diverge do cartão (3) em `auth.js:115,118`.
- `.lg-mark b` com peso 700, DESIGN.md pede 800.
- Erros sem ícone e com código cru ("(userinfo)", `auth.js:137`); `access_denied` e `popup_closed` dão o mesmo "O login foi cancelado." (`auth.js:135`).
- `role="alert"` em contêiner que começa `hidden`.
- Entrada em corte seco, sem "Entrando como…"; o Início diz "Boa tarde" sem o nome de `MQ.local.sync.name`.
- Script do Google carrega sempre (`index.html:53`).
- `<title>` igual no login e no app.
- `straggler` "erros" sozinho na 2ª linha (`.lg-brand li`, `app.css:1032`).
- Cancelar o modal "Outra conta neste navegador" volta sem mensagem.
- Dois `<main>` no DOM; safe-area só no topo e somada duas vezes (`app.css:168` e `:1063`); `h1` "Entrar" repete a palavra do botão.

---

# Ordem sugerida

1. **Uma regra de CSS:** DES-2 (barras de instituição), C-11 (`::placeholder`), C-8 (`kbd.hint`), LOG-1 (padding do login).
2. **Um bloco de CSS/JS compartilhado, que fecha vários P1 e P2:** C-22 (precache completo do SW) com C-27 (aviso de versão), C-24 (`defer`), C-1 (44 px por `pointer: coarse`), C-12 (`scroll-padding`), C-3 (restaurar foco e trap), C-7 (`saveNow`), C-2 (ícones de acerto/erro).
3. **Decisões de produto antes de código:** C-21 (DESIGN.md), CFG-4 (estrutura de Configurações), NOT-6 (leitura de nota sem tentativa), DES-4 ("Onde focar" fica ou sai), C-17 (medir a linha do enunciado).
4. **Telas, na ordem do impacto:** SIM (P1-1 a P1-5), LST-1 a LST-3, DES-1 e DES-3, NOT-1 e NOT-2, CFG-1 a CFG-3, QST-1 e QST-2, LOG-2 e LOG-3.

# Fora do que as críticas verificaram

- Login real do Google, publicação no Drive e sincronização real não foram testados em nenhuma rodada (`googleWebClientId` vazio).
- Leitor de tela real, toque físico, Safari/iOS e zoom real do navegador também ficaram de fora. O tablet foi medido só em 960×640.
- A auditoria técnica (`audit.md`) mediu em Edge sem janela, 390×844; Safari/iOS, leitor de tela, Resolver/Simulado por teclado e gráficos com dados seguem sem teste.
- Divergências já anotadas acima: `kbd.hint` (2,33 contra 3,79:1), linha do enunciado (64–68 contra 74–88 caracteres) e chip longo em NOT-3 (reproduzido só por um avaliador).
