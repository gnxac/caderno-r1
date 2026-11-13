# Crítica de design: Questões

Data: 2026-11-13 · Alvo: aba Questões (`www/js/bank.js`) e tela de resolver aberta a partir dela (`www/js/solve.js`), com `www/css/app.css` · Referência: PRODUCT.md e DESIGN.md

Method: dual-agent (A: revisão de design · B: detector e medições no navegador). Os dois rodaram isolados, em Playwright headless, sem abrir janela e sem editar nada no projeto. O login Google foi contornado só no perfil temporário do teste (botão `#lg-local`, `accounts.google.com` respondido com JS vazio).

Formatos: celular 390×844, tablet 960×640, PC 1440×900, em claro e escuro. Estados: banco semeado de 200 questões (212 contando as 12 do `seed.js`) com histórico, anotações, imagens, anuladas e desatualizadas, um enunciado de ~1.800 caracteres, e o estado de primeiro uso. Console limpo, sem requisição falha e sem overflow horizontal em todas as combinações. O overlay do detector no navegador não foi gerado, para não abrir janela no PC (CLAUDE.md).

## Impressão geral

O **resolver** é a melhor parte do app até aqui:
- Literata a 17px no enunciado.
- Barra Responder/Próxima fixa no polegar (centro a 96% da altura no celular).
- Tesoura de 44×44.
- Atalhos de teclado completos (A–E, Shift+letra, Enter, F, N, setas, Ctrl K).

A **aba Questões** é o ponto fraco. Ela responde "o que faço agora?" com uma pilha de 14 controles antes da primeira questão. Quem já resolveu tudo cai num beco sem saída. O resolver tem um defeito que fere um compromisso explícito do PRODUCT.md: certa e errada só por cor nas alternativas.

## Nota de Nielsen (A): 26/40 (Aceitável)

| # | Heurística | Nota | Problema-chave |
|---|---|---|---|
| 1 | Estado do sistema | 3 | Contador de questões é bom, mas no celular o resultado fica abaixo de ~600px de filtros |
| 2 | Mundo real | 3 | "Obrigatório" nos avançados é jargão; "Nenhuma questão com Que não resolvi." é copy quebrada |
| 3 | Controle | 3 | "Limpar filtros" fica desabilitado justo no beco sem saída |
| 4 | Consistência | 2 | Docs ≠ código (Assunto vs Grande área, Região vs UF); "Filtros avançados" cheio em índigo compete com o botão primário |
| 5 | Prevenção de erros | 3 | Switches impedem desligar a última opção |
| 6 | Reconhecimento | 2 | Contadores por opção ignoram os outros filtros; ferramentas do celular só com ícone |
| 7 | Eficiência | 3 | Teclado ótimo no PC; no toque, Ctrl K e busca global não existem |
| 8 | Minimalismo | 2 | 7 botões de ~50px ocupam 600px no celular; metade do PC vazia |
| 9 | Recuperação de erros | 2 | Zero resultado sem CTA |
| 10 | Ajuda | 2 | Nada explica "Que acertei/errei/resolvi", "Caderno de erros", "Revisão de hoje" |
| | **Total** | **26/40** | |

**Carga cognitiva:** 4 falhas de 8, o que é alta (foco único, ≤4 controles, feedback imediato, reconhecimento). São 4 chips + 6 filtros + 1 botão cheio + 3 ações = 14 controles antes de qualquer questão.

**Especificidade:** o resolver é autoral (selos Anulada e Desatualizada, tesoura, marca-texto, Literata). A aba Questões lembra filtro de e-commerce: seis botões "+" iguais. Falta uma entrada direta por assunto ou prova ("treinar Cardiologia ENARE").

**Jornada emocional:** abre com segurança ("200 questões no banco" e um botão grande de Resolver). Filtrar cansa, porque as páginas de filtro não mostram quantas questões sobram. Resolver é bom. Errar tem um banner claro, mas a alternativa marcada só se distingue pela cor. Acabar as questões do filtro dá frustração: "0 questões" em vermelho, sem saída.

## O que funciona

- **Resolver no polegar:** Responder/Próxima em y≈96%, tesoura 44×44, Literata 17px e alternativas 16px, tamanho do enunciado ajustável de 13,6 a 27,2px e persistente. Sem overflow a 390px com o tamanho máximo.
- **Teclado de verdade:** Ctrl K, `?`, A–E, Shift+letra, F, N e setas funcionam, sem armadilha de foco. Anel âmbar de 2px nos dois temas (5,02:1 no claro, 11,4:1 no escuro).
- **Cartão Resultado + "Neste filtro" no PC e tablet:** contagem grande, filtros aplicados agrupados com ×, "Resolver N" como ação clara.
- **Desempenho:** a aba Questões não lista questões, então o DOM é constante com 212 ou 2.012 questões (~111 nós). Sem long task com CPU normal.

## Problemas por prioridade

Legenda: **[Q]** aba Questões, **[R]** resolver. Não há P0.

### P1

1. **[R] Certa e errada só pela cor nas alternativas.**
   - Evidência: `app.css:382-385` e `solve.js:110-118`. As duas ferramentas confirmam que não há ✓/✗ nem texto na alternativa (`::before`/`::after` valem `none`).
   - Ressalva: o banner tem ícone e texto, mas é dispensável (`#q-banner-x`) e não aparece ao reabrir uma lista (`hideBanner`, `solve.js:19`).
   - Efeito: fere o PRODUCT.md ("nunca dependem só da cor").
   - Correção: ✓/✗ na letra e selos "Sua resposta" / "Gabarito" no texto.
2. **[Q] Beco sem saída quando tudo o que casa já foi resolvido.**
   - Medido: "0 questões" em vermelho, `qh-zero` = "Nenhuma questão com Que não resolvi.", e "Só o filtro padrão…" aparece junto. "Limpar filtros" fica desabilitado, assim como Resolver, Lista e Simulado, sem CTA (`bank.js:430-448`).
   - Efeito: é o estado normal de quem estuda de verdade.
   - Correção: "Você resolveu tudo" + "Incluir já resolvidas" / "Refazer erradas".
3. **[Q] Celular: resultado e chips abaixo de ~600px de filtros, e o FAB cobre o contador.**
   - Medido: `.fbtns` vai até y≈630. O FAB "Resolver N" (y707–776) cobre o `#qh-n` (y706–739). O resumo `#qh-summary` está em y924, depois do menu. Fixos somam 136px (16%).
   - Correção: resumo e chips no topo, logo abaixo da busca. Filtros em grade ou acordeão.
4. **[R] Foco perdido a cada resposta e troca de questão; certo/errado não é anunciado.**
   - Evidência: `solve.js:177` troca `#view.innerHTML`, e `activeElement` vira `BODY` ou `MAIN#view` (também em `:242` e `:263`).
   - As alternativas são `div[role=button]` com um `<button.cut>` aninhado (`solve.js:115-117`). Depois de responder só mudam classes; a certa não escolhida fica com `aria-pressed=false`.
   - Correção: devolver o foco à "Próxima" ou à questão, e dar `aria-label` "(gabarito)" / "(sua resposta)" às alternativas.
5. **[R] Linha do enunciado de 83–88 caracteres no PC (alvo ~68).**
   - Medido: máx. 88, mediana 81 no PC (87 em modo foco); 58 no tablet; 45 no celular. `.stem{max-width:68ch}` mede 670px em Literata 17px (`app.css:357`).
   - Efeito: fere o princípio de leitura longa.
   - Correção: limite em `em` (~34em a 17px), e testar de novo.

### P2

6. **[Q+R] Alvos abaixo de 44px no tablet com toque (960px).**
   - Medido: `#f-reset` e `.chip-t`/`.chip-x` 32px; `qa-actions .btn` 40px; `#q-back`/`#q-focus`/`#q-index`/`#fp-back` 40×40; `#q-page` 64×37; `#q-banner-x` 40×40.
   - Causa: `app.css:732` aplica 44px só até 860px; ao lado, a regra de PC dá 40px em `(min-width: 861px) and (pointer: fine)`. Use `(pointer: coarse)`.
7. **[Q] Checkbox "marcar tudo" de 22×22 nas linhas com filhos (celular e tablet).** `bank.js:249`, `app.css:304`. A linha inteira não é um label nessas linhas. Ampliar o alvo para 44px.
8. **[Q] "Filtros avançados" é o maior bloco saturado da tela.** `app.css:272`. O DESIGN.md pede um botão primário por área. Use borda e `--soft`. O ícone de settings também confunde com Configurações.
9. **[Q] Contadores por opção ignoram os outros filtros e não há contagem ao vivo.** "Cardiologia 7" vira menos depois do filtro padrão. A contagem só atualiza depois de Confirmar. Mostrar "Confirmar (N questões)".
10. **[Q] "Situação" nos avançados tem opções sobrepostas, todas "Obrigatório", e lixeira para "Restaurar padrão".** "Que já resolvi" contém "Que acertei" + "Que errei". Trocar por controle segmentado (Todas / Não resolvi / Errei / Acertei), tirar "Obrigatório" e usar ícone `rotate-ccw`.
11. **[R] Comentário fica atrás da barra fixa e o banner sticky cobre o topo.** Medido no celular: `#q-comment` em y=730 e barra em y≈747. O banner tem 56–60px sobre o texto e, no PC, cobre o mapa e a primeira linha do cartão. Levar o olhar ao gabarito comentado, e pôr o banner no fluxo.
12. **[R] Celular: voltar, foco e cronômetro somem ao rolar.** `#q-back`, `#q-focus` e `#q-index` ficam em y18–62 (5%). Em enunciado longo (1.548px, 183% da tela) nenhuma alternativa aparece na dobra. Nada de "voltar" no polegar.
13. **[R] "Responder" desabilitado sem motivo no celular.** `#q-answer` mede 3,09:1 e a dica "escolha com o toque ou A–E" some (`.hide-m`).
14. **[R] Ferramentas do celular são seis ícones sem rótulo.** Só `aria-label`, sem texto visível nem tooltip no toque. Rótulo curto ou menu "Ferramentas".
15. **[Q+R] Busca e atalhos só no PC.** Ctrl K não existe no toque. A dica "Ctrl K" prometida no DESIGN.md não aparece na pílula de busca. `/` e os números 1–5 não fazem nada (`solve.js:269` usa `/^[A-E]$/`).
16. **[Q+R] Contraste abaixo do mínimo.**
    - `kbd.hint` do menu: 2,33:1 no claro e 2,52:1 no escuro (4,2:1 no item ativo), de `app.css:113-114`.
    - Alternativa descartada: letra 2,48:1 e texto 3,13:1 no claro (letra 2,87:1 no escuro), de `app.css:376-377`. É proposital (opacity .5), mas o WCAG só isenta controles desabilitados.
    - Placeholder: `#q-note` 4,15:1 no claro e 2,89:1 no escuro, `#q-search` 3,93:1 no escuro. O `app.css` não define `::placeholder`.
17. **[Q+R] Estrutura e navegação por teclado.**
    - Questões: h1 → h3, sem h2 (`bank.js:403,434`).
    - Resolver: sem h1/h2, só h3 no PC e nenhum heading no celular (`solve.js:141,154,159,171-173`).
    - Sem skip-link. São 10 Tabs até a primeira alternativa, com 2 paradas por alternativa (alternativa + tesoura).
18. **[Q] Aba genérica e fora do DESIGN.md.** O código entrega "Assunto", "Região", "Finalidade", "Banca"; o doc promete Grande área › Especialidade e UF. Falta entrada direta por assunto ou prova.
19. **[Q+R] Texto de 11px.** Menu inferior no celular e tablet (`app.css:136`), `.mk` dos cartões (`:698`), `.qp-card h3` (`:662`), `.qn` e `.hint` (`:113`). O resolver no celular não tem nada abaixo de 12px.

### P3

20. `scrollIntoView({behavior:'smooth'})` do botão "Solução" ignora `prefers-reduced-motion` (`solve.js:227`): 2–11px em 30ms contra 296–525px finais.
21. "Limpar marcas" desabilitado fica visível no tablet e PC, com contraste de 1,87:1 e 2,02:1, e quebra a linha da barra em 960px. Esconder, como já é feito no celular.
22. Modo foco no celular: A↓/A↑ esticados nas pontas (`justify-content: space-between`) e banner de resposta continua visível. No toque só o ícone de maximizar sai do foco.
23. PC: metade inferior vazia (os filtros terminam em y≈425 de 900). Poderia receber "Continuar de onde parei" e "Revisões de hoje" (regra do espaço vazio do DESIGN.md).
24. Seed "Exemplo autoral · 2026" sem aviso de que são exemplos. O texto "Só o filtro padrão…" aparece junto do zero.
25. No PC o índice do resolver já nasce aberto com um botão por questão: 134 com 200 questões, 1.204 com 2.000 (DOM 1.469 nós). Com CPU 4× houve 5 long tasks de 52–146ms. É risco futuro, não problema hoje.
26. A busca Ctrl K abre só as 40 primeiras como sessão ("Mostrando as primeiras 40").
27. "Limpar filtros" restaura `newFilter()`, não o padrão salvo em Configurações (confirmado no código, não testado).
28. Falsos positivos e ressalvas do detector: `nested-cards` em `.alt` é padrão funcional intencional. Os 62 avisos de `app.css` (41 de fonte, 12 de raio, 9 de cor fora da escala) são só de escala do DESIGN.md. O achado de `www/index.html` (`low-contrast`, linha 0) é o mesmo `kbd.hint`.

## Evidência determinística (B)

- **Detector estático:** `www/index.html` 1 achado; `www/js` 0; `www/css` 62 advisories.
- **Detector via CDP:** 16 execuções e 32 achados, com repetição entre telas e formatos. Regras distintas: `low-contrast`, `skipped-heading`, `nested-cards`, `gray-on-color`. Celular claro e escuro no resolver depois de responder: 0 achados.
- **Console:** 0 `pageerror`, 0 `console.error`, 0 requisições falhas, 0 HTTP ≥ 400 nos 24 contextos. Único aviso: Service Worker bloqueado pelo Playwright (artefato do teste).
- **Tipografia do resolver:** enunciado Literata 17px, `line-height` 1,62; alternativas 16px, `line-height` 1,5. O resto da interface não escala com o tamanho do enunciado.
- **Posição:** botão principal do resolver em y≈96% no celular, 96% no tablet, 97% no PC. `.solve-foot` fixa com 97px no celular (11,4%). Primeira alternativa começa em 74% da altura no celular.
- **Barras fixas na lista (celular):** FAB 69px + barra de menu 67px = 136px (16,1%).
- **Primeira dobra:** lista com 22 a 23 interativos visíveis; resolver no PC chega a 38.
- **Acessibilidade:** `noName` vazio em todos os 240 casos; imagens com `alt`; filtros com `aria-label` ou `<label>` envolvente; `viewport` permite zoom.
- **Atalhos testados no PC:** Ctrl K, Esc, `?`, Ctrl 2/3, A–E, Shift+D, F, N, Enter, setas funcionam; `/` e 1–5 não existem.
- **Desempenho (JS síncrono):** render da aba 0,9ms com 212 questões e 6,7ms com 2.012 no PC; 5,0ms e 30,4ms no celular com CPU 4×. Busca por texto no celular com CPU 4×: 80 a 178ms.

## Persona: o que quebra

- **Casey (celular, uma mão):** o resultado só aparece depois de ~600px de filtros, com o FAB cobrindo o contador (3). Voltar e cronômetro somem ao rolar (12). Ferramentas só com ícone (14). Checkbox de 22px (7). Bom: Responder/Próxima no polegar.
- **Alex (PC):** tem Ctrl K e A–E, mas dá no beco de 0 questões (2). A linha de 83–88 caracteres cansa (5). Contadores mentem (9). Sem `/` para a busca (15).
- **Sam (teclado e leitor de tela):** o foco cai no `body` a cada resposta (4). Certo/errado é só classe e cor (1, 4). Sem skip-link nem headings (17). Foco visível é bom.
- **Jordan (primeiro uso):** "Que não resolvi", "Errei", "Caderno de erros" e "Revisão de hoje" sem explicação (10). 12 questões de exemplo misturadas sem aviso (24).

## Perguntas para pensar

1. Se o estudante quer "mais 10 de Cardiologia que errei", por que são 14 controles e 3 telas antes da primeira questão?
2. Por que o padrão "Que não resolvi" esvazia o app de quem mais o usa, em vez de oferecer "Revisar erros" como ação principal?
3. Por que a tela mais cuidada esconde o gabarito comentado atrás da própria barra de ação?

## Não verificado

- Leitor de tela real, iOS/Safari e área segura do home-indicator.
- Marca-texto por toque longo real e anotação no modal do celular (a captura pegou o modal em transição).
- Questão com 2+ imagens grandes, imagem faltando ("Imagem ainda não baixada") e as 5 cores do marca-texto.
- Banco real de milhares de questões, offline, login e sync reais.
- O recurso "favoritas" não existe no app (nenhum código de favorita), então ficou fora.
- Painel de admin e simulado não eram objeto desta rodada.

## Capturas e dados

- Avaliador A: `C:\Users\GUILHE~1\AppData\Local\Temp\claude\c1f5f307fdddebd3\6b8554ec-9105-47fb-be69-b78a59568ad5\scratchpad\avaliadorA2\` (padrão `L-{cel|tab|pc}-{light|dark}-NN-<estado>.png` e `F-...` para primeiro uso; `Z-*-tudo-resolvido.png` mostra o beco sem saída; `measure-loaded.json`, `measure-first.json`).
- Avaliador B: `C:\Users\GUILHE~1\AppData\Local\Temp\claude\c1f5f307fdddebd3\6b8554ec-9105-47fb-be69-b78a59568ad5\scratchpad\avaliadorB2\` (240 capturas `shot-{banco|primeiro}-{cel|tab|pc}-{claro|escuro}-{tela}-{dobra|pagina}.png`; `results.json`, `interaction.json`, `perf.json`, `extra.json`, `det-*.json`, `cdpdet-*.json`).
- Essas pastas são temporárias e podem ser apagadas pelo sistema.
