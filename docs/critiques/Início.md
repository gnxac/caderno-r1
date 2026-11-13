# Crítica de design: Início

Data: 2026-11-13 · Alvo: tela Início (`www/js/home.js`, `www/js/shell.js`, `www/css/app.css`) · Referência: PRODUCT.md e DESIGN.md

Method: dual-agent (A: revisão de design · B: detector e medições no navegador). Os dois rodaram isolados, em Playwright headless, sem abrir janela e sem editar nada no projeto. O login Google foi contornado só no perfil temporário do teste (`MQ.local.sync.localOnly` / botão `#lg-local`).

Formatos: celular 390×844, tablet 960×640, PC 1440×900, em claro e escuro, com dois estados semeados (primeiro uso e com histórico). Console sem erros em todas as execuções. O overlay do detector no navegador não foi gerado, para não abrir janela no PC (CLAUDE.md).

## Impressão geral

A Início se reorganiza de verdade entre os formatos: 1 coluna no celular, 2 no tablet e 3 no PC. Não tem overflow horizontal e o foco por teclado é visível em tudo. O problema é que ela não responde "o que faço agora?" com uma única ação:

- No celular, a ação principal está no topo da tela, longe do polegar.
- No PC e no tablet, dois botões cheios disputam a atenção.
- Depois do primeiro dia, o destaque "Continuar" aponta sempre para a última sessão, mesmo concluída.

## Nota de Nielsen (A): 25/40 (Aceitável)

| # | Heurística | Nota | Problema-chave |
|---|---|---|---|
| 1 | Estado do sistema | 2 | Abaixo de 1200px o pill de sync vira um ponto sem texto |
| 2 | Mundo real | 3 | Copy boa; letras da semana ambíguas |
| 3 | Controle | 3 | "Continuar" não expira; não dá para dispensar cartões |
| 4 | Consistência | 3 | Verde em vez de ciano em "Em dia"; alvos de 44px falham no tablet |
| 5 | Prevenção de erros | 3 | Sem riscos relevantes |
| 6 | Reconhecimento | 3 | Heatmap só mostra a data no hover |
| 7 | Eficiência | 2 | Sem atalho nem skip-link para a ação principal |
| 8 | Minimalismo | 2 | PC com 8 cartões e heatmap quase vazio ocupando 241px |
| 9 | Recuperação de erros | 2 | `last` apontando para questão apagada só gera toast |
| 10 | Ajuda | 2 | Nada explica a revisão 1-3-7-15-30 nem o "ponto mais fraco" |
| | **Total** | **25/40** | |

**Carga cognitiva:** 4 falhas de 8, o que é alta. Foco único, uma coisa por vez, opções mínimas (12 interativos no PC) e divulgação progressiva falham.

**Especificidade:** metade é do domínio ("Continuar", revisões atrasadas, ponto mais fraco por área, sessão rápida de 10). A outra metade é kit de hábito genérico: anel de meta, bolinhas da semana, heatmap. Nada na tela diz "residência" (prova-alvo, tamanho do banco, dias até a prova).

**Jornada emocional:** abre calmo ("Bom dia" e um cartão lilás). O primeiro uso é positivo, mas no PC é um cartão num mar vazio. Com histórico, a sequência dá satisfação rápida, e o "6 atrasadas" em vermelho gera ansiedade sem saída clara. Depois da primeira sessão fica o "e agora?".

## O que funciona

- **Reorganização real por formato**, com cartões extras (áreas, simulados) só onde cabem.
- **Celular limpo nas medições:** 0 alvos abaixo de 44px, 0 overflow, 0 contrastes abaixo de 4,5:1 (menor razão 4,84) nos dois temas.
- **Foco por teclado:** anel âmbar de 2px (#B45309 no claro, #FBBF24 no escuro). Reduzir movimento também é respeitado.
- **Primeiro uso:** "Comece por aqui" tem uma ação cheia e uma secundária.

## Problemas por prioridade

Não há P0: nada impede a tarefa.

### P1

1. **"Continuar de onde parei" nunca expira e a sessão rápida some.**
   - Onde: todos os formatos.
   - Evidência: `home.js:102-116`; `solve.js:94-97` grava `last` em toda sessão e nada o limpa ao terminar.
   - Efeito: depois de uma sessão rápida ou revisão aparece "Continuar: Sessão rápida · Questão 10 de 10". O PRODUCT.md diz que o destaque vira sessão rápida quando não há lista em andamento nem revisões.
   - Correção: limpar `last` quando a sessão acaba, ou só oferecê-lo se `idx < total-1`.
   - Observação: o avaliador A confirmou isso pelo código, não por captura.
2. **Dois botões cheios competem.**
   - Onde: PC e tablet.
   - Evidência: `home.js:100,136`, "Continuar" e "Revisar agora" são ambos `btn primary`.
   - Correção: com revisões vencidas, a ação do destaque vira "Revisar agora (N)". Sem vencidas, "Revisar" fica secundário. Um botão cheio por tela.
3. **No celular, a ação principal está fora da zona do polegar.**
   - Medidas: "Continuar" em 25% da altura, "Sessão rápida" no primeiro uso em 28%, "Revisar agora" em 69%, "Treinar" em 93%.
   - Divergência: o DESIGN.md:262 promete ação fixa acima da barra, mas nada na Início é `fixed` ou `sticky`.
   - Correção: barra fixa acima da navegação, como o `.qh-fab`, com a ação do dia.
4. **Alvos de toque abaixo de 44px no tablet.**
   - Onde: 861px ou mais com `pointer: coarse` (medido a 960px).
   - Medidas: "Continuar" 129,6×40; "Revisar agora" 124,3×40; "Treinar 20 questões" 194,8×40; "Mudar meta" 96×32.
   - Causa: `app.css:204` (`.btn.sm{min-height:32px}`) e `:980-988`; a regra `(pointer: coarse)` não inclui `.btn` nem `.btn.sm`, e a de 44px só vai até 860px (`:167-173`, `:805`).
   - Correção: piso de 44px por `(pointer: coarse)`, não por largura.

### P2

5. **Estado de sync só em cor e duplicado no PC.**
   - Evidência: `app.css:147` esconde `.sync-label` abaixo de 1200px, e o ponto não tem `aria-label` (`home.js:222`). Erro e "sincronizando" ficam só na cor.
   - No PC, "Sem sincronização" aparece duas vezes (pill do topo e rodapé da barra lateral).
   - Correção: manter texto ou ícone com `aria-label` no pill, e mostrar um só lugar por formato.
6. **Dica "Ctrl N" do menu com contraste real de 2,33:1 (claro) e 2,52:1 (escuro).**
   - Onde: PC ≥1200px com hover.
   - Evidência: `app.css:113-114` (opacity .55, 11px); o item ativo no escuro fica em 4,20:1. Detector e medição concordam. O detector estático subestima (aponta 4,0:1).
   - Correção: tirar o `opacity .55` ou subir o token.
7. **Estrutura sem navegação por leitor de tela.**
   - Evidência: há 1 `h1` ("Bom dia"), nenhum `h2`, e as 8 `section.hm-card` sem nome. Os títulos são `div.mk`.
   - Correção: `<h2>` com `aria-labelledby`.
8. **Semana e heatmap só funcionam com cor e mouse.**
   - Evidência: a semana tem `aria-label` genérico, e o heatmap só mostra a data no `title`. A célula nível 1 no claro tem ~1,05:1 contra o nível 0 e some. As letras S/Q se repetem (S = seg, sex, sáb).
   - Correção: `aria-label` com os dias, ✓ nos dias estudados, subir `--heat-1`, usar "seg ter qua…".
9. **Primeiro uso no PC e tablet.**
   - Evidência: `.hm-grid.first` com 900px máx. deixa ~70% da tela vazia, e o cartão "Meta 0/20" é ruído antes da primeira resposta. Também não diz que o banco é de exemplo (12 questões).
   - Correção: passos concretos e "Banco: N questões".
10. **PC com histórico sobrecarregado.**
    - Evidência: 12 interativos e 8 cartões na primeira dobra; heatmap quase vazio ocupa 241px; a página rola 52px a mais que a janela (952px num viewport de 900px).
    - Correção: heatmap de 33 semanas só em Desempenho; na Início, uma linha de 7 dias.
11. **Texto de 11px.** Aparece nos títulos dos cartões (`app.css:756`), nas letras da semana (`:778`), na legenda do heatmap (`:787`), nos rótulos do menu no celular e tablet (`:137`) e no selo "atrasadas" (11,52px). Mínimo de 12px, ou 13px nos rótulos.
12. **"Ponto mais fraco" sem ação quando faltam dados.** `home.js:140`: só texto longo e nenhum botão. Mostrar a progressão ("8 de 15") e "Resolver por tema".
13. **Sem nada de residência na tela.** Falta prova-alvo, tamanho do banco ou dias até a prova.

### P3

14. "Em dia" usa verde (`home.js:134`), mas o DESIGN.md pede ciano.
15. Sem skip-link e sem atalho de teclado para a ação principal; o Tab passa por 6 itens de menu antes.
16. "0 acertos, 0 erros" aparece quando os contadores são zero (`home.js:109`).
17. No PC, o botão de "Continuar" fica a ~700px do título.
18. `ago()` mostra "há 24 horas" em vez de "ontem".
19. "Boa noite" vale de 0h às 5h, o que soa estranho para quem estuda de madrugada (`home.js:218`).
20. O DESIGN.md diz 5 itens na barra inferior (:262) e 6 abas (:289); o DOM tem 6.
21. O detector reportou 62 avisos de escala em `app.css` (41 de tamanho de fonte, 12 de raio, 9 de cor fora do DESIGN.md). Quase todos são de outras telas. Os 3 `script-error` apareceram só numa corrida de carregamento do teste e não se repetiram.

## Evidência determinística (B)

- **Detector estático:** `www/index.html` 1 achado (`low-contrast`, o `kbd.hint`); `www/js` 0; `www/css` 62 advisories.
- **Detector via CDP (Início renderizada):** celular claro e escuro 0 achados; PC claro 1 `low-contrast` (`kbd.hint`, 2,3:1); PC escuro `gray-on-color` e `low-contrast` no mesmo `kbd.hint` (2,5:1 e 4,2:1).
- **Console:** 0 `pageerror`, 0 requisições falhas, 0 HTTP ≥ 400 nas 12 combinações. Único aviso: Service Worker bloqueado pelo Playwright (artefato do teste).
- **Alvos < 44px:** celular 0; tablet 4 (os botões do item 4); PC 10, todos ≥ 40px (mínimo de PC do DESIGN.md).
- **Fonte mínima:** 11px em todas as combinações. Comprimento de linha máximo 46 caracteres (56 no primeiro uso).
- **Foco:** `:focus-visible` com outline sólido de 2px em todos os elementos, sem armadilha.
- **Movimento:** com `prefers-reduced-motion: reduce`, 0 transições e 0 animações.
- **Navegação:** celular `fixed` embaixo (67px, 6 itens); tablet `sticky` rail de 76px; PC `sticky` barra lateral de 220px com atalhos.
- **Grade da Início:** celular 1 coluna, tablet 2 colunas, PC 3 colunas; heatmap com 20, 18 e 33 semanas.

## Persona: o que quebra

- **Casey (celular, uma mão):** ação principal a 25% da tela (3), 10 interativos na dobra, sync ambíguo (5). Bom: 44px em todos os alvos, sem overflow.
- **Alex (PC):** sem atalho da ação principal (15), dois botões cheios (2), "Continuar" obsoleto (1), sync repetida (5).
- **Sam (teclado e leitor de tela):** 6 paradas de menu antes do conteúdo, 1 heading, sem nome nas seções (7), semana e heatmap mudos (8), sync sem texto (5). Foco visível é bom.
- **Jordan (primeiro uso):** tela vazia no PC e meta zerada (9), não sabe que o banco é de exemplo.

## Observações menores

- Letras da semana: S aparece em segunda, sexta e sábado.
- A barra inferior do celular tem 6 itens; o DESIGN.md se contradiz entre 5 e 6.
- No escuro, o texto do botão primário parece mais fino que no claro (medido 7,35:1, passa).
- "Acerto por grande área" mostra 0% com trilho vazio e sem texto; baixa amostra (n=6) tem a mesma ênfase de n=22.
- Sem skeleton de carregamento (render síncrono); aceitável por ser dado local.
- `MQ.syncStatus` é lido uma vez no render; o pill pode não atualizar quando a sincronização termina (não testado).

## Perguntas para pensar

1. Às 23h, com 6 revisões atrasadas, uma sessão pela metade e a meta em 14/20, qual é a única coisa que o Início deve mandar fazer, e por que hoje essa escolha fica com o estudante?
2. Se o banco fosse de concurso em vez de residência, alguém notaria diferença na Início?
3. O heatmap de 33 semanas serve ao estudo ou à sensação de painel completo?

## Não verificado

- Offline, erro de sync e "sincronizando" foram vistos só pelo código.
- O login Google real não foi testado.
- Não houve toque em aparelho real nem rolagem real; `pointer: coarse` do tablet foi confirmado só no CSS e na emulação.
- O estado "Revisões em dia" (badge verde) não foi semeado.
- Texto sobre o gradiente do anel de meta não teve contraste calculado de forma confiável.

## Capturas e dados

- Avaliador A: `C:\Users\GUILHE~1\AppData\Local\Temp\claude\c1f5f307fdddebd3\6b8554ec-9105-47fb-be69-b78a59568ad5\scratchpad\avaliadorA\` (padrão `{first|hist}-{cel|tab|pc}-{light|dark}.png`, `-full.png`, `-focus.png`; `results.json`).
- Avaliador B: `C:\Users\GUILHE~1\AppData\Local\Temp\claude\c1f5f307fdddebd3\6b8554ec-9105-47fb-be69-b78a59568ad5\scratchpad\avaliadorB\` (36 capturas `shot-{primeiro|historico}-{cel|tab|pc}-{claro|escuro}-{dobra|foco|pagina}.png`; `results.json`, `det-*.json`, `cdpdet-*.json`).
- Essas pastas são temporárias e podem ser apagadas pelo sistema.
