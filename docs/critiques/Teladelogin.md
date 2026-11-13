# Crítica de design: Tela de login (Pulse)

Data: 2026-11-13 · Nota: **24/40 (Aceitável)** · P0: 0 · P1: 3 · P2: 12 · P3: 14

**Método:** dual-agent. A é a revisão de design e B é o detector com medições em Playwright headless. Rodaram isolados e sem ver o resultado um do outro, em 390×844 (toque, UA móvel), 960×640 (toque) e 1440×900, em claro e escuro, mais larguras de quebra (319 a 1200), alturas curtas (390×600, 390×500, 844×390, 960×500, 320×568), 195×422 (equivale a zoom 200%) e 320×256. Referência: `PRODUCT.md` ("toda tela responde o que faço agora?" e "leitura longa e uso com uma mão") e `DESIGN.md` (seção "Entrar (tela de login do site)").

**Estados:** (1) sem Google configurado, que é o único real hoje, porque `googleWebClientId` está vazio em `www/js/config.js`; (2) com Google configurado, simulado com `page.route` (servindo um `config.js` de teste) e um stub de `window.google.accounts.oauth2`; (3) erros forçados: popup fechado, popup bloqueado, acesso negado, escopo negado, userinfo sem e-mail, erro sem tipo, Google bloqueado/offline e popup que nunca responde; (4) sucesso simulado, inclusive com outra conta já gravada no navegador; (5) teclado, `prefers-reduced-motion`, `data-theme`; (6) CPU 6× e rede 3G lenta; (7) service worker.

**Limites:** o login real do Google (janela de consentimento, tela de "app não verificado", conta fora da lista de testadores) **não foi testado**; tudo isso é stub ou "lido no código". Também não houve leitor de tela real (só `ariaSnapshot`), safe-area em aparelho com entalhe, Firefox/Safari, zoom real do navegador nem instalação como PWA. Nenhum arquivo do projeto foi alterado (`git status --short` idêntico ao do início) e nenhum snapshot foi gravado em `.impeccable/critique/` (pedido: não editar nada). Não houve overlay no navegador do usuário: o `live-server` injetaria script no HTML. Servidores 8801 e 8802 encerrados (só sobram conexões TIME_WAIT).

Alvo: `showLogin` e `A.gate` em `www/js/auth.js:103-153`, CSS `#login` e `.lg-*` em `www/css/app.css:1026-1065`, montagem em `www/js/app.js:87` (`await MQ.auth.gate()`), script do Google em `www/index.html:53`.

Capturas (pastas no scratchpad da sessão):
- A: `C:\Users\GUILHE~1\AppData\Local\Temp\claude\c1f5f307fdddebd3\6e81611b-fb5e-4273-b31c-b9ee43a97b3c\scratchpad\A\` (`nocfg-{cel|tab|pc}-{light|dark}.png`, `cfg-*`, `cel-390x600-*`, `cel-land-844x390-*`, `cel-320x568-*`, `zoom200-*`, `bp-860x800-*`, `bp-861x800-*`).
- B: `C:\Users\GUILHE~1\AppData\Local\Temp\claude\c1f5f307fdddebd3\6e81611b-fb5e-4273-b31c-b9ee43a97b3c\scratchpad\B\shots\` (`cel-light.png`, `pc-dark.png`, `tab-light.png`, `err-*.png`, `focus-pc-light.png`, `flash-cpu6x+3g-00.png`, `sw-offline-login.png`, `lay-*.png`).

## Resumo

Não há P0. Em nenhum estado testado a pessoa fica sem poder entrar: o botão tem 48 px, o anel de foco é visível nos dois temas, Enter e Espaço funcionam, todo texto passa de 4,5:1 (mínimo 5,34:1), não há rolagem horizontal em nenhum tamanho, o console está limpo e o aviso de "sem Google" é honesto sobre o risco de perder o progresso. É uma tela enxuta, com uma ação só.

O que pesa é outra coisa. A porta de entrada **parece quebrada no PC e no tablet em paisagem, não diz o que o app é no celular e some com o feedback justamente quando algo dá errado**:

- O `<main id="login">` herda `padding: 28px 36px 60px` do `main` global (`app.css:121`). O painel de marca, que devia ocupar a tela, fica como um retângulo flutuando a 36 px da esquerda, 28 px do topo e 60 px da base.
- No estado de hoje (sem Google), o maior bloco da tela é um aviso âmbar de 171 px que fala de "neste endereço", e o botão que resolve é idêntico em peso a qualquer botão secundário.
- Depois do toque não existe estado de carregamento: o botão só esmaece. Offline, são 11 s de silêncio antes de "Sem conexão com o Google". Se o popup nunca responder, o botão fica preso para sempre.
- Quando o erro entra, o botão sobe 30 a 51 px sob o dedo e o foco cai no `body`.
- No celular, o único formato em que o estudante abre o link de um colega, o texto "Questões de residência no seu ritmo" **nunca aparece**: ele mora no painel de marca, que é oculto até 860 px.

## Nota

| # | Heurística | Nota | Problema principal |
|---|---|---|---|
| 1 | Visibilidade do status | 2 | Sem spinner nem rótulo "Abrindo o Google…" (só `opacity: .6`); 11,1 s de silêncio offline; sem sinal de "Entrando…" ao concluir. |
| 2 | Linguagem do usuário | 3 | Português correto. "Pasta oculta do app", "neste endereço" e "Configurações › Dados e backup" soam de desenvolvedor. |
| 3 | Controle e liberdade | 2 | "Continuar sem conta" grava `localOnly` e nunca mais mostra o login, sem dizer como trocar depois; a tentativa pendente não se cancela. |
| 4 | Consistência e padrões | 3 | `main` global vaza para o login; borda do botão fora da marca do Google; 3 benefícios no cartão e 4 no painel; logo sumindo no claro. |
| 5 | Prevenção de erros | 2 | O caminho único de hoje não tem proteção contra perda de dados; `access_denied` vira "O login foi cancelado.", escondendo "sua conta não está liberada". |
| 6 | Reconhecimento | 3 | Tudo visível, aviso de acesso antes do botão. Nada lembra depois de "Continuar sem conta" que falta fazer backup. |
| 7 | Flexibilidade | 3 | Uma ação, conta lembrada, abre offline depois do primeiro login, Enter funciona. |
| 8 | Minimalismo | 2 | 55 palavras no cartão do celular (76 sem Google); frase, 3 benefícios e nota de permissão competem com a ação; painel índigo domina o PC. |
| 9 | Recuperação de erros | 3 | Mensagens específicas, em português, `role="alert"`, ≥ 5,5:1. Perdem pontos pelo salto do botão, pelo foco no `body` e por "(userinfo)" cru. |
| 10 | Ajuda | 1 | Sem link de privacidade ou termos, sem ajuda para quem não tem conta Google, sem contato. |
| **Total** | | **24/40** | **Aceitável** |

## Veredito de especificidade

**Intercambiável, só com tinta do produto.** A composição é o login de SaaS de manual: painel de marca à esquerda, cartão à direita, lista de benefícios com bolinhas, botão do Google. Trocando logo e paleta, serviria a qualquer app de estudo. É do Pulse o glifo do pulso, o Manrope, o índigo, a frase "sem outra senha" e o aviso honesto de "sem sincronização". Não aparece nada do norte "Caderno de quem treina todo dia": nem questão, nem marca-texto, nem tesoura, nem o ciano. A palavra "residência" só existe no painel que o celular esconde.

**Deterministic scan (detector):**
- `impeccable detect --json www/index.html`: saída 2, 1 achado `low-contrast` (4,0:1, `#717187` sobre `#0f0f18`, no `.rail` escuro). Não é do login.
- `impeccable detect --json www`: saída 2, 63 achados (41 `design-system-font-size`, 12 `design-system-radius`, 9 `design-system-color`, 1 `low-contrast`), todos em `app.css`. Os que tocam o login: `app.css:1030` (`.lg-brand h2`, `2rem`), `:1034` (`.lg-mark`, `1.5rem`) e `:1057` (`.lg-points`, `.9375rem`), todos "fora da escala do DESIGN.md".
- Contra a página renderizada (`http://127.0.0.1:8802/`, login aberto, sem Google): 1 achado `straggler` em 1440×900 e 960×640 ("erros" sozinho na 2ª linha de `.lg-brand li:nth-of-type(2)`) e 0 achados em 390×844. Com `localhost` deu `ERR_EMPTY_RESPONSE` (IPv6), com `127.0.0.1` funcionou.
- **Falsos positivos ou ruído:** os 3 de tamanho de fonte são drift de documento, não defeito visível; os outros 60 são do resto do app (as cores do marca-texto, `app.css:514-519`, são intencionais).
- **O detector deixou passar** (medido ou lido): o padding herdado de `main`, o logo sem tile no claro, o botão que pula quando o erro aparece, o foco perdido, o botão preso quando o popup não responde, o painel `aria-hidden` que esconde conteúdo do leitor de tela, a borda de 1,72:1 do botão, o flash do shell vazio e o service worker que só registra depois do login.
- **Visual overlays:** não houve overlay no navegador do usuário (`live-server` não usado por ser somente leitura).

## Visão geral

**O que funciona:**
- **Aviso honesto sem Google** (`auth.js:121`): diz que nada sincroniza, que limpar o navegador perde o progresso e para onde ir (backup). Contraste 5,34:1 no claro e 6,97:1 no escuro.
- **Teclado e foco** corretos: foco inicial no corpo, como o DESIGN.md manda; primeiro Tab no botão, com anel de 2 px (`#B45309`, 4,58:1 no claro; `#FBBF24`, 11,75:1 no escuro); Enter e Espaço acionam; `prefers-reduced-motion` zera a transição e o `:active`; `lang="pt-BR"`, landmark `main`, `h1`, `role="status"` e `role="alert"` certos. `data-theme` sobrepõe o tema do sistema nos dois sentidos.
- **Alvo e leitura:** botão de 48 px (310×48 no celular, 372×48 nos outros), linha de 42 a 56 caracteres, sem rolagem horizontal até 320 px, 0 erros e 0 requisições falhas no console, só 1 fonte (`manrope.woff2`, 24,5 KB) baixada no login.

**A maior oportunidade:** transformar o login em uma única decisão com estado. Hoje ele é três blocos de texto (frase, benefícios, nota) e um botão claro e tênue; com o botão forte, o status visível ("Abrindo o Google…") e o erro sem deslocar o layout, ele passa a responder "o que faço agora?" de verdade.

## Problemas

### P0 (bloqueio)

Nenhum.

### P1 (corrigir antes de divulgar o link)

**P1-1. O painel de marca flutua com margens (bug do padding de `main`)**
- Onde: PC (1440×900) e tablet em paisagem (960×640, 1024×768), claro e escuro (`nocfg-pc-light.png`, `pc-dark.png`, `tab-light.png`).
- O quê: `main { padding: 28px 36px 60px }` (`app.css:121`) vaza para `<main id="login">`, que só define `min-height`, grid e fundo (`app.css:1028`). O painel índigo ocupa x=36..720 e y=28..840 numa janela de 1440×900, com `--paper` em volta: parece um cartão solto, não a "única superfície grande em índigo", que o DESIGN.md justifica justamente por ocupar a tela. No celular o mesmo vazamento soma `84px` de padding embaixo (`app.css:184`) de uma barra de abas que o login não tem.
- Por que importa: é a primeira tela do app; a margem irregular (36/28/60) lê como erro de layout e enfraquece a confiança antes do consentimento.
- Fix: `#login { padding: 0 }` (e `max-width: none`) ou trocar o seletor global para `main#view`. Com o painel de fato de ponta a ponta, usar `min-height: 100dvh` no painel.
- Comando: `/impeccable polish`.

**P1-2. Estado de hoje (sem Google): o aviso domina e o botão não parece o primário**
- Onde: todos os formatos e temas (`nocfg-*`; `cel-320x568-nocfg.png`).
- O quê: o `.lg-warn` de 8 linhas (171 px no celular, 42 caracteres por linha, 416–587 de 844) é o maior bloco da tela. Abre com "Entrar com Google ainda não está disponível neste endereço", que é frase de infraestrutura para um estudante, e termina em "Configurações › Dados e backup", uma tela que ele ainda não viu. O botão que resolve, "Continuar sem conta neste navegador", é branco com borda cinza, igual ao do Google, e o rótulo quebra em 2 linhas a 320 px (129×86 a 195 px).
- Por que importa: contraria "toda tela responde o que faço agora? com uma ação principal". O colega que recebe o link hoje encontra um alerta e um botão que parece desistir. Esse é o caminho feliz até o Google ser configurado.
- Fix: avisar em 2 linhas ("Ainda não dá para entrar com o Google. Seus dados ficam só neste navegador."), mover a nota de backup para uma linha pequena abaixo do botão, fazer "Continuar neste navegador" o botão primário (`--accent` com `--accent-ink`, como manda a regra "índigo é ação") e encurtar o rótulo.
- Comando: `/impeccable clarify`, depois `/impeccable bolder` no botão.

**P1-3. Sem estado de carregamento: 11 s de silêncio offline e botão preso**
- Onde: celular (`cfg-cel-dark-hang.png`, `offline-mid-844.png`, `offline-err-844.png`).
- O quê: ao clicar, `go.disabled = true` (`auth.js:129`) só deixa o botão a 60% de opacidade, com o rótulo igual, sem spinner e sem `aria-busy`. Sem a biblioteca do Google, `gis()` espera até 10 s (`auth.js:25-35`) e a mensagem "Sem conexão com o Google. Conecte-se à internet para entrar." aparece em **11,1 s**. Se o popup nunca responde, o botão fica desabilitado para sempre (medido: ainda preso após 4 s, sem `error_callback`).
- Por que importa: o residente no ônibus ou no plantão é o público do app. Dez segundos de tela parada leem como travamento, e quem usa uma mão toca de novo no lugar errado. O DESIGN.md exige estado "carregando" em tudo que é clicável.
- Fix: checar `navigator.onLine` antes de esperar e falhar já; mostrar "Abrindo o Google…" com spinner (Lucide `loader-circle`) a partir de ~300 ms; usar `aria-busy` e `aria-disabled` em vez de `disabled`; dar um teto de tempo (ex.: 60 s) ao popup e reabilitar com "Não recebemos resposta do Google. Tente de novo."
- Comando: `/impeccable harden`.

### P2 (corrigir na próxima passada)

**P2-1. Foco cai no `body` ao clicar e depois do erro**
- Onde: todos os formatos (`meas3.json`: `hangActive`, `afterErrorActive`).
- O quê: `disabled` tira o foco do botão e a reabilitação não devolve (`document.activeElement` é `BODY` em todos os casos). Quem usa teclado precisa dar Tab de novo e não ouve onde está.
- Fix: `aria-disabled` em vez de `disabled`, ou `go.focus()` ao reabilitar. Sam, de teclado, depende disso.
- Comando: `/impeccable harden`.

**P2-2. O botão se desloca 30 a 51 px quando o erro entra**
- Onde: celular e PC (`err-popup_failed.png`; `cfg-cel-light-popup_failed.png`).
- O quê: o cartão é centralizado (`align-self: center`, `app.css:1036`); ao revelar `#lg-err` ele sobe. No celular o botão passa de y=547 para 496–517 (51,5 px), no PC 41 px.
- Por que importa: o alvo foge do polegar justamente na hora de tentar de novo.
- Fix: ancorar o conteúdo no topo ou reservar a altura do erro (`min-height`) e deixar o botão numa posição fixa.
- Comando: `/impeccable layout`.

**P2-3. O botão do Google é a ação única, mas parece uma caixa tênue**
- Onde: todos os formatos e temas.
- O quê: borda `--line-2` a 1,72:1 (claro) e 1,77:1 (escuro) contra a página; fundo `--surface` a 1,08–1,10:1. O contorno é o único sinal de que é botão (WCAG 1.4.11 pede 3:1). O rótulo se salva (16,9:1 e 15,4:1). As diretrizes de marca do Google pedem uma borda mais forte, e o texto "Continuar com o Google" é o padrão do botão.
- Fix: borda `#747775` no claro e `#8E918F` no escuro, texto `#1F1F1F` / `#E3E3E3`; rótulo "Continuar com o Google".
- Comando: `/impeccable polish`.

**P2-4. O logo some no painel claro e vira placa clara no escuro**
- Onde: PC e tablet paisagem (`pc-light.png`, `cfg-pc-dark.png`).
- O quê: o tile do logo é `#4338A8`, igual ao fundo `--accent` do painel; no claro só o traço branco aparece, sem o quadrado. No escuro o painel vira `#A5A0F5`, o objeto mais claro da tela (684×812), com o tile a 3,78:1.
- Fix: no painel usar o glifo sem tile em `currentColor` (DESIGN.md: "glifo sem fundo dentro do app"), não o `MARK` com tile; no escuro, considerar o painel em `--dark-soft` com o glifo em `--accent`.
- Comando: `/impeccable polish`.

**P2-5. O aviso de acesso não cobre o que o Google vai pedir**
- Onde: todos, com Google configurado.
- O quê: a nota diz "só à pasta oculta do app no seu Drive e ao seu e-mail" (`auth.js:120`), mas `SCOPE` (`auth.js:8`) também pede `drive.file` (arquivos que o app criar ou abrir) e `profile` (nome e foto). A tela do Google vai listar mais do que a nota prometeu. "Pasta oculta" é jargão.
- Por que importa: a honestidade do consentimento é a razão de ser desta tela; quem estranha a tela do Google desiste ou desconfia.
- Fix: "O Pulse guarda seus dados numa área privada do seu Google Drive, que só ele enxerga, e usa seu nome e e-mail para identificar você." Se `drive.file` só serve ao administrador (publicar o banco), pedi-lo só a ele, no momento de publicar.
- Comando: `/impeccable clarify`.

**P2-6. Telas baixas, paisagem e zoom: o botão sai da dobra e o erro é cortado**
- Onde: celular em paisagem 844×390 (botão em 483–531 numa janela de 390), 390×500, 320×568 (591–639), 195×422 (127×86, em 975–1061), 320×256.
- O quê: o login rola, mas o botão fica abaixo da dobra e, em 390×500, a mensagem de erro (top 478, bottom 544) é cortada sem `scrollIntoView`.
- Por que importa: "uso com uma mão" e letra grande são os cenários de acessibilidade do PRODUCT.md.
- Fix: rodapé fixo (`position: sticky; bottom: 0`) com a ação e a safe-area; ocultar `.lg-points` abaixo de ~640 px de altura; `scrollIntoView` no erro.
- Comando: `/impeccable adapt`.

**P2-7. O celular nunca diz o que é o Pulse**
- Onde: celular e tablet em retrato (≤ 860 px).
- O quê: a proposta de valor "Questões de residência no seu ritmo" (`auth.js:113`) está no `.lg-brand`, que é `display: none` abaixo de 861 px (`app.css:1050`). O `h1` é só "Entrar". Os 3 benefícios do cartão não dizem "banco de questões" nem "residência".
- Por que importa: o colega que recebe o link no celular entra sem saber do que se trata e sem a razão para dar acesso ao Drive.
- Fix: uma linha acima do `h1` ou o próprio `.lg-sub`: "Banco de questões de residência médica. Suas respostas e listas ficam com você, sem outra senha."
- Comando: `/impeccable clarify`.

**P2-8. O painel de marca (`aria-hidden`) esconde os benefícios do leitor de tela**
- Onde: PC e tablet em 2 colunas (≥ 861 px).
- O quê: `.lg-brand` é `aria-hidden="true"` (`auth.js:113`) e `.lg-points` fica `display: none` nesse formato. A árvore de acessibilidade tem só `h1`, parágrafo, `status` e botão: nem "Pulse", nem a frase, nem os 4 benefícios.
- Fix: uma só fonte de texto (os benefícios dentro do cartão, sempre visíveis ao leitor) e o painel puramente decorativo.
- Comando: `/impeccable distill`.

**P2-9. A promessa "Funciona até sem internet" não vale antes do primeiro login**
- Onde: primeira visita offline.
- O quê: o service worker só registra no fim de `init()`, depois do `gate` (`app.js:97`, depois de `app.js:87`). Na primeira visita `getRegistrations()` dá 0 e, com a rede cortada, recarregar dá `ERR_INTERNET_DISCONNECTED`. Depois de "Continuar sem conta" o SW registra e passa a servir o login do cache. Fica verdadeiro só depois.
- Fix: registrar o SW antes do `gate`.
- Comando: `/impeccable harden`.

**P2-10. O app vazio aparece antes do login em conexão lenta**
- Onde: todos, escala com a lentidão (`flash-cpu6x+3g-00.png`).
- O quê: o HTML estático traz o `.shell` visível; `body.logged-out .shell { display: none }` (`app.css:1027`) só entra depois de `loadData` e do `gate`. Medido: 1 frame normal, 3 frames (~100 ms) com CPU 6×, 42 frames (~717 ms) com CPU 6× e 3G. O que aparece é a barra de navegação sem conteúdo, com os itens clicáveis.
- Fix: `<body class="logged-out">` no HTML (e remover a classe quando o app abre) ou esconder o `.shell` por padrão.
- Comando: `/impeccable optimize`.

**P2-11. Sem privacidade, termos nem ajuda**
- Onde: todos os formatos.
- O quê: não há link algum na tela. Um app OAuth pede política de privacidade na verificação do Google; o colega convidado precisa de uma resposta antes de dar acesso ao Drive. Também não há "Não tenho conta Google", "Trocar de conta" ou contato.
- Fix: rodapé de uma linha com "Privacidade" e "Como funciona" (uma página curta publicada junto) e, quando fizer sentido, "Continuar neste navegador" como alternativa visível.
- Comando: `/impeccable clarify`.

**P2-12. Tablet em paisagem recebe o layout de PC (divergência do DESIGN.md)**
- Onde: 960×640 e 1024×768 (`nocfg-tab-dark.png`).
- O quê: a quebra é 860 px (`app.css:1049`). O DESIGN.md diz que celular e tablet mostram "só o cartão"; o tablet em paisagem mostra painel + cartão, o painel ocupa metade da largura e os bullets do cartão somem. A 768 (retrato) é 1 coluna, a 861 já são 2.
- Fix: subir a quebra para ~1024 ou documentar o comportamento atual no DESIGN.md.
- Comando: `/impeccable adapt`.

### P3 (polimento)

- **P3-1. Bolinhas índigo decorativas** (`.lg-points li::before`, `app.css:1059`): índigo é ação, e a lista não é interativa. Usar `--ink-3` ou ícones Lucide de 16 px (`check`, `list-checks`, `wifi-off`).
- **P3-2. Texto duplicado e divergente:** o painel tem 4 itens ("caderno de erros", "banca e ano") e o cartão 3 (`auth.js:115,118`). Unificar.
- **P3-3. Assinatura do logo:** `.lg-mark b` mede peso 700; o DESIGN.md pede 800 com `letter-spacing: -0,02em`.
- **P3-4. Erros sem ícone e com código cru:** `#lg-err` e `.lg-warn` sem ícone (cor sozinha não é o único sinal, mas o princípio vale); o fallback mostra "(userinfo)", "(invalid_request)", "(erro)" (`auth.js:137`); `access_denied` e `popup_closed` dão o mesmo "O login foi cancelado." (`auth.js:135`). Mensagem própria: "Esta conta ainda não tem acesso. Peça ao administrador para liberá-la."
- **P3-5. `role="alert"` num contêiner que começa `hidden`:** o anúncio não é confiável em todos os leitores. Manter o `<p>` visível e vazio, e só trocar o texto.
- **P3-6. A entrada é um corte seco** (`finish()`, `auth.js:125`): sem "Entrando como…", e o Início diz "Boa tarde" sem o nome que `MQ.local.sync.name` já tem. Medido: 0,46 s para o app (0,47 s o erro).
- **P3-7. O script do Google carrega sempre** (`index.html:53`), mesmo sem Google configurado, e o console registra `ERR_FAILED` quando bloqueado. Injetá-lo só quando `A.configured()`.
- **P3-8. `<title>` "Pulse" igual no login e no app** e `theme-color` fixo `#4338A8` nos dois temas. Usar "Entrar · Pulse" enquanto `#login` existir.
- **P3-9. `straggler` "erros"** sozinho na 2ª linha do painel (`.lg-brand li` sem `text-wrap: pretty`, `app.css:1032`) a 960 e 1440.
- **P3-10. Drift de tamanho de fonte do detector** em `app.css:1030` (`2rem`), `:1034` (`1.5rem`) e `:1057` (`.9375rem`); `.lg-fine` a 13 px e `.lg-points` a 15 px sobre uma base de 14 px.
- **P3-11. Cancelar o modal "Outra conta neste navegador" volta ao login sem mensagem** (`errText` vazio). O `MQ.confirm` compartilhado não tem `role="dialog"` nem `aria-modal`, e o foco inicial cai no "×" (não verifiquei a armadilha de foco).
- **P3-12. Dois `<main>` no DOM** (`main#view` no `.shell` e `main#login`); só um é acessível porque o `.shell` fica `display: none`, mas o HTML fica sujo.
- **P3-13. Safe-area só no topo e somada duas vezes** (`app.css:168` e `:1063`); sem tratamento lateral nem inferior com `viewport-fit=cover`. Em paisagem com entalhe, 20 px fixos podem ficar sob ele (lido no CSS).
- **P3-14. `h1` "Entrar" e botão "Entrar com Google" repetem a palavra;** o cartão não tem superfície, borda nem sombra (no PC sobram ~800 px de papel vazio ao redor).

## Personas

**Casey (celular, uma mão, distraída):** o botão fica em 547–595 de 844 (centro em ~68%), na zona do polegar, mas sobe 30 a 51 px quando o erro entra (P2-2), cai fora da tela em paisagem (P2-6) e quebra o rótulo com letra grande (P1-2). Sem Google, o botão está em 603–651 (71–77%), abaixo do aviso de 171 px.

**Jordan (primeiro uso, link do colega):** no celular nunca lê "banco de questões de residência" (P2-7). Hoje o primeiro texto é "ainda não está disponível" (P1-2). "Pasta oculta do app" é jargão (P2-5). Sem privacidade nem ajuda (P2-11). `access_denied` diz "cancelado" quando pode ser falta de acesso (P3-4). Depois de "Continuar sem conta", recarrega e nunca mais vê o login, sem saber como entrar com o Google depois.

**Sam (teclado e leitor de tela):** foco inicial no corpo, primeiro Tab no botão, anel visível: certo. Mas `disabled` derruba o foco e o erro deixa o foco no `body` (P2-1); no PC o painel `aria-hidden` esconde a marca e os benefícios (P2-8); `role="alert"` em contêiner `hidden` é inconstante (P3-5).

**Residente no ônibus ou no plantão (do projeto):** sem sinal, espera 11,1 s antes de ouvir a razão (P1-3); na primeira visita offline a página nem abre (P2-9); em paisagem ou tela curta o botão sai da dobra (P2-6). Depois do primeiro login a conta é lembrada e o site abre offline: isso é bom.

**Colega a quem o administrador mandou o link:** vê o aviso âmbar (P1-2); se o cliente OAuth estiver em modo de teste e ele não for testador, recebe "cancelado" (P3-4) e não sabe a quem pedir.

## Observações menores

- A quebra 860/861 se comporta como descrito (860: só cartão; 861: painel + cartão), sem rolagem horizontal. Reflow em 320 px passa.
- O `:active` usa `scale: .96` e, com `prefers-reduced-motion`, a transição vai a 0 s.
- O corpo usa `font-size: 14px` em px (`app.css:76`), então não acompanha a fonte padrão do navegador; só o que está em `rem` escala.
- Bullets do painel (`opacity: .7` sobre `.92`) medem 4,68:1 no claro e 3,63:1 no escuro; são decorativos, então não reprovam.
- Tempo até o botão aparecer: 53–69 ms local, 185 ms com CPU 6×, 3,3 s com CPU 6× e 3G lenta; sem `rel="preload"` da fonte, com `font-display: swap`.

## Perguntas para considerar

1. Se o login fosse a primeira questão de verdade (um enunciado de exemplo com uma alternativa riscada), o produto não se apresentaria melhor do que 3 bullets?
2. Por que "Continuar sem conta" é tratado como erro, se hoje é o caminho feliz até o Google ser configurado?
3. O painel de marca justifica ser a única superfície grande em índigo, se no escuro vira o objeto mais claro da tela e rouba o foco do botão?
4. Como o estudante volta de "sem conta" para o Google sem perder o que já respondeu? Hoje o login nunca mais aparece.
5. A frase, os benefícios e a nota de permissão podem virar uma única linha acima do botão?
6. O que o estudante deveria sentir nos 2 segundos depois de entrar: ser reconhecido pelo nome ou só ver o app abrir?

## Não testado

- Login real do Google (janela, consentimento, "app não verificado", conta fora da lista de testadores); `access_denied` é lido no código.
- Sincronização real com o Drive após entrar; o estado "Sua primeira sessão" para quem já tem dados (`MQ.initSync` sem `await`, `app.js` e `sync.js`) é só leitura de código.
- Safe-area em aparelho com entalhe, leitor de tela real, Firefox e Safari, zoom real do navegador e escala de fonte do sistema, instalação como PWA.
