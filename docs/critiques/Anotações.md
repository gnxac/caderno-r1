# Crítica de design: Anotações (Pulse)

Data: 2026-11-13 · Nota: **24/40 (Aceitável)** · P0: 0 · P1: 5 · P2: 15 · P3: 10

**Método:** dual-agent. A é a revisão de design e B é o detector com medições em Playwright headless. Rodaram isolados e sem ver o resultado um do outro, em 390×844 (toque, UA móvel), 960×640 (toque, `pointer: coarse`) e 1440×900, em claro e escuro. Estados: cheio (45–47 notas, de 1 linha a 4200 caracteres, com URL, emoji, HTML-like e palavra gigante), esparso (2), vazio (0), filtro sem resultado, busca, filtro por chip em até 4 níveis, edição, exclusão com confirmação e carga de 300–600 notas. Referência: `PRODUCT.md` ("toda tela responde o que faço agora?" e "leitura longa e uso com uma mão") e `DESIGN.md`. Nenhum arquivo do projeto foi alterado e nenhum snapshot foi gravado em `.impeccable/critique/` (pedido: não editar nada). Não houve overlay no navegador do usuário (o live-server injetaria no HTML). Capturas e dados brutos ficaram no scratchpad da sessão (`A2\` e `B2\`). Servidores das portas 8791 e 8792 encerrados (nada escutando).

Alvo: `MQ.views.anotacoes` em `www/js/notes.js` (105 linhas), estilos `.nt-*` em `www/css/app.css:896-915`, `.qchip` em `:688-694`, item de navegação em `www/index.html:22`.

## Resumo

Não há P0: em nenhum fluxo testado o estudante deixa de conseguir ler, filtrar, editar ou excluir uma nota. A tela entrega quase tudo o que o PRODUCT.md promete (busca, filtro hierárquico com contagem, editar, excluir com confirmação, estado vazio, 1/2/3 colunas, `Ctrl 4`), escapa HTML corretamente (nenhum XSS nos 4 casos testados), persiste a edição após recarregar e renderiza 600 notas em 24 ms. Falha em outra frente: foi desenhada como **lista de cartões iguais com três botões**, não como uma tela para **revisar anotações antes da prova**. Há 45 botões índigo cheios, nenhuma ação principal, busca e filtros que somem ao rolar (a página tem 15.000–29.000 px no celular), exclusão sem desfazer e sem dizer qual nota, nota longa sem recolher, foco perdido a cada ação e texto de leitura de 14,5 px que ignora o ajuste de tamanho do usuário.

## Nota

| # | Heurística | Nota | Problema principal |
|---|---|---|---|
| 1 | Visibilidade do status | 2 | Há "N de M anotações" (`notes.js:58`), mas sem `aria-live`, e salvar ou excluir não dá toast (`toast: null` medido). |
| 2 | Linguagem do usuário | 3 | Caminho de assunto, código e instituição/ano no vocabulário da residência. "Questão removida" não diz qual. |
| 3 | Controle e liberdade | 2 | Excluir é irreversível (`db.js:120-125` troca o objeto por lápide sem o texto). Esc descarta o que foi digitado sem aviso. O cartão editado salta para o topo. |
| 4 | Consistência | 2 | DESIGN.md diz "um único botão primário por área" e a tela tem 45. DESIGN.md fala em barra de 5 itens e há 6. O lápis serve a Editar, a Anotação e (no admin) a Editar questão. |
| 5 | Prevenção de erros | 2 | A confirmação abre com foco em Cancelar (bom), mas o texto é genérico (`util.js`, "A anotação desta questão será apagada."). Sem contador para o limite de 4000. Chip longo vaza. |
| 6 | Reconhecimento | 3 | Tudo visível, trilha reversível com contagem por nível. Mas ao abrir a questão a nota some e é preciso lembrá-la. |
| 7 | Flexibilidade | 2 | Sem filtro fixo, sem ordenação, sem `/` para buscar, 141–155 paradas de Tab, sem "voltar ao topo". |
| 8 | Minimalismo | 2 | Caminho completo repetido em cada cartão mesmo com filtro aplicado. Três botões por cartão. Cartão de 2.100 px estica os vizinhos. |
| 9 | Recuperação de erros | 2 | "Nenhuma anotação neste filtro" + "Limpar filtros" é bom. O toast de salvar vazio manda "usar o botão de excluir", que não existe no modal. |
| 10 | Ajuda | 3 | O estado vazio explica a tecla N, mas só para teclado. |
| **Total** | | **24/40** | **Aceitável** |

## Veredito de especificidade

**Meio-termo: autoral nos detalhes, intercambiável na estrutura.** Autoral: a caixa âmbar `--warn-soft` com texto em Literata (`app.css:911`) é a "tinta do estudante" do DESIGN.md, com tokens corretos nos dois temas e contraste de 15,2:1 (claro) e 11,3:1 (escuro); código `R1-…` em índigo. Intercambiável: o resto é uma grade de cartões com chips e botões reaproveitados de Questões (`.qchip`, `.btn.sm`, `.pane-search`). Nada lembra um "caderno": a nota, que é o motivo de a pessoa estar ali, aparece em 4º lugar (metadados → caminho → enunciado cinza → nota) e todos os cartões têm o mesmo peso.

**Detector (`impeccable detect --json www`):** 63 achados (exit 2), 62 em `app.css` e 1 em `index.html`. **`notes.js` deu 0 (limpo).** Regras: `design-system-font-size` 41, `design-system-radius` 12, `design-system-color` 9 (as três `advisory`) e `low-contrast` 1. Na superfície Anotações cai só `app.css:907` (`.nt-meta` 12 px): **falso positivo**, o DESIGN.md documenta a escala "12 · 13 · 14 · 16 · 18 · 22 · 28". Nenhum achado de raio ou cor nas linhas 896–915. O `low-contrast` de `index.html` é real, mas é do rail: `kbd.hint` a 2,33:1 (claro) e 2,52:1 (escuro) nos itens inativos e 4,2:1 no "Ctrl 4" ativo do escuro, só ≥861 px. **Falsos negativos:** o detector não pegou os 14,5 e 13,5 px da nota e do enunciado, o placeholder a 3,93:1 no escuro, as bordas de campo a 1,72:1 nem o vazamento de layout com nomes longos.

## Concordâncias entre as duas avaliações

- Alvos no tablet com toque: A mediu `.btn.sm` 32 px e `.icon-btn` 40 px (133 de 147 alvos); B mediu 134×32, 87×32 e 40×40. Ambas apontam `app.css:915` (a regra de 44 px só até 860 px) e `app.css:204-206`. No celular, 0 alvos abaixo de 44 px nas duas medições.
- Foco vai a `BODY` após clicar em chip, salvar edição e excluir; só o Esc devolve o foco ao botão certo. Modal sem focus trap (`util.js:104-105`): ambas.
- Placeholder da busca a 4,61:1 (claro) e 3,93:1 (escuro): ambas.
- Contagem sem `aria-live` e 45–47 `article` sem nome: ambas.
- Nota longa sem recolher: A viu o cartão de 2.110 px; B mediu 2.570 / 2.175 / 2.414 px e o vazio abaixo do conteúdo.
- `.nt-text` a 14,5 px ignora `--font-scale`: ambas (só `.stem`, `.alt` e `.comment` usam a escala).
- Excluir/editar sem toast, sem desfazer: ambas. Filtro e busca não fixos: ambas.
- O que só uma viu: A achou o item "Anotações" sem rótulo curto na barra inferior (overflow a 320 px), o chip longo vazando da pílula, a nota que some ao "Abrir questão" (e a tentativa registrada), o cartão que muda de lugar ao editar e o sync que tira o foco da busca. B achou o estouro horizontal com nome sem espaços (745/390 no celular), a busca que ignora a hierarquia ("Hérnia" = 0 resultados), o foco coberto pela barra inferior (12 de 75 Tabs), as bordas de campo a 1,72:1, o vazio de até 2.194 px sob cartões curtos no PC, o crumb ativo só por cor e o scroll que volta ao topo ao regressar de "Abrir questão".
- Divergências: A reproduziu o texto do chip de subtema longo vazando da pílula a 390 px (`int-phone-light-filter3-longcrumb.png`); B mediu os chips com 44 px de altura e só reproduziu o vazamento com string sem espaços (que estoura a **página**). Mantive o primeiro como P1 ressalvado e o segundo como P2. A mediu a 320 px um overflow de 336 > 320 por causa dos 6 itens da barra; B não testou 320.
- B localizou `#nt-edit` em `app.css:913`; a linha correta é a **914** (a 913 é `.nt-foot .btn`).

## O que existe versus o prometido

| Promessa (PRODUCT.md / DESIGN.md) | Estado |
|---|---|
| Aba com todas as anotações, da mais recente para a mais antiga | Cumpre (`notes.js:8-11`, ordena por `updatedAt`). Sem outra ordenação. |
| Cartão: código, instituição e ano, caminho, trecho do enunciado, nota em caixa âmbar | Cumpre; o trecho (13,5 px) tem peso próximo ao da nota. |
| Filtro por assunto em chips com contagem e trilha desfazível | Cumpre (`notes.js:62-66`). Chip longo vaza, foco se perde, não é fixo. |
| Busca por nota, questão ou código R1 | Cumpre (sem caixa e sem acento). **Não** busca na hierarquia e casa com qualquer palavra do enunciado ("conduta" = 45 de 47). |
| Abrir questão com as questões do filtro | Cumpre, mas a nota some no Resolver e a sessão registra tentativa (`ctx: 'banco'`). |
| Editar | Cumpre; sem contador, sem aviso ao descartar, sem toast. |
| Excluir com confirmação | Confirma, mas não identifica a nota e não há desfazer. |
| 1, 2 ou 3 colunas | Cumpre (1 / 2 / 3). |
| Estado vazio que explica como criar | Cumpre, mas só cita a tecla N. |
| Um único botão primário por área | **Viola**: 45 primários. |
| Alvos de 44 px (celular e tablet) | Celular ok. **Tablet com toque falha** (32 / 40 px). |
| Barra inferior de 5 itens com rótulo curto | Desatualizado: 6 itens, "Anotações" só com `.l-f`. Overflow a 320 px (A). |
| Leitura ≥ 15 px; tamanho ajustável | **Falha**: nota 14,5 px, enunciado 13,5 px, sem `--font-scale`. |
| Contraste ≥ 4,5:1 | Texto ok. Falha pontual: placeholder no escuro (3,93:1). Marcas de campo 1,72:1. |
| Teclado completo com anel de foco | Anel âmbar de 2 px visível; mas foco perdido e sem focus trap. |
| Atalho `Ctrl 4` | Funciona. `Ctrl K` abre a busca global de questões, não a do campo. |

## Pontos fortes

1. **Filtro hierárquico com contagem por nível e trilha reversível** (`notes.js:62-66`). Chips de filhos recalculam as contagens, combinam por AND com a busca e "Limpar filtros" zera tudo. É o melhor trecho da tela.
2. **Caixa âmbar em serifa.** Distingue a voz do estudante dos metadados e herda os tokens nos dois temas.
3. **Robustez medida.** HTML escapado (`window.__xss` permaneceu `undefined`; `<img onerror>`, `<script>`, `<svg onload>` e o link `javascript:` aparecem como texto), palavra de 110 letras e URLs longas quebram em `.nt-text` (`overflow-wrap: anywhere`), 0 erros de console em 60 cenários, edição e lápide persistem após recarregar, busca sem acento e por código, foco inicial da confirmação em "Cancelar", movimento reduzido respeitado.

## Problemas prioritários

### P1 (corrigir antes do lançamento)

**[P1-1] 45 botões primários; nenhuma ação principal da tela**
- Onde: `notes.js:75` (`btn sm primary`), `notes.js:93-95`. Os 3 formatos, claro e escuro.
- Problema: o índigo cheio se repete em cada cartão (e mais "Editar" e "Excluir"). Viola "um único botão primário por área" (DESIGN.md) e "toda tela responde o que faço agora?" (PRODUCT.md). O rótulo "Abrir questão" também não avisa que inicia uma sessão com todas as questões do filtro (medido "Questão 13 de 42").
- Por que importa: sem uma ação dominante o olho não tem onde pousar e a tela vira uma parede de CTAs, num app em que a pessoa só quer "revisar o que anotei".
- Correção: um primário único no topo ("Revisar N anotações"), fixo na zona do polegar no celular. Nos cartões, "Abrir questão" vira secundário (contorno ou fantasma).
- Comando: `/impeccable distill`, depois `/impeccable layout`.

**[P1-2] Busca e filtros não ficam fixos; sem "voltar ao topo"; voltar do Resolver leva ao topo**
- Onde: `app.css:902` (`.nt-filters` sem `position`) e `app.css:896-903`; `app.js:58` faz `window.scrollTo(0,0)` a cada troca de rota. Os 3 formatos.
- Medido: a 2.500 px de rolagem a busca está em top −2455 e os filtros em −2399. Página de 15.183 px (A) a 29.142 px (B) no celular com 45–47 notas; 6.828–18.112 px no PC. O bloco de filtros ocupa 341 px (40% da altura do celular) e a busca e os chips ficam 100% no terço superior. Ao voltar de "Abrir questão" o filtro e a busca são mantidos (`notes.js:5`), mas a rolagem vai a 0 (8.824 → 0).
- Por que importa: trocar de assunto exige rolar de volta ao topo, justamente a zona mais distante do polegar. É a tarefa central da tela.
- Correção: no celular, cabeçalho fixo e compacto com a busca e uma linha rolável de chips (ou um botão "Assunto" que abre a página de filtro `.fpage` que já existe em Questões). Botão "voltar ao topo". Guardar e restaurar a rolagem ao voltar do Resolver.
- Comando: `/impeccable layout`.

**[P1-3] Excluir é irreversível, sem desfazer e sem identificar a nota; salvar não dá retorno**
- Onde: `notes.js:98` (`MQ.confirm('Excluir anotação', 'A anotação desta questão será apagada.', …)`), `db.js:120-125` (`MQ.remove` troca o objeto por `{ id, deleted: true, … }` e descarta o texto), `notes.js:28`. Os 3 formatos.
- Medido: nenhum toast e nenhum "Desfazer" após excluir ou editar; foco em `body`.
- Problema: uma nota de 3 mil caracteres some com um toque e uma confirmação genérica. A tela vive de texto que o estudante digitou; perdê-lo contradiz "nenhum histórico se perde".
- Correção: mostrar o código e as primeiras palavras da nota no diálogo. Depois de excluir, toast "Anotação excluída · Desfazer" por ~8 s que reaplica o texto via `saveNote`. Toast "Anotação salva" ao editar.
- Comando: `/impeccable harden`.

**[P1-4] Alvos de toque abaixo de 44 px no tablet (861–1199 px)**
- Onde: `app.css:204` (`.btn.sm` 32 px), `app.css:205-207` (`.icon-btn` 40 px). A regra de 44 px do cartão só vale até 860 px (`app.css:915`); a de 40 px em `app.css:981-982` só cobre `pointer: fine`.
- Medido a 960×640, toque: Abrir questão 134×**32**, Editar 87×**32**, Excluir **40×40**, botões e ✕ do modal de edição **40**, "Ir para as questões" do vazio **40**. Os três ficam a 6 px uns dos outros. Celular: 0 de 147 abaixo de 44.
- Por que importa: PRODUCT.md dá 44 px a "celular e tablet" e iPad em paisagem tem 1024–1180 px. Excluir fica ao lado de Editar com 6 px de folga.
- Correção: `@media (pointer: coarse), (max-width: 860px)` cobrindo `.nt-foot .btn.sm`, `.nt-foot .icon-btn`, botões do modal e o CTA do vazio; mais espaço entre Editar e Excluir.
- Comando: `/impeccable adapt`.

**[P1-5] Chip de assunto longo vaza da própria pílula (celular)** *(reproduzido por A; B não viu)*
- Onde: `app.css:688` (`.qchip { height: 32px }`) com `min-height: 44px` no toque (`app.css:694`). Reproduzido em Nefrologia › "Distúrbios do Equilíbrio Ácido-Base e Hidroeletrolíticos…" e no subtema "Hipercalemia refratária com alterações eletrocardiográficas…" a 390 px. No PC o chip chega a 583–631 px.
- Problema: o texto vai a 2–3 linhas e sai do contorno do chip.
- Por que importa: os nomes reais de tema do banco INEP/Ebserh são longos, e o filtro por assunto é a função principal.
- Correção: `height: auto; min-height: 44px; padding-block: 8px; white-space: normal; text-align: left; border-radius: 22px`, ou truncar com reticências e `title`; no celular, rolagem horizontal da linha.
- Comando: `/impeccable adapt`.

### P2 (próxima rodada)

**[P2-6] Nota longa sem recolher; cartão estica os vizinhos.** `app.css:905-911` (`.nt-text` sem `max-height`). Nota de 3265–4200 caracteres = cartão de 2.110–2.570 px (celular), 2.106–2.414 (PC), 1.932–2.175 (tablet). No grid de várias colunas os vizinhos esticam e o rodapé não fica fixado: vazio abaixo do conteúdo de até **2.194 px no PC (31 de 47 cartões com mais de 40 px)** e 1.868 px no tablet. Limitar a ~8 linhas com "Ver tudo" (`aria-expanded`) e alinhar o rodapé ao pé do cartão (`margin-top: auto` / `1fr`). `/impeccable layout`.

**[P2-7] Texto de leitura em 14,5 px que ignora o tamanho do usuário.** `app.css:911` (`.nt-text` 14,5 px), `:910` (`.nt-q` 13,5 px), `:914` (`#nt-edit` 14 px), `:907`/`:909` (`.nt-meta` e `.nt-path` 12 px); `.nt-lab` e `.qchip .qn` a 11 px. Medido com `--font-scale: 1.3`: nada muda (o `.stem` usa `calc(17px * var(--font-scale))`, `app.css:357`). PRODUCT.md: mínimo de 15 px e ajuste do usuário. Notas de revisão são leitura longa. `calc(15px * var(--font-scale))` na nota, ≥14 px no enunciado, mesma escala no editor, 12 px mínimo nos rótulos. `/impeccable typeset`.

**[P2-8] Foco perdido a cada ação e modal sem focus trap.** `notes.js:62-68` (`innerHTML` em `#nt-filters` e `#nt-list`), `notes.js:28` (`done()` → `MQ.render()`), `notes.js:98`, `util.js:101` (`prevFocus.focus()` aponta para nó destruído), `util.js:104-105` (só trata Esc; `aria-modal="true"` em `:88`). Medido nos 3 formatos e 2 temas: `activeElement` vira `BODY` ao dar Enter num chip, salvar e excluir. De "Salvar" o Tab segue para fora do diálogo, para o nav atrás. Refocar o chip equivalente após `paint()`, o próximo cartão após excluir e o cartão editado após salvar; trap de foco no modal. `/impeccable harden`.

**[P2-9] Estrutura para leitor de tela.** `notes.js:42,58` (`#nt-sub` sem `aria-live`/`role=status`), `notes.js:70` (47 `<article>` sem nome nem heading; só existe 1 `h1`), `notes.js:43` (campo sem `role=search`), `notes.js:62,65` (rótulos "Assunto" e "Grande área" são `span` soltos, linhas sem grupo). `role="status"` na contagem, `aria-labelledby` (ou `aria-label="Anotação R1-00002"`) no cartão, `role="group"` com rótulo por linha. `/impeccable audit`.

**[P2-10] Editar move o cartão para o topo e nada confirma o salvamento.** `notes.js:11` (ordena por `updatedAt`) e `:28`. Medido: editei R1-00047 na posição 15 com scroll em 4.000 px; depois do Salvar o scroll não mudou, mas na mesma altura apareceu outra nota e a editada foi para o topo, fora da vista. Toast "Anotação salva", rolar até o cartão no novo lugar ou manter a ordem da sessão. `/impeccable animate` com `/impeccable clarify`.

**[P2-11] A nota some ao "Abrir questão" e a sessão registra tentativa.** `notes.js:93-95`, `solve.js:129` (no celular o `<span>Anotação ✓</span>` fica oculto por `app.css:1068`). Quem veio revisar cai numa questão em modo "Responder", gera tentativa (`ctx: 'banco'`, contamina Desempenho e a revisão espaçada) e precisa abrir o lápis para ler o que escreveu. Mostrar a nota como faixa recolhível no topo do Resolver aberto por Anotações; avaliar um modo de leitura que não registre resposta (decisão de produto: "ver gabarito sem responder" não existe de propósito). `/impeccable shape`.

**[P2-12] Barra inferior: "Anotações" sem rótulo curto; 6 itens em vez de 5.** `index.html:22` (só `.l-f`; "Desemp." e "Ajustes" têm `.l-r/.l-s`), `app.css:142` (`.ic-slot` 52 px), `:183`. Medido (A): a 390 px o rótulo (11 px, 57,6 px) cabe no item de 63,7 px, mas a 360 px o item fica com 61,6 contra 58,1 dos demais e **a 320 px a página ganha overflow horizontal (`scrollWidth` 336 > 320)**. B confirma o rótulo visível e 11 px, mas não testou 320. `<span class="l-r">Notas</span>`, `ic-slot` de ~44 px abaixo de 360 px, atualizar DESIGN.md para 6 itens. `/impeccable adapt`.

**[P2-13] Placeholder da busca com contraste insuficiente no escuro.** `notes.js:43`, sem `::placeholder` no CSS: `#757575` (padrão do navegador) = **4,61:1 claro, 3,93:1 escuro**. `#nt-q::placeholder { color: var(--ink-3) }` (5,38:1 / 5,83:1). `/impeccable polish`.

**[P2-14] O sync repinta e tira o foco da busca.** `sync.js:261` (`MQ.render()` quando `changed`), `notes.js:41`. Medido: com "insulina" digitado o valor é preservado, mas o foco vai a `BODY`. Preservar `activeElement` e o cursor ou repintar só `#nt-list`. `/impeccable harden`.

**[P2-15] Busca ignora a hierarquia e casa com o enunciado inteiro.** `notes.js:17` (`[x.n.text, x.q.codigo, MQ.plain(x.q.enunciado)]`). O placeholder diz "Buscar na anotação ou na questão", mas "Hérnia" e "cardiologia" (assunto) retornam 0 mesmo existindo em vários caminhos; em compensação "conduta", que só está no enunciado, retorna 45 de 47 (ruído). Incluir o caminho no texto buscado e dar peso à nota; destacar o termo encontrado. `/impeccable clarify`.

**[P2-16] Foco coberto pela barra inferior fixa no celular.** Sem `scroll-padding` no CSS. Em 75 Tabs, 12 caem em botões sob a barra (`y` 761–844 contra a barra em y=777). Não ocorre no tablet nem no PC. `scroll-padding-bottom` igual à altura da barra. `/impeccable harden`.

**[P2-17] Contraste de componente abaixo de 3:1.** Borda da busca e dos chips **1,72:1 (claro) / 1,77:1 (escuro)**, de `--line-2` (`app.css:216`); borda do "Editar" 1,89 / 1,64; borda do cartão 1,33 / 1,39 (decorativa); textarea do modal com `border-color: transparent` (`app.css:914`) e fundo `#FFF2D6` sobre branco ≈1,1:1 (só o fundo o delimita). Texto de tudo passa. Borda de campo de ≥3:1 e contorno visível no textarea. `/impeccable polish`.

**[P2-18] Estouro horizontal da página com nome de hierarquia longo e sem espaços.** `app.css:909` (`.nt-path` sem `overflow-wrap`), `notes.js:72`. Medido (B), subtema de 110 caracteres com `_`: `scrollWidth` **745/390** no celular, **1253/960** no tablet e **1759/1440** no PC; `.nt-path`, `.nt-meta`, `.nt-q`, `.nt-text` e `.nt-foot` saem do cartão e no celular o modal de edição fica deslocado e cortado. Com espaços, quebra normalmente. Condição extrema e pouco provável. `overflow-wrap: anywhere` em `.nt-path`, `.nt-meta` e nos chips. `/impeccable harden`.

**[P2-19] Crumb ativo só por cor e semântica de `aria-pressed` errada.** `notes.js:63-64`. Com filtro de profundidade > 0, o crumb ativo (`.qchip.on`) só se distingue por fundo `#E2E0F7` e cor (o "Todos" tem ✓, os demais não); os chips são uma trilha com `aria-pressed`, e não alternadores. PRODUCT.md: nunca só pela cor. Ícone ou peso no atual, `nav aria-label="Assunto"` com `aria-current`. `/impeccable polish`.

**[P2-20] Janela de perda de 250 ms após salvar.** `db.js:93-96` só grava após o debounce, sem flush em `pagehide`. Medido (A): Salvar + recarregar imediatamente perdeu a edição. PRODUCT.md: "nenhum histórico se perde". `MQ.saveNow()` no salvar e em `pagehide`/`visibilitychange`. `/impeccable harden`.

### P3 (polimento)

- **[P3-21]** Caminho completo repetido em cada cartão mesmo dentro de um filtro por tema (`notes.js:72`). Mostrar só os níveis abaixo do filtro atual.
- **[P3-22]** `Ctrl K` abre "Buscar questão" (`shell.js:17-18`), não o campo local; `/` não faz nada. Dois "buscar" com escopos diferentes.
- **[P3-23]** Ícone de lápis duplicado: Editar no cartão, "Anotação" no Resolver (`solve.js:129`) e Editar questão do admin. DESIGN.md prevê `notebook-pen` para Anotação.
- **[P3-24]** O estado vazio cita a "tecla N" (`notes.js:38`), inútil em celular e tablet; falta "toque no lápis".
- **[P3-25]** Notas de questão removida mostram só "Questão removida" + texto, sem código, caminho nem ação (`notes.js:70`): impossível saber a que se referiam.
- **[P3-26]** "×" nativo azul do `type=search` destoa dos ícones Lucide.
- **[P3-27]** Datas como `13/11/2026` sem rótulo de que é a data de edição; URL na nota não vira link; listas (`- item`) só ganham `pre-wrap`.
- **[P3-28]** Carga: 300 notas = 5.460 nós, 78–87 ms por render (63–100 ms com 45 notas e CPU 4×: 393–580 ms com 300), página de ~157 mil px no celular, sem virtualização. Aceitável hoje.
- **[P3-29]** Esc no modal de edição descarta o texto sem aviso; sem contador para o limite de 4000 caracteres.
- **[P3-30]** `kbd.hint` do rail a 2,33:1 / 2,52:1 (só ≥861 px; navegação, não esta tela) e rótulos do rail a 11 px.

## Carga cognitiva

Falham 4 dos 8 itens: **foco único** (45 primários, P1-1), **hierarquia visual** (a nota, que importa, fica atrás de metadados e de um enunciado cinza serifado de tamanho parecido), **memória de trabalho** (ao tocar "Abrir questão" a nota não aparece) e **divulgação progressiva** (nota de 3 mil caracteres aparece inteira, caminho repetido). Ponto de decisão com mais de 4 opções: linha "Grande área" com Todos + 6 chips; cada cartão com 3 ações, e com 45 cartões são 135 ações; 9 chips no total nos filtros. Passam: agrupamento, uma coisa por vez, chunking razoável. Carga **moderada a alta**. Tab: 141–155 paradas com 47 cartões; chegar ao cartão 20 custa ~65 Tabs.

## Jornada emocional

- **Chegada (boa):** "45 anotações em 45 questões" dá controle.
- **Escaneamento (cansa):** parede de caixas âmbar iguais, 15–29 mil px no celular.
- **Filtrar (satisfatório, mas frágil):** as contagens nos chips são ótimas, mas o foco cai em `BODY` e os filtros saem da vista ao rolar.
- **Revisar (frustra):** abrir a questão esconde a nota e exige "Responder".
- **Excluir (ansiedade):** sem o nome da nota, sem desfazer, sem toast.
- **Fim:** nada confirma "salvei" e o cartão editado muda de lugar.

## Bandeiras vermelhas por persona

- **Casey (distraída, uma mão, celular):** busca e filtros no topo, fora do polegar e sem ficar fixos; 15 a 29 mil px de rolagem sem "voltar ao topo"; Excluir a 6 px de Editar, com confirmação sem o nome da nota e sem desfazer; chip longo vazando; foco coberto pela barra inferior (12 de 75 Tabs); a 320 px a barra estoura a página. A favor: 0 alvos abaixo de 44 px no celular e primeiro "Abrir questão" a 82% da altura da tela.
- **Alex (teclado, PC):** foco vai a `BODY` a cada filtro, edição e exclusão; 141–155 paradas de Tab, sem skip-link, sem `/` nem atalho para a trilha, sem ordenar; `Ctrl K` abre outra busca. A favor: `Ctrl 4`, anel âmbar de 2 px visível e Esc devolve o foco ao botão de excluir.
- **Sam (acessibilidade):** contagem sem `aria-live`, 47 cartões anônimos, 1 só heading, placeholder a 3,93:1 no escuro, nota que ignora o tamanho de letra escolhido, bordas de campo a 1,72:1, modal sem focus trap, trilha como `aria-pressed`. A favor: contraste de texto 5,4:1 a 15,2:1, botões de ícone com `aria-label`, HTML escapado.
- **Residente revisando as anotações antes da prova (persona do projeto):** quer ler as notas por assunto, em sequência, sem interrupção. Hoje a nota longa ocupa 2 mil px, "Abrir questão" esconde a nota e obriga a responder (gerando tentativa), o cartão editado muda de lugar e não existe um "modo revisão" que percorra as notas.

## Perguntas para considerar

1. Se a nota é o conteúdo, por que o enunciado e o caminho ocupam mais área do que ela?
2. A aba existe para consultar ou para treinar? Hoje "Abrir questão" transforma consulta em tentativa registrada.
3. E se cada assunto da trilha fosse uma "folha do caderno" lida de ponta a ponta, em rolagem contínua e sem cartão por nota?
4. Quanto custa perder uma nota de 3 mil caracteres? E se desfazer fosse mais barato que confirmar?
5. Com 6 abas e 5 espaços na barra, qual das seis deveria ceder a posição ao polegar?
6. Por que o filtro por assunto aqui não usa a página de filtro já aprovada em Questões?

## Plano sugerido

1. `/impeccable distill` + `/impeccable layout`: P1-1 (um primário, "Abrir questão" vira secundário), P1-2 (cabeçalho fixo, voltar ao topo, restaurar rolagem), P2-6 (nota recolhível, rodapé alinhado).
2. `/impeccable harden`: P1-3 (desfazer, nome da nota no diálogo, toast), P2-8, P2-14, P2-16, P2-18, P2-20.
3. `/impeccable adapt`: P1-4 (44 px com `pointer: coarse`), P1-5 (chip longo), P2-12 (6 itens, 320 px).
4. `/impeccable shape`: P2-11 (nota visível no Resolver, modo de leitura sem tentativa). `/impeccable clarify` e `/impeccable animate`: P2-10, P2-15.
5. `/impeccable typeset`, `/impeccable audit` e `/impeccable polish`: P2-7, P2-9, P2-13, P2-17, P2-19 e o P3.

## Limitações

- Chromium headless (1254) com emulação de toque (`has_touch`, `is_mobile`); sem Safari/iOS nem Android real, sem teclado virtual, safe-area nem gestos nativos. O `pointer: coarse` do tablet é emulado pelo Playwright. O tablet foi avaliado só em 960×640 e o celular só em retrato; 320 px só por A.
- Leitor de tela não executado: as conclusões de ARIA vêm do DOM e do código.
- Dados sintéticos (45–47 notas, até 600). Nomes reais de tema do banco INEP/Ebserh podem ser mais longos ou curtos, o que muda a frequência do vazamento de chip (P1-5) e do estouro (P2-18).
- Login Google contornado com `sync.localOnly` e script do Google bloqueado/abortado; sincronização real, efeito do sync no meio da edição (simulado chamando `MQ.render()`), service worker e offline não foram exercitados.
- Contraste calculado por cores computadas e composição de camadas; o anel de foco foi estimado (≥3:1), sem cálculo numérico; hover e `:active` não foram medidos. Capturas full-page de páginas de ~29.000 px podem estar reamostradas; valem mais as medições.
- Não testei o fluxo de criar a nota no Resolver além de ler `solve.js:212-221`, nem o atalho `N`, nem a ordenação de notas empatadas. Tempo de render com `performance.now()` e CPU 4× como proxy de celular fraco, não INP real.
- `app.css` e `auth.js` têm alterações não commitadas; as medições refletem a árvore de trabalho atual.
