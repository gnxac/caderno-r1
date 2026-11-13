# Crítica de design: Resolver questão (Pulse)

Data: 2026-11-13 · Nota: **25/40 (Aceitável)** · P0: 0 · P1: 4 · P2: 8 · P3: vários

**Método:** dual-agent. A é a revisão de design e B é o detector com medições em Playwright headless. Rodaram isolados, em 390×844 (toque), 960×640 e 1440×900, em claro e escuro, nos estados sem resposta, selecionada, certa, errada, enunciado longo, tesoura, marca-texto, anotação e modo foco. Referência: `PRODUCT.md` ("toda tela responde o que faço agora?" e "leitura longa e uso com uma mão"). Nenhum arquivo do projeto foi alterado na avaliação.

O detector rodou em páginas headless, então não houve overlay visível no navegador do usuário. Capturas e dados brutos ficaram na pasta temporária da sessão (scratchpad `A\` e `B\`).

## Nota

| # | Heurística | Nota | Problema principal |
|---|---|---|---|
| 1 | Estado do sistema | 3 | "1 de 12", cronômetro e mapa funcionam. A dica das teclas A–E fica visível depois de responder, quando não serve mais. |
| 2 | Linguagem do usuário | 3 | Os ícones A↓/A↑ e lápis não dizem o que fazem. |
| 3 | Controle e liberdade | 2 | Enter numa alternativa focada responde sem volta. "Fim da lista" é beco sem saída. |
| 4 | Consistência | 3 | "Limpar marcas" some no celular e fica desabilitado no tablet. O banner fica desalinhado no PC. |
| 5 | Prevenção de erro | 2 | Resposta irreversível por teclado. A letra pode cair a 13,6 px. |
| 6 | Reconhecer em vez de lembrar | 2 | Sete ícones sem rótulo no celular. |
| 7 | Eficiência | 3 | Os atalhos A–E, Shift, Enter, F, N, L e setas existem, mas ninguém os descobre. |
| 8 | Estética minimalista | 3 | Celular limpo. No PC há mapa, painel, banner e Resultado ao mesmo tempo. |
| 9 | Recuperação de erro | 2 | Depois de errar, o comentário fica fora da tela e o botão oferecido é "Próxima". |
| 10 | Ajuda | 2 | Atalhos só pelo `?` e por uma frase que não sai da tela. |
| **Total** | | **25/40** | **Aceitável** |

## Especificidade

A tela tem autoria própria: enunciado em Literata a 17 px, letras redondas, tesoura sempre visível, pílula de 5 cores do marca-texto e índigo só para ação. O escuro está bem resolvido. O rodapé fixo com Responder grande é um acerto de polegar.

O feedback é a parte genérica. O banner vermelho/verde de largura total é o toast de qualquer app, e destoa do "caderno quieto" do `DESIGN.md`. O painel âmbar de anotação e os blocos "Resultado 0/0" também são padrão de dashboard.

**Detector:** o CLI achou 1 `low-contrast` no `index.html` (4,0:1, #717187 sobre #0f0f18), que não foi localizado na tela. O `detect.js` na tela de resolver achou `low-contrast` no placeholder da anotação (só ≥960 px) e `nested-cards`, e nada no celular. O `nested-cards` não foi confirmado e provavelmente é falso positivo (cards do painel lateral). `detect` em `solve.js` devolveu `[]`, sem valor, porque só varre HTML e CSS.

## Carga cognitiva (3 falhas de 8: moderada)

Falhas:
- **Poucas escolhas no ponto de decisão:** 5 alternativas, 5 tesouras, Responder, 2 setas e 6 a 7 ferramentas dão cerca de 22 alvos no celular e cerca de 45 no PC (mapa de 12, trilho, painel).
- **Memória de trabalho:** ícones sem rótulo exigem decorar, e o comentário fica fora de vista depois do erro.
- **Divulgação progressiva:** o que importa depois de errar (comentário) está escondido, e o que não importa antes de responder (Solução, Resultado 0/0, Anotação ampla) está sempre visível.

Passam: foco único, agrupamento, hierarquia visual, uma coisa por vez (celular) e pouco ruído (celular).

## Jornada emocional

- **Acerto:** faixa verde cheia, "Resposta correta!". É o mesmo bloco pesado do erro, sem diferença de tom.
- **Erro:** faixa vermelha saturada de ponta a ponta (60 px de 844), "Resposta errada!". É punitiva numa sessão longa e foge do "caderno quieto". O ✗ não aparece na alternativa errada.
- **Fim da sessão:** o último botão vira "Fim da lista" desabilitado. Não há resumo, número de acertos nem próximo passo.

## O que funciona

1. **Zona do polegar no celular.** Responder e Próxima ficam no mesmo lugar (y 786–834 de 844), com anterior e próxima nas bordas. Nenhum alvo medido ficou abaixo de 44 px no celular.
2. **Leitura longa.** Enunciado a 17 px com entrelinha de 1,62. No PC a linha tem 64–68 caracteres (`max-width: 68ch`). O modo foco no PC é a melhor leitura do app. Contraste do texto principal: 15 a 17:1.
3. **Teclado e movimento.** Atalhos completos, foco visível (outline de 2 px), `prefers-reduced-motion` zera as animações (`app.css:503`), e o console ficou sem erros nas 6 combinações.

## Problemas

Não há P0: nada impede resolver uma questão.

### P1

**Enter numa alternativa focada responde na hora e perde o foco.** (A, testado; `solve.js:245,263,276`)
- Evidência: PC, teclado. Com B focada, o Enter deixou `revealed: true, sel: B` e `activeElement = BODY`. O handler da alternativa seleciona, o `MQ.render()` troca o DOM e o `keyHandler` novo dispara no mesmo evento.
- Importância: resposta acidental irreversível. Todo `MQ.render()` joga o foco no `body`, o que quebra o Tab para quem usa teclado.
- Correção: `stopPropagation()` no keydown da alternativa, ou separar Enter de Espaço. Depois de cada render, devolver o foco à alternativa escolhida ou a `#q-answer`.

**Certo e errado só pela cor, contra o PRODUCT.md.** (A e B concordam; `solve.js:117`)
- Evidência: `solve.js:117` insere `<span></span>` vazio quando revelado. `.alt.right` e `.alt.wrong` não têm SVG nem ✓/✗, e `::before`/`::after` valem `none`. O ✓/✗ só existe no banner, que pode ser fechado e não aparece se a questão é reaberta.
- Importância: daltonismo e leitor de tela. O banner `role=status` é inserido junto com o render, o que não garante anúncio.
- Correção: trocar o círculo da letra por ícones Lucide `check`/`x` e acrescentar texto oculto "Correta" e "Sua resposta, errada".

**Depois de errar, o comentário fica fora da tela e a ação oferecida é pular.** (A)
- Evidência: celular, estado errado. O banner sticky cobre o topo e o comentário começa uns 470 px abaixo. O atalho "Solução" é uma lâmpada no topo, fora do alcance do polegar. No PC também há banner, faixa e Próxima antes do comentário.
- Importância: o momento de maior aprendizado vira o de menor atenção, e o "o que faço agora?" aponta para "Próxima".
- Correção: depois de responder, o rodapé mostra "Ver solução" (rola até o comentário) como primária e "Próxima" ao lado. Ou abrir o comentário já expandido abaixo das alternativas.

**O tamanho do enunciado pode cair abaixo do mínimo de 15 px.** (A; `solve.js:293`)
- Evidência: `setFontScale` aceita 0.8. Pela fórmula, enunciado a 13,6 px e alternativas a 12,8 px, contra o piso de 15 px do PRODUCT.md. Não há indicação do tamanho atual nem do limite. (A 1.0, B mediu 17 px e 16 px.)
- Correção: piso `15/17` (cerca de 0,89) e mostrar o nível, ou um toast ao chegar no limite.

### P2

**Banner de resposta pesado e desalinhado.** (A e B concordam)
- Celular: faixa sticky de 60 px que cobre a alternativa errada ao rolar (y=-34). Tablet: cobre a certa (y=-36, banner de 56 px). PC 1440: vai de x=112 a 932, cobre a coluna do mapa e metade do cartão (362–1093).
- Correção: dar o feedback na própria alternativa, com ✓/✗ e rótulo. Se o banner ficar, alinhá-lo ao `.qmain` e reduzi-lo a uma linha com `--ok-soft`/`--err-soft` e borda.

**Tablet 960×640: o cromo ocupa a tela.** (A)
- Cabeçalho, ferramentas, "Limpar marcas" desabilitado numa segunda linha (48 px), chips e rodapé deixam 1 de 5 alternativas visível. Depois de responder o banner empurra tudo e nenhuma alternativa aparece.
- Correção: esconder "Limpar marcas" quando desabilitado (como no celular) e agrupar as ferramentas numa linha.

**Sete ferramentas só com ícone no celular, no topo.** (A; `solve.js:125–132`, `app.css:1068`)
- +, tag, A↓, A↑, lápis, lâmpada e borracha ficam a 95–139 px do topo, longe do polegar. Antes de responder, a lâmpada só dispara um toast.
- Correção: esconder "Solução" até haver resposta. Mover Lista e Anotação para um menu "⋯" ou para o rodapé, e dar `aria-label` visível ao tocar.

**"Fim da lista" é botão desabilitado.** (A)
- Correção: no último item, virar "Ver resultado", com acertos, erros e a rota de revisão dos erros.

**Alvos de 40 px no tablet e no PC.** (B)
- `#q-back`, `#q-focus`, `#q-index` e `#q-banner-x` com 40×40, `input#q-page` com 64×37 e os botões do índice numerado (`.qindex-grid button`) com 47,5×40 (12 com o índice aberto). O tablet é touch. O celular está limpo.
- Correção: 44 px.

**Bordas de controle abaixo de 3:1.** (B)
- Borda da alternativa neutra (`.alt`) e do botão `.round`: 1,89:1 no claro e 1,64:1 no escuro.
- Correção: borda mais escura ou fundo diferenciado.

**Semântica das alternativas.** (A e B concordam)
- `role="button"` com `<button>` aninhado (tesoura), `aria-pressed` em vez de `radiogroup`, e `tabindex=0` mantido depois de revelar (`solve.js:115–117`).
- Correção: `role="radiogroup"` e `role="radio"` com `aria-checked`, e tirar da ordem de Tab depois de responder.

**Placeholder da anotação com baixo contraste.** (detector e B)
- "Escreva um lembrete…" em `#q-note`: 4,2:1 no claro (#757575 sobre #fff2d6) e 2,9:1 no escuro (#757575 sobre #3a2e12). Só em telas de 960 px ou mais.

### P3

- Responder desabilitado: 3,09:1 no claro e 2,36:1 no escuro. É isento pela WCAG, mas aparece em toda questão nova.
- "Limpar marcas" desabilitado: 1,87:1 no claro e 2,02:1 no escuro (só ≥960 px).
- Alternativa descartada a 0,5 de opacidade com tachado fica ilegível se o aluno quiser reler.
- A dica "escolha com o toque…" permanece depois de responder.
- O ícone `maximize` não muda no modo foco.
- O cartão "Resultado 0/0" e o painel âmbar de anotação vazio pesam no PC antes da primeira resposta.
- Há duas setas "próxima" lado a lado (Próxima e `›`).
- O cronômetro sempre visível pode gerar pressão numa tela de estudo.
- Achados do detector não confirmados: `low-contrast` no `index.html` (par #717187 / #0f0f18, não localizado) e `nested-cards` (provável falso positivo).

## Medições (B)

**Tipografia:** enunciado a 17 px, entrelinha 27,54 px (1,62), Literata. Alternativas a 16 px, entrelinha 24 px. Largura do enunciado: 358 px no celular e 670 px no desktop. Caracteres por linha (contagem real): celular mediana 28 sem espaços (máximo 33), desktop mediana 64 (máximo 68).

**Ação principal:** celular, botão a y=786 de 844 (93%), 238×48, dentro de `div.solve-foot` (`position: fixed`, 97 px). Tablet: y=588 de 640 (92%). PC: y=784 ao responder, 848 depois.

**Overflow:** nenhum horizontal em nenhuma combinação. No fim da rolagem do celular nada fica coberto.

**Contraste (≥ 4,5:1 em tudo o que não está listado nos problemas):**

| Texto | Claro | Escuro |
|---|---|---|
| Enunciado e alternativas | 16,9 | 15,43 |
| Letra da alternativa | 10,34 | 8,06 |
| Metadados (`.qmeta`) | 10,34 | 8,06 |
| `.qcode` e botão de histórico | 5,89 | 5,39 |
| `.solve-bar .title small` | 5,38 | 5,83 |
| Banner de acerto | 5,32 | 7,83 |
| Banner de erro | 6,54 | 7,45 |
| Alternativa certa / errada | 14,63 / 14,21 | 11,63 / 13,08 |
| Comentário, título | 13,68 | 12,42 |
| Tiles de acerto e erro (só desktop) | 4,61 | 6,22 |

**Teclado:** Tab percorre voltar, foco, (página), índice, lista, assunto, fonte −/+, anotação, solução, histórico, depois cada alternativa seguida da tesoura. Responder só recebe foco com algo marcado. Atalhos em `MQ.keyHandler` (`solve.js:265–279`): A–E marca, Shift+A–E descarta, Enter responde ou avança, setas navegam, F foco (Esc sai), N anotação, L lista (não funciona no modo foco).

**Movimento reduzido:** com `prefers-reduced-motion: reduce`, zero transições e zero animações (`app.css:503`).

**Console e rede:** nenhum erro, aviso, `pageerror`, `requestfailed` ou HTTP ≥ 400 nas 6 combinações.

## Personas

- **Casey (uma mão, celular):** o rodapé é bom. Não alcança Lista, Anotação e Solução (topo), e o comentário exige rolar. A barra do marca-texto abre sobre o enunciado e cobre as linhas seguintes.
- **Sam (teclado, leitor de tela, contraste):** o foco cai no `body` a cada render. O Enter responde sozinho. Certa e errada não têm ✓/✗ nem texto. O botão aninhado dentro de `role="button"` atrapalha o leitor de tela. O anel de foco é visível.
- **Alex (atalhos no PC):** A–E, Shift, Enter, F, N, L e setas funcionam. A descoberta é fraca (a dica não muda de estado) e o Enter responde sem confirmação. Não há atalho para solução nem histórico.
- **Jordan (primeira vez):** os 7 ícones do celular não ensinam nada. A tesoura em cada alternativa, sem rótulo, exige tentativa e erro.

## Observações menores

- O mapa e o painel desaparecem abaixo de 860 px, mas o botão do índice continua no cabeçalho.
- A rolagem de `go()` volta ao topo sem animação, o que é adequado.
- O modo foco no PC deixa o enunciado à esquerda de um cartão de 820 px, com o lado direito vazio.
- O banner de erro cobre o timer da barra no celular durante a rolagem.
- O índice numerado só abre sozinho em telas acima de 1100 px (`showIndex`).

## Perguntas para pensar

1. Se o erro é o momento mais valioso do estudo, por que a tela dá a ele a faixa mais pesada, a mesma da vitória, e esconde a explicação?
2. Se "ver gabarito sem responder não existe, de propósito", por que a lâmpada "Solução" fica ao lado do enunciado como convite que só devolve um toast?
3. Se o princípio é "caderno quieto onde as marcas do estudante são a cor mais expressiva", por que o feedback de certo e errado usa a cor mais saturada da página?

## Limites desta avaliação

- O marca-texto foi testado só por seleção programática, não por toque longo real.
- Não houve teste com leitor de tela real nem do fluxo de simulado.
- O tablet foi medido sem emulação de toque.
- Os estados "certa" e "errada" usaram questões diferentes (a 1ª e a 2ª), então as alturas do enunciado variam entre eles.
- O contraste considera só `color` e `background-color` sobre o fundo opaco mais próximo, sem gradientes nem imagens. O contraste do anel de foco não foi medido.
