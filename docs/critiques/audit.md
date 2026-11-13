# Auditoria técnica enxuta: `www/`

Data: 2026-11-13 · Escopo: só o que as 9 críticas não testaram (desempenho no celular, PWA, teclado, leitor de tela, "reduzir movimento"). Contraste, alvos de toque e foco já estão no `PENDENCIAS.md` e não foram refeitos.

## Como foi medido

- **Código:** `index.html`, `manifest.webmanifest`, `sw.js`, `app.js`, `util.js`, `shell.js`, `auth.js` e as regras de `prefers-reduced-motion` e foco em `app.css` / `sim.css`.
- **Navegador:** Edge sem janela, via Playwright, em 390×844 com toque, `reduced_motion=reduce`, rede de 200 KB/s e 150 ms, CPU 4× mais lenta. Foi preciso usar o Edge porque o Chromium do Playwright não está baixado.
- **Capturas:** 1 (celular, claro, tela de login). Nenhum achado depende de pixel, então não tirei as de tablet, PC e escuro. A captura só serviu para conferir a tela e foi descartada com a pasta temporária.
- **Detector do impeccable:** não rodei. As críticas já rodaram em `app.css` e `index.html` (C-19).
- **Não testado:** leitor de tela real, Safari/iOS, login real do Google (`googleWebClientId` vazio, então só entrei por "Continuar sem conta"), gráficos com dados, Resolver, Simulado e menus abertos por teclado, atualização de versão com dois deploys.

## Pontuação (só as dimensões auditadas)

| # | Dimensão | Nota | Achado principal |
|---|---|---|---|
| 1 | Acessibilidade (teclado, aria, títulos, landmarks, movimento) | 2/4 | Título da página nunca muda e o foco vai para `<main>` sem nome |
| 2 | Desempenho | 2/4 | 21 scripts bloqueantes e 702 KB em 27 pedidos, FCP 2,65 s no perfil lento |
| 3 | PWA (extra) | 2/4 | Na primeira sessão o cache só guarda `./` e `index.html` |
| 4–6 | Tema, responsivo, integridade | — | Cobertas nas críticas, não repetidas aqui |

**Total das três: 6/12.** Não há P0.

## Conferência dos itens C-n existentes

Nenhum está errado. Confirmei no código:

- **C-1:** `app.css:204` (`.btn.sm` 32 px), `:205-207` (`.icon-btn` 40 px) e `:939` (`min-height:40px`).
- **C-3:** `util.js:88` (`aria-modal`), `:101` (`prevFocus.focus()`), `:104-105` (só trata Esc, sem trap nem `inert`). O modal também não move o foco para dentro ao abrir.
- **C-7:** não há `pagehide` nem flush do banco no código. O `visibilitychange` de `sync.js:286` só dispara a sincronização.
- **C-13:** Início só tem `h1` (medido), e não há skip-link (medido).
- **C-18:** `solve.js:227` e `settings.js:72` usam `scrollIntoView({behavior:'smooth'})`.

Não reconferi C-2, C-4 a C-6, C-8 a C-12, C-14 a C-17 e C-19 a C-21.

## Achados novos

### P1

**[P1] Primeira sessão não guarda o app para uso offline** (C-22)
- **Onde:** `sw.js:5` (`install` só faz `addAll(['./','index.html'])`) e `app.js:97` (o registro só acontece depois do login).
- **Medido:** logo após entrar com "Continuar sem conta", `caches` tinha 2 entradas (`''` e `index.html`). Só depois de recarregar online chegou a 27. Depois disso o reload offline abriu o Início normalmente (nav, `h1`).
- **Impacto:** quem entra, fecha o app e abre sem internet antes de uma segunda visita online vê página sem CSS nem JS. O texto da tela de login promete "Funciona até sem internet".
- **Correção:** listar no `install` todos os arquivos do site (HTML, 2 CSS, 21 JS, 3 fontes, manifesto, 2 ícones) e subir `CACHE` (`pulse-v2`) a cada release.
- **Comando:** `/impeccable harden`

### P2

**[P2] Service worker espera a rede antes de usar o cache** (C-23)
- **Onde:** `sw.js:7-13` (`fetch(r).then(...).catch(() => hit)`).
- **Impacto:** em sinal ruim (conectado, mas sem andar) cada um dos ~27 arquivos espera o tempo limite da rede antes de cair no cache. O app abre devagar justamente onde o estudante mais o usa (dados móveis, metrô). Derivado do código, **não medido** com o SW ativo e rede lenta.
- **Correção:** stale-while-revalidate para arquivos estáticos (responde do cache e atualiza em segundo plano); rede primeiro, com limite de ~3 s, só para a navegação.
- **Comando:** `/impeccable optimize`

**[P2] 21 scripts bloqueantes e peso carregado sempre** (C-24)
- **Onde:** `index.html:33-54`, 21 `<script src>` sem `defer`, mais o `gsi/client` em todo carregamento, mesmo logado.
- **Medido (perfil lento):** FCP 2 652 ms, `load` 2 966 ms, 27 pedidos, 702 KB. O servidor local não comprime, então no GitHub Pages (gzip) o número real é menor, **não medido**. CSS de 83 KB bloqueia a renderização. `editor.js` (21 KB, só admin), `dedupe.js` (10 KB), `seed.js` (10 KB) e `sim.js` (28 KB) carregam para todos.
- **Correção:** `defer` em todos (mantém a ordem, sem build); `<link rel="preload" as="font" crossorigin>` para `manrope.woff2`; depois, carregar `editor`, `dedupe`, `sim` e `perf` só ao abrir a rota.
- **Comando:** `/impeccable optimize`

**[P2] Título da página nunca muda e o foco vai para o `<main>`** (C-25)
- **Medido:** `document.title` é "Pulse" em Questões, Listas, Anotações, Desempenho e Configurações. `app.js:58` foca `#view` (`main` sem nome), então o leitor anuncia só "principal" e não a tela nova.
- **Padrão:** WCAG 2.4.2 (título da página). Histórico e abas do navegador ficam todos "Pulse".
- **Correção:** em `MQ.render` (`app.js:20`), `document.title = nome da tela + ' · Pulse'`; focar o `h1` (`tabindex="-1"`) em vez de `#view`.
- **Comando:** `/impeccable harden`

**[P2] Tela de login deixa o app atrás acessível** (C-26)
- **Medido:** com o login aberto há 2 `main` e o `h2` "Questões de residência" da tela de trás continua na árvore de acessibilidade. O teclado está certo (Tab só passa pelo botão do login).
- **Onde:** `auth.js:108-125` (`logged-out` só esconde por CSS/sobreposição).
- **Correção:** `inert` (ou `hidden`) em `.shell` enquanto `body.logged-out`; um só `main`.
- **Comando:** `/impeccable harden`

**[P2] Nova versão não é avisada nem procurada** (C-27)
- **Onde:** `sw.js:5-6` (`skipWaiting` e `claim`, sem mensagem para a página), `app.js:97` (sem `registration.update()`).
- **Impacto:** o navegador só procura SW novo ao navegar. Um PWA instalado e deixado aberto por dias segue na versão velha e não diz isso. Com `skipWaiting`, uma aba antiga pode falar com scripts novos no próximo pedido. Derivado do código, **não testado** com dois deploys.
- **Correção:** `update()` em `visibilitychange` e a cada hora; aviso "Nova versão. Atualizar" que recarrega.
- **Comando:** `/impeccable harden`

**[P2] Manifesto incompleto para instalar no Android** (C-28)
- **Onde:** `manifest.webmanifest`. Só ícones `purpose:"any"` (sem `maskable`: o Android coloca o logo num quadrado branco), sem `id`, `screenshots` nem `shortcuts`. `index.html` sem `<meta name="description">`.
- **Correção:** ícone maskable 512 com margem de segurança, `"id": "./"`, atalhos para "Sessão rápida" e "Questões", `description` no HTML.
- **Comando:** `/impeccable polish`

**[P2] `Ctrl 1–6` colide com a troca de abas do navegador** (C-29)
- **Onde:** `shell.js:11-16` e os `kbd.hint` de `index.html`. Chrome e Edge reservam `Ctrl+1…8` para trocar de aba e a página não consegue interceptar, então os atalhos anunciados provavelmente só funcionam no app instalado. Os testes sintéticos do Playwright ignoram essa reserva, então **não confirmei** num navegador real. `shell.js:12` também ignora qualquer `Alt`.
- **Correção:** trocar por sequência (`g` depois de `i`/`q`/`l`…) ou `Alt+1…6`, e atualizar os `kbd.hint` e `shortcutsDialog`.
- **Comando:** `/impeccable clarify`

### P3

**[P3] "Reduzir movimento" desliga tudo de uma vez** (C-30)
- **Onde:** `app.css:503` (`* { transition:none!important; animation:none!important }` e `:active { scale:none }`).
- **Impacto:** funciona, mas tira também a transição que mostra a mudança de estado (modal, painel de filtro, toast). A regra do audit pede uma alternativa que preserve o estado (por exemplo, trocar o deslize por um fade curto de opacidade). O `scrollIntoView` suave já está em C-18.
- **Comando:** `/impeccable animate`

## Padrões

- **Tudo depende do cache do SW, mas o SW nasce tarde e confia na rede** (C-22, C-23, C-27).
- **Navegação sem contexto para leitor de tela:** título fixo, foco no `main` e fundo do login acessível (C-25, C-26). Soma-se ao C-13 já existente.

## O que está bom

- **Teclado:** no Início e no login todos os controles aparecem na ordem do DOM, todo foco tem contorno de 2 px, não há armadilha. `:focus-visible` global em `app.css:86`.
- **Offline depois do login:** reload sem rede abriu o Início inteiro (verificado).
- **Semântica base:** `lang="pt-BR"`, um `h1` por tela, `aside`/`nav`/`main` nomeados, `aria-current="page"` no menu, `role="status"` no toast, `aria-live` na busca, `role="timer"` sem `aria-live`, zero `img` sem `alt`, zero botão ou link sem nome, zero campo sem rótulo nas 5 rotas medidas (vazias).
- **Fontes:** 3 `woff2` próprios com `font-display: swap`, sem CDN de fontes.
- **Sem erros de console** no carregamento.

## Ordem recomendada

1. **[P1]** `/impeccable harden`: C-22 (precache completo) com C-27 (aviso de versão).
2. **[P2]** `/impeccable optimize`: C-23 (cache primeiro) e C-24 (`defer`, preload de fonte).
3. **[P2]** `/impeccable harden`: C-25 (título e foco no `h1`) e C-26 (`inert` no login).
4. **[P2]** `/impeccable polish`: C-28 (manifesto); `/impeccable clarify`: C-29 (atalhos).
5. **[P3]** `/impeccable animate`: C-30.
6. `/impeccable polish` como passo final.
