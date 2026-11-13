# Crítica de design: Configurações (Pulse)

Data: 2026-11-13 · Nota: **24/40 (Aceitável)** · P0: 0 · P1: 5 · P2: 11 · P3: 6

**Método:** dual-agent. A é a revisão de design e B é o detector com medições em Playwright headless. Rodaram isolados e sem ver o resultado um do outro, em 390×844 (toque, UA móvel), 960×640 (toque, `pointer: coarse`) e 1440×900, em claro e escuro. Estados: sem conta (o único real hoje, porque `googleWebClientId` está vazio em `config.js`), conta simulada com e-mail longo, administrador, Android simulado (stub de `window.Capacitor` só no navegador), offline por `setOffline`, Google bloqueado, 500 e 401 do Drive, backups válidos e inválidos (vazio, binário, HTML, JSON quebrado, sem `questions`, 60 MB), diálogos de sair/apagar, zoom 200% emulado e 320 px. Referência: `PRODUCT.md` ("toda tela responde o que faço agora?" e "leitura longa e uso com uma mão") e `DESIGN.md` (seção Configurações). Nenhum arquivo do projeto foi alterado e nenhum snapshot foi gravado em `.impeccable/critique/` (pedido: não editar nada). Não houve overlay no navegador do usuário (o live-server injetaria no HTML). Login real do Google, publicação no Drive e sincronização real **não foram testados**; os itens que dependem disso estão marcados "lido no código". Servidores das portas 8793 e 8794 encerrados (nada escutando).

Alvo: `MQ.views.configuracoes` em `www/js/settings.js` (99 linhas), cartão de conta em `www/js/sync.js:360-364`, backup em `www/js/editor.js:215-232`, estilos `.set-*` em `www/css/app.css:595-605` e `:945-975`, item de navegação em `www/index.html:24`.

## Resumo

Não há P0: em nenhum fluxo testado a pessoa fica sem conseguir trocar o tema, ajustar o enunciado, definir a meta, exportar ou restaurar. Tema, tamanho do enunciado (com prévia em Literata), meta e filtro padrão aplicam na hora e persistem após recarregar. Restaurar de fato **mescla** (a resposta local foi mantida, a edição local mais nova venceu), os diálogos de sair e apagar têm texto honesto e foco inicial em Cancelar, o contraste de texto é bom (mínimo 5,39:1) e todas as 20 paradas de Tab têm anel de foco.

O problema é de outra natureza. Esta tela existe para a pessoa **ter certeza de que os dados estão salvos**, e é justamente isso que fica invisível ou mentiroso:

- No celular e no tablet o texto do status de sincronização some (`.sync-label { display: none }`, `app.css:147`) e sobra um ponto de 8 px.
- "Sincronizar agora" sem internet ou sem Google configurado não dá retorno nenhum.
- "Restaurar backup" diz "0 questões novas, 12 repetidas (serão ignoradas)" quando na verdade restaurou respostas e anotações, e o contador da tela continua em zero depois.
- O primário da tela é um comando manual que quase nunca é necessário, e o botão que apaga os dados do aparelho fica ao lado de "Sair", com o mesmo peso e um clique só.
- O DESIGN.md promete para o celular "lista com o valor atual à direita, cada item abre a subtela" e para o PC "índice | conteúdo | status". O que existe é **uma única rolagem de cartões nos três formatos**, sem painel de status, sem "alterações pendentes" e sem "último backup".

## Nota

| # | Heurística | Nota | Problema principal |
|---|---|---|---|
| 1 | Visibilidade do status | 1 | Texto do status oculto em ≤ 860 px (`app.css:147`); offline vira ponto vermelho; sem `aria-live`; exportar e sincronizar não dão toast; contador fica velho após restaurar. |
| 2 | Linguagem do usuário | 3 | Português claro. "Banco: ainda sem versão baixada" (`settings.js:37`) é jargão; "Importar backup" na confirmação e "Restaurar" no botão. |
| 3 | Controle e liberdade | 3 | Esc, Cancelar e foco devolvido nos diálogos. "Sair e apagar" não oferece exportar antes e não tem desfazer. |
| 4 | Consistência | 2 | Celular e PC divergem do DESIGN.md; dois `h2` seguidos; "Publicar banco" em Conta e não em Administrador; "Cadastrar questões" é link com chevron no meio de botões. |
| 5 | Prevenção de erros | 3 | Diálogos bons e meta validada. Falta validar o esquema do backup; "Sair e apagar" sem fricção; meta decimal aceita. |
| 6 | Reconhecimento | 3 | Valor atual de cada controle visível. Falta "último backup" e "N alterações pendentes". |
| 7 | Flexibilidade | 2 | Índice sem scroll-spy e fixo só no PC; 7 Tabs de chips antes do primeiro controle; sem busca. Ctrl 1–6, Ctrl K e `?` funcionam. |
| 8 | Minimalismo | 3 | Poucos controles. Atalhos de teclado ocupa ~28% da página no celular (`settings.js:60`). |
| 9 | Recuperação de erros | 2 | Erro de sync só no ponto vermelho no celular; erro técnico "Google Drive respondeu 500…" em toast que passa rápido; "Entrar com o Google" sem Google configurado dá "Não foi possível entrar." |
| 10 | Ajuda | 2 | Não explica o que é sincronizado, quanto demora, como confirmar que está salvo; texto de restaurar curto e enganoso. |
| **Total** | | **24/40** | **Aceitável** |

## Veredito de especificidade

**Intercambiável, com um gesto autoral.** É uma página de ajustes padrão: cartões brancos com `h2`, linhas rótulo e controle, interruptor segmentado, botões. Nada fala de residência, de "não perder o caderno de estudo" ou de Pulse. O único trecho autoral é a prévia do enunciado em Literata dentro da caixa `--sunk` (`settings.js:45`), que reage ao controle de tamanho em tempo real. Faltam o "pulso" da marca no status de sincronização, um selo "tudo salvo" e qualquer hierarquia entre o que importa (dados) e o que é acessório (atalhos de teclado).

**Detector (`impeccable detect --json`):** `www/js/settings.js` deu **0** (limpo). `www` inteiro deu 63 achados (exit 2): 41 `design-system-font-size`, 12 `design-system-radius`, 9 `design-system-color` e 1 `low-contrast`. **Nenhum cai em `.set-*`** (`app.css:595-605` e `:945-975`). Falsos positivos: 14 dos 41 de tamanho de fonte (12 px e 22 px, que a prosa do DESIGN.md linha 236 documenta na escala 12·13·14·16·18·22·28; o detector só lê o YAML); as 9 cores são as do marca-texto e véus `rgba(0,0,0,…)`. O `low-contrast` é real, mas é do rail (`.nav .hint`, `kbd.hint` a 3,79:1 no claro e 4,03:1 no escuro), não da tela. **Falsos negativos:** os 3 `style="…"` inline de `settings.js` (largura 96 px da meta), as bordas de controle abaixo de 3:1, a falta de focus trap, o overflow com e-mail longo, o texto do status oculto no celular e o mínimo de 80% do enunciado.

## O que funciona

1. **Prévia do enunciado com `--font-scale`** (`settings.js:45`, `solve.js:292`). Medido: 17 px a 100%, 27,2 px a 160%, 13,6 px a 80%; persiste após recarregar. É a única peça com cara de produto.
2. **Diálogos destrutivos bem escritos.** Texto direto, `danger` só no botão de confirmar "Sair e apagar", foco inicial em Cancelar, Esc fecha, foco volta ao botão de origem (medido em celular e PC), alvos de 44/40 px.
3. **Restaurar mescla de verdade e não derruba a tela com lixo.** Teste: a resposta local foi mantida, a edição local mais nova venceu, a questão e a resposta do arquivo entraram; cinco tipos de arquivo inválido mostram toast "Arquivo inválido…" sem erro no console. Cancelar não altera nada.
4. **Contraste e foco de teclado.** Texto secundário 5,89:1 (claro) e 5,39:1 (escuro); anel âmbar em todas as 20 paradas de Tab; 0 alvos abaixo de 44 px no celular e 0 abaixo de 40 px no PC.

## Problemas prioritários

### P1

**[P1-1] Status de sincronização invisível no celular e no tablet, e "Sincronizar agora" não responde**
- Onde: celular e tablet (≤ 860 px), claro e escuro. `app.css:147` (`.sync-label { display: none }`), `settings.js:35` (`.set-pill`), `app.css:604-605`, `sync.js:229` (ramo offline).
- Evidência: `getComputedStyle(.sync-label).display === 'none'` a 390 e 960. Offline, o estado vira "Sem internet. Sincroniza quando voltar." mas só um ponto vermelho aparece e nenhum toast. Sem Google configurado, o clique não faz nada. Com requisição pendurada, o rótulo (oculto) diz "Sincronizando…", o botão não é desabilitado, não tem `aria-busy` e não há timeout (medido 2,5 s). Com 500 do Drive, o toast é técnico: "Google Drive respondeu 500 ao procurar seus dados." Nem `.sync-pill` nem `.set-pill` são `aria-live`. Depois do clique o foco vai a `BODY`, porque `MQ.render()` recria a tela.
- Por que importa: o princípio central do produto é "dados são do usuário e sincronizam". A cor como único sinal contraria o próprio PRODUCT.md ("certa e errada nunca dependem só da cor"), e um leitor de tela não recebe nada.
- Correção: mostrar o texto do status em qualquer largura nesta tela, como linha de estado no topo ("Tudo salvo às 14:32", "Sem internet: 3 alterações aguardam", "Falha ao sincronizar. Tentar de novo"). Botão com estado carregando (desabilitado, "Sincronizando…"), `role="status"`, toast também no ramo offline e na falta de conta, mensagem sem "Google Drive respondeu 500". Preservar o foco no botão após render.
- Comando: `/impeccable clarify`, depois `/impeccable harden`.

**[P1-2] Restaurar backup: o texto engana, o contador não atualiza e nada confirma o resultado**
- Onde: `editor.js:222-232`, `settings.js:56,58`. Todos os formatos.
- Evidência: com um backup de só 5 respostas e 1 anotação, a confirmação diz "0 questões novas, 12 repetidas (serão ignoradas). Continuar?" e o toast "0 questões importadas, 12 repetidas ignoradas (dados mesclados)". O estado passou a ter 5 respostas e 1 anotação, mas a tela continuou "12 questões · 0 respostas · 0 anotações neste aparelho" (`MQ.touch()` não re-renderiza). A concordância falha ("1 questões novas"). Sem validação de esquema: `{"questions":{"x2":{"id":"x2"}}}` entra como questão vazia e passa a contar no banco.
- Por que importa: é a ação mais carregada de medo da tela. A cópia só conta questões e listas, então contradiz a promessa "restaurar mescla, nunca apaga" (PRODUCT.md) com a sensação de "nada entrou". Quem restaura depois de limpar o navegador acha que o arquivo não funcionou.
- Correção: contar por coleção ("Vai juntar 5 respostas, 1 anotação e 0 questões novas. Nada do que você já tem será apagado."), título "Restaurar backup" igual ao botão, `MQ.render()` depois, toast "Restaurado: 5 respostas, 1 anotação". Rejeitar questões sem enunciado e alternativas.
- Comando: `/impeccable clarify`, depois `/impeccable harden`.

**[P1-3] O primário é "Sincronizar agora" em qualquer estado, e "Sair e apagar dados daqui" tem o peso de "Sair"**
- Onde: `sync.js:363` (`btn primary`, `btn`, `btn ghost`, `btn ghost`), todos os formatos.
- Evidência: quatro botões na mesma linha. O app já sincroniza sozinho (`sync.js:283-287`: a cada 5 min, ao ocultar a aba, ao voltar online), então o botão mais forte da tela é um comando raro. Com "tudo em dia" ele continua sendo o ponto de maior peso; com erro, a ação certa seria "Tentar de novo" ou "Reconectar". "Sair e apagar" apaga questões e respostas com **um clique** (medido: 12/1 para 0/0, tema e escala resetados), em estilo fantasma ao lado de "Sair"; o botão de confirmar é `danger`, mas a confirmação não é digitada e o texto "o que não chegar ao Drive será perdido" (`auth.js:92`) não oferece exportar antes. No celular os quatro quebram em duas linhas desalinhadas.
- Por que importa: o PRODUCT.md pede "uma ação principal" que responda "o que faço agora?". Aqui a resposta é sempre a mesma, mesmo quando errada. E a ação irreversível está a um toque polegar de distância da inofensiva.
- Correção: o primário muda com o estado (tudo salvo: nenhum; erro: "Tentar de novo"; sem sessão: "Entrar com o Google"). "Sincronizar agora" vira botão secundário. "Sair e apagar dados daqui" sai da linha, vai para um item separado, em `danger`, com "Exportar backup antes" como ação do próprio diálogo.
- Comando: `/impeccable layout`, depois `/impeccable clarify`.

**[P1-4] Estrutura diverge do DESIGN.md e faltam os dados que dão segurança**
- Onde: DESIGN.md "Configurações" e PRODUCT.md "Configurações: status de sincronização detalhado, backup e restauração, meta, lembrete, atalhos".
- Evidência: celular com página de 2.601 a 2.923 px (3,1 a 3,5 telas), chips de âncora no lugar de "lista com valor à direita e subtelas"; "Sincronizar agora" a y=338–401 e "Exportar backup" a y=1.503 (1,8 tela de rolagem). PC a 1440: colunas `210px 720px`, sem painel de status e backup (~227 px vazios à direita). Não existem "alterações pendentes", "último backup" nem versão do banco como bloco de status. Os atalhos de teclado aparecem em celular e tablet para quem não tem teclado.
- Por que importa: no celular com uma mão, a informação que mais acalma (está salvo?) e a ação mais importante (levar um backup) ficam respectivamente escondida e a quase duas telas do polegar.
- Correção: celular como lista com valor atual (Conta e sincronização "Tudo salvo", Aparência "Automático · 100%", Estudo "20/dia", Dados e backup "Último: 12/11") e subtelas; PC com painel fixo à direita (status, pendências, último backup). Se a decisão for não fazer, o DESIGN.md precisa dizer.
- Comando: `/impeccable layout`, depois `/impeccable adapt`.

**[P1-5] Sem conta, o risco de perder tudo não é um aviso, e "Entrar com o Google" é primário mesmo sem Google configurado**
- Onde: `sync.js:361,364`.
- Evidência: no estado padrão (o único real hoje) a tela mostra "Sem conta, seus dados ficam só neste navegador." em cinza pequeno (`--ink-3`, 13,6 px), seguido do botão primário "Entrar com o Google". O clique só mostra "Não foi possível entrar." (`sync.js:370`) depois de até 10 s (`auth.js:31`, lido no código). O único backup é o arquivo manual, 1.503 px abaixo. A tela de login (`auth.js:121`) avisa melhor do risco do que esta.
- Por que importa: quem usa "sem conta" não tem cópia nenhuma, e a tela promete uma saída que não funciona.
- Correção: nesse estado, aviso em destaque no topo ("Seus dados só existem neste navegador. Exporte um backup") com "Exportar backup" como ação principal; esconder ou desabilitar "Entrar com o Google" quando `MQ.syncConfigured()` for falso, dizendo o motivo.
- Comando: `/impeccable onboard`, depois `/impeccable clarify`.

### P2

**[P2-6] Modal sem focus trap nem `inert` no fundo.** `util.js:104-105` só trata Esc. O 2º Tab sai do diálogo para o rail; o fundo não é `inert` nem `aria-hidden`. Pesa mais aqui porque os diálogos protegem ações destrutivas. Global (já documentado em Anotações, P2-8). `/impeccable harden`.

**[P2-7] Tablet (861–1199 px com toque): 9 de 20 alvos têm 40 px.** `app.css:950` e `:972` só aplicam 44 px até 860 px; `:982` dá 40 px em `.btn.sm`. Medido a 960×640 com `pointer: coarse`: Sincronizar agora, Reconectar, Sair, Sair e apagar, Exportar, Restaurar, CSV, campo da meta (40 px) e o slider `#fs-range` (32 px). Global (já documentado em Anotações, P1-4). `/impeccable adapt`.

**[P2-8] Contraste não textual abaixo de 3:1.** Borda do campo da meta e dos `.btn` 1,89:1 (claro) e 1,64:1 (escuro); borda do chip do índice 1,72 e 1,77; trilho do controle segmentado 1,22 e 1,09. A borda dos cartões `.set-sec` (1,33 e 1,39) é estrutural e fica fora do critério. Quem tem baixa visão não distingue onde termina o campo da meta. `/impeccable colorize` (ajuste de `--line-2`).

**[P2-9] `kbd.hint` do rail a 3,79:1 (claro) e 4,03:1 (escuro), 11 px.** `app.css:113` (`--ink-3` com `opacity: .8`). É o único `low-contrast` do detector, vindo do shell, visível ao lado desta tela só em ≥ 861 px. `/impeccable polish`.

**[P2-10] Índice de âncoras fraco.** `settings.js:32,72`, `app.css:945-956`. Todos os links têm o mesmo `href="#/configuracoes"` (a URL não muda, não dá para linkar uma seção); sem scroll-spy nem `aria-current`; estático no celular e tablet (a 900 px de rolagem sai de vista), `sticky` só no PC; o 4º chip fica cortado a 390 px sem indício de rolagem; 7 Tabs de chips antes do primeiro controle ("Sincronizar agora" é o 8º, "Exportar backup" o 20º); `scrollIntoView({ behavior: 'smooth' })` ignora `prefers-reduced-motion` (o CSS zera as transições, o JS não). `/impeccable layout`, depois `/impeccable harden`.

**[P2-11] Meta diária aceita decimal e exibe o valor errado.** `settings.js:78-84`: digitar 12,7 grava 13 (`Math.round`), o toast diz "Meta diária: 13" e o campo continua mostrando 12.7. Largura de 96 px em `style` inline (`settings.js:49,50`), fora dos tokens. Corrigir com `e.target.value = n` e `step="1"`/`inputmode="numeric"`. `/impeccable harden`.

**[P2-12] Tamanho mínimo de 80% quebra o mínimo do produto.** `settings.js:44` (`min="80"`) e `solve.js:293` (`Math.max(0.8, …)`): a prévia a 80% mede 13,6 px, e o PRODUCT.md exige enunciado de pelo menos 15 px (15/17 = 88%). O texto "nunca fica abaixo de 80%" (`settings.js:46`) confirma o limite. Subir o piso para 88% (múltiplo do passo de 4) nos dois lugares. `/impeccable typeset`.

**[P2-13] Exportar backup não dá retorno nem deixa registro.** `settings.js:95`, `editor.js:215`. O download ocorre (`pulse-backup-AAAA-MM-DD.json`) sem toast e nada marca "último backup em…", então a pessoa nunca saberá se tem um backup recente. O backup também não leva as preferências locais (tema, escala, filtro padrão). Toast "Backup salvo: pulse-backup-….json" e linha "Último backup: 13/11 11:41" gravada em `MQ.local`. `/impeccable clarify`.

**[P2-14] Atalhos de teclado ocupam ~28% da página no celular e no tablet.** `settings.js:60`, ~740 px de 2.600 para quem não tem teclado, antes de "Sobre". Esconder em `pointer: coarse` sem teclado ou recolher em `<details>`. `/impeccable distill`.

**[P2-15] Vazamento de layout com e-mail longo e a 320 px.** Medido com e-mail de 95 caracteres: o `.kv dd` não quebra (`overflow-wrap: normal`) e a página rola 586 px de largura contra 390 (`#s-conta`, `.set-wrap`, `#set-sync`). A 320 px o e-mail ultrapassa o cartão e o 6º item da barra inferior ("Ajustes") é cortado; a 200% de zoom a barra tem largura mínima de ~586 px (problema do shell, já documentado em Anotações). Um e-mail comum de 95 caracteres é raro; o risco é real em contas institucionais. `/impeccable adapt`.

**[P2-16] "Publicar banco para todos" fica em Conta, sem bloqueio para 0 selecionadas (admin; lido no código, não executado).** `sync.js:207-220` não checa a contagem antes de `publishBank(selection(box))`. Com 0 itens marcados, o que estava no banco publicado viraria lápide para todos os aparelhos (o histórico se preserva por causa dos IDs estáveis). O botão está em `settings.js:38`, e não em Administrador como diz o DESIGN.md. Desabilitar "Publicar" com 0, mostrar "Vão sair do banco: N questões" e mover para Administrador. `/impeccable harden`.

### P3

**[P3-17] Dois `h2` seguidos.** `settings.js:34-35` e `sync.js:360`: "Conta e sincronização" > pílula (ponto solto no celular) > "Conta Google". Fundir os títulos. `/impeccable polish`.

**[P3-18] Slider do enunciado sem `aria-valuetext`.** O valor lido é "100", sem "%"; o `output#fs-val` é `aria-live="polite"` e anuncia a cada passo do arrasto. `/impeccable harden`.

**[P3-19] "Banco: ainda sem versão baixada"** (`settings.js:37`) aparece para quem nunca terá banco (`bankManifestId` vazio em `config.js`). Esconder para não administrador ou trocar por texto que o usuário entenda. `/impeccable clarify`.

**[P3-20] Lembrete só no Android.** `settings.js:51`: na web o texto "disponível no app para Android" promete um recurso que a pessoa não pode usar. No Android simulado o switch é 50×30 com área de 44 px e a hora vem antes do interruptor. `/impeccable clarify`.

**[P3-21] Filtro padrão com 2 opções** (`settings.js:52-53`; o DESIGN.md fala em "filtros padrão", plural) e a cópia da linha não diz que vale só neste aparelho, ao contrário da de Aparência. `/impeccable clarify`.

**[P3-22] "Sobre" quase vazio** (`settings.js:65`): sem versão do banco, contato ou onde ler o que o app acessa no Drive. `MQ.VERSION = '1.6.0'` fixo em `settings.js:5`. `/impeccable clarify`.

## Pontos em que as duas avaliações concordam

- Sem focus trap nos diálogos; ambas mediram o Tab saindo para o rail.
- Texto do status oculto/sem `aria-live` no celular; ponto como único sinal.
- "Sincronizar agora" sem retorno offline; foco perdido depois do clique.
- Restaurar mescla, mas a cópia só conta questões e listas.
- Duas `h2` seguidas; índice com `href` repetido e sem `aria-current`.
- Tablet com toque: alvos de 40 px (A: 6 a 11; B: 9 de 20) e slider de 32 px.
- Recursos ausentes: status detalhado, "alterações pendentes", painel de status no PC, subtelas no celular.

**Divergências:** B classificou o overflow com e-mail longo e o "Sair e apagar" sem fricção como P1; mantive o primeiro em P2 (e-mail de 95 caracteres é caso extremo) e o segundo dentro do P1-3. A tratou o clique de "Entrar" sem Google configurado como P1; B, como P2; mantive P1 por ser a única ação principal da tela no estado real. Nenhuma das duas verificou qual lista de atalhos está certa: o DESIGN.md cita `H` e `C` e `settings.js:10-11` lista outras teclas; conferir antes de corrigir um dos dois.

## Red flags por persona

- **Casey (celular, uma mão).** "Sincronizar agora" a 338–401 px do topo, longe do polegar. Backup a 1,8 tela de rolagem. Chip "Dados e backup" cortado na borda a 390 px. Sem retorno ao tocar offline. A 320 px o e-mail vaza e a barra corta "Ajustes". Quatro botões de conta quebrados em duas linhas desalinhadas.
- **Alex (PC, teclado).** 7 Tabs de chips antes do primeiro controle; "Exportar backup" é o 20º Tab. Índice sem scroll-spy. Modal sem trap. Sem painel lateral de status. `Ctrl 6` funciona, mas dentro da tela não há atalho para pular de seção.
- **Sam (acessibilidade).** Status só por cor no celular e sem `aria-live`. Prévia a 80% = 13,6 px, abaixo dos 15 px do PRODUCT.md. Bordas de campo a 1,64–1,89:1. Links de âncora com `href` repetido. Rolagem suave ignora `prefers-reduced-motion`. Slider sem `aria-valuetext`.
- **Residente em sessão longa que precisa ter certeza de que está salvo (persona do projeto).** É a pessoa mais mal atendida: sem "tudo salvo", sem "N alterações pendentes", sem "último backup", sem retorno de falha e, depois de restaurar, o contador diz zero. Quem está sem conta lê a frase mais fraca do cartão e vê um botão de entrar que não funciona.

## Observações menores

- `.kv` com `auto 1fr` quebra "Última sincronização" em duas linhas no celular.
- "Remover questões repetidas" sem repetidas só dá o toast "Nenhuma questão repetida." (`dedupe.js:172`).
- O foco inicial ao navegar para Configurações vai para `main`, mas o primeiro Tab cai nos chips.
- O toggle `.sw` do lembrete não renderiza no navegador (só no Android), então contraste e papel `switch` não foram medidos.
- "Cadastrar questões" (administrador) é `.set-link` com chevron; o resto da seção é botão.
- Importar PDF (PRODUCT.md) e zerar histórico com confirmação digitada (DESIGN.md, em Desempenho) não estão aqui, de acordo com o escopo "depois".
- Arquivo de 60 MB: o diálogo de confirmação apareceu em 0,64 s; a importação em si e a cota do IndexedDB não foram testadas.

## Perguntas para considerar

1. Se esta tela só tivesse que dizer "seus dados estão salvos? sim, não ou há N pendentes", onde isso estaria no celular hoje?
2. O app já sincroniza sozinho. Por que o botão mais forte da tela é um comando manual?
3. Quem restaura um backup depois de limpar o navegador e lê "0 questões novas" acha que o arquivo funcionou?
4. Por que o celular mostra a lista de atalhos de teclado antes de uma linha que diga "Último backup"?
5. Se o Google nunca for configurado neste site, "Entrar com o Google" é uma função ou uma promessa?
6. A lista com subtelas do DESIGN.md foi decisão ou meta que ficou para depois? Se for meta, o documento deveria dizer.

## Lacunas da avaliação

- Login real do Google, publicação no Drive e sincronização real: não testados (Google não configurado). Estado "conectado" simulado por `MQ.local.sync`.
- P1-5 (tempo do clique em "Entrar") e P2-16 (publicar com 0 selecionadas) foram lidos no código, não executados.
- Zoom 200% emulado com meia viewport, não com zoom do navegador. Modais testados em detalhe só a 1440 (mesmo código nos outros formatos).
- Importação de arquivo de 60 MB e timeout da sincronização pendurada (só medi 2,5 s) não verificados.
- A ordem de foco entre o rail e o índice não foi provada.
