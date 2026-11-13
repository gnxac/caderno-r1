# Crítica de design: Listas e Simulados (Pulse)

Data: 2026-11-13 · Nota: **24/40 (Aceitável)** · P0: 0 · P1: 4 · P2: 14 · P3: 6

**Método:** dual-agent. A é a revisão de design e B é o detector com medições em Playwright headless. Rodaram isolados, em 390×844 (toque), 960×640 e 1440×900, em claro e escuro, nos estados vazio e populado de Listas e Simulados, menus, modal de criar simulado, simulado em andamento, cartão-resposta, confirmação de finalizar, resultado e revisão. Referência: `PRODUCT.md` ("toda tela responde o que faço agora?" e "leitura longa e uso com uma mão"). Nenhum arquivo do projeto foi alterado na avaliação, e nenhum snapshot foi gravado em `.impeccable/critique/`.

Não houve overlay visível no navegador do usuário (o live-server abriria janela). Capturas e dados brutos ficaram na pasta temporária da sessão (scratchpad `A\` e `B\`). Telas avaliadas em conjunto; Simulados está mais fraco que Listas.

## Nota

| # | Heurística | Nota | Problema principal |
|---|---|---|---|
| 1 | Visibilidade do status | 2 | Simulado em andamento fica no fim da lista, sem tempo restante, com "Sem tentativa". |
| 2 | Linguagem do usuário | 3 | "Cartão-resposta" e "Modo prova" funcionam. "Continuar da 1" e "1 disponíveis" não. |
| 3 | Controle e liberdade | 3 | Sair e cancelar existem. Não há pausa e "Finalizar" só tem uma confirmação. |
| 4 | Consistência | 2 | O mesmo botão índigo cheio se repete em todo cartão. "Fazer prova" é secundário e "Iniciar" é primário. O Caderno de erros usa vermelho para uma função neutra. |
| 5 | Prevenção de erros | 3 | O confirm de Finalizar conta as em branco, mas não as marcadas. "Resolver" fica ativo em lista vazia. |
| 6 | Reconhecimento | 2 | O cartão-resposta não tem legenda. O filtro da lista inteligente é invisível. |
| 7 | Flexibilidade | 2 | Listas não têm atalhos. O simulado tem `A–E` e `M`. |
| 8 | Minimalismo | 3 | Limpo, mas 4 cartões de prova vêm antes do conteúdo do usuário. |
| 9 | Recuperação de erros | 2 | Toasts curtos. Nenhum aviso quando o tempo está acabando em outra tela. |
| 10 | Ajuda | 2 | A dica de 2,5 a 3,5 min por questão é boa. "Inteligente" e "Modo prova" não são explicados. |
| **Total** | | **24/40** | **Aceitável** |

## Escopo do PRODUCT.md e DESIGN.md: o que existe e o que falta

| Item | Estado |
|---|---|
| Listas inteligentes (filtro salvo) | Pela metade. Só nasce em Questões; em Listas, "Criar › Nova lista" só manda para o banco com um toast. O filtro não é visível nem editável em Listas. |
| Progresso por lista | Existe (barra verde/vermelha, "% feito", "% acerto"). Detalhe com acerto por tema só no PC ≥1200px. |
| Ordenar | Existe (Recentes, Nome, Progresso, Acerto), escondido num menu. |
| Duplicar | Existe, com 5 variantes num menu de 11 itens. |
| Mover entre pastas | Existe (menu ⋯ e modal "Mover"). |
| "Fixos no topo: listas em andamento" (DESIGN.md) | Não existe. Só o Caderno de erros é fixo. |
| Modo prova por instituição | Existe, mas derivado do banco (instituição + ano com ≥10 questões, 3 min/questão). Não há predefinições editadas pelo admin. |
| Cartão-resposta | Existe (modal no celular, painel lateral ≥861px). Sem legenda. |
| Revisão pós-prova | Existe (resultado e reuso do Resolver). |
| "Primeiro o simulado em andamento, com tempo restante" (DESIGN.md) | Não existe. Aparece por último e sem tempo restante. |
| "Concluídos com nota, data e tempo" | Só mostra a nota. |

## Especificidade de design

- **Avaliação A:** parcialmente autoral. A paleta índigo, Manrope com Literata e a barra verde/vermelha vêm do produto. As duas telas, porém, são grades de cartões idênticos (ícone, nome, "N questões", barra, botão primário) que serviriam a qualquer app de cursos. O simulado é o ponto de maior tensão do produto e o resultado é só "17%" e uma lista de métricas.
- **Detector:** `lists.js` e `sim.js` deram 0 achados, mas ele não lê o HTML montado por template string, então o resultado limpo não prova nada. `www/index.html` teve 1 achado real (contraste, P2-9). `detect www` trouxe mais 62 avisos de desvio do DESIGN.md em `app.css`: 41 de tamanho de fonte, 12 de raio e 9 de cor.

## O que funciona

1. **O modo prova do simulado é bem resolvido.** A barra lateral some e o timer fica visível. O cartão-resposta tem círculos de 44px. Há teclado `A–E` e `M`, o tempo por questão é gravado e o resultado mostra as 5 que mais demoraram. No celular, as alternativas ficam entre 51% e 68% da altura da tela, no alcance do polegar.
2. **Tema escuro consistente.** Cartões, modais, resultado e cartão-resposta mantêm hierarquia e contraste nos dois temas.
3. **Foco visível sempre.** Em 15 de 15 paradas de Tab por estado havia contorno âmbar de 2px. Não houve erro de console, controle sem nome nem overflow horizontal em nenhum dos 6 formatos e temas.

## Problemas por prioridade

Não há P0: nenhum problema impede a tarefa por completo.

### P1: maior dificuldade ou confusão

**P1-1. Listas vazia não diz o que fazer** (`lists.js:309`). O cartão do Caderno de erros sempre existe, então a condição `cards ? grid : empty` nunca cai no estado vazio. Quem abre o app sem listas vê um cartão com "Revisar" desabilitado, e no PC um painel "Escolha uma lista…" sem nenhuma lista. Isso quebra "toda tela responde o que faço agora". Os dois avaliadores confirmaram, em todos os formatos e temas.
Correção: mostrar o estado vazio com "Ir para Questões" abaixo do Caderno de erros quando não houver lista visível, e esconder o painel de detalhe vazio.
Comando: `/impeccable onboard`.

**P1-2. Simulado em andamento enterrado e sem tempo restante** (`lists.js:212,219`). Ele aparece depois de 4 cartões de prova e ordenado só por data, com a barra vazia e "Sem tentativa". O relógio continua correndo e a tela não diz. O DESIGN.md pede "primeiro o simulado em andamento, com tempo restante", e isso não existe.
Correção: fixar um cartão no topo, "Em andamento · 12:40 restantes · Continuar", e trocar "Sem tentativa" por "x de y respondidas".
Comando: `/impeccable layout`.

**P1-3. "Provas por instituição" ocupa a tela antes do conteúdo do usuário** (`lists.js:286-289,308`). No celular são ~760px de cartões. "Fazer prova" é botão secundário enquanto os cartões do usuário têm botão primário, o que inverte a hierarquia. Aparece também "Exemplo autoral 2026" como se fosse instituição, e "Modo prova" não difere do simulado comum.
Correção: recolher a seção por padrão, numa linha "Provas oficiais: ENARE 2025, USP-SP 2024… ver todas", e colocá-la depois dos simulados do usuário.
Comando: `/impeccable distill`.

**P1-4. Resultado do simulado sem ação principal** (`sim.js:376`). São 5 botões com quase o mesmo peso (Listas, Criar lista com os erros, Refazer, Revisar só as erradas, Revisar questões), empilhados no topo do celular, fora do alcance do polegar. O principal, "Revisar questões", é o terceiro. O placar também é frio: "17%" sem leitura, sem comparação com a tentativa anterior e sem próximo passo.
Correção: uma ação principal fixa na base ("Revisar as erradas" quando houver erro), o resto num menu ⋯, e uma frase de leitura abaixo da nota.
Comando: `/impeccable layout`.

### P2: incômodo com contorno possível

**P2-5. Detalhe da lista só no PC.** No celular e no tablet, tocar no cartão abre direto o Resolver (`lists.js:338`). Acerto por tema, "Refazer erradas" e "Criar simulado" só aparecem no ⋯, um menu de 11 itens em que 5 são variações de "Duplicar apenas com…" (`lists.js:141-159`). Os itens do menu medem 40px e o botão ⋯ encolhe para 34×44 em nome longo (`[data-lmenu]`, flex-shrink). Correção: bottom sheet de detalhe com 2 ações e um submenu para as duplicações.

**P2-6. "Nova lista" e "Novo simulado" não criam nada** (`lists.js:346-347`). Só levam ao banco com um toast que some rápido. Correção: criar a lista vazia ali mesmo (nome e pasta), ou manter o desvio com um banner persistente em Questões.

**P2-7. Ações no topo no celular.** "Criar" e "Recentes" ficam a ~12% da altura, fora do alcance do polegar (`lists.js:306`). O "Anterior" do simulado não está na barra inferior e exige rolar até o fim (`sim.js`, `.qnav`). Correção: botão flutuante ou barra inferior acima da navegação, e "Anterior" ao lado de "Próxima".

**P2-8. Contraste de elementos não textuais abaixo de 3:1** (WCAG 1.4.11), em claro e escuro:

| Elemento | Contraste |
|---|---|
| Trilho de progresso (`.lbar`, `.bar-track`) | 1,09–1,22 |
| Borda do `.lcard` e do `.sim-bar` | 1,33–1,39 |
| Borda do botão secundário e do chip de pasta | 1,72–1,77 |
| Borda de `.alt`, `select` e `input` | 1,64–1,89 |
| Controle segmentado | 1,09–1,22 |

O trilho de 6px quase some, então "0% feito" parece vazio. A borda do `input[type=text]` tem o mesmo tom do fundo (1,0). Correção: subir os tokens de borda e de trilho. Comando: `/impeccable polish`.

**P2-9. Atalhos "Ctrl 1…6" da navegação com contraste baixo** (`app.css:113-114,130,658`), só no PC. Em repouso medem 2,33:1 (claro) e 2,52:1 (escuro), por causa de `opacity:.55`. O item ativo no escuro mede 4,20:1. O detector confirmou (`low-contrast`, `www/index.html`), e o navegador mostra um valor pior que o estático. Correção: remover a opacidade e usar o token `--ink-3` com contraste ≥4,5.

**P2-10. Texto pequeno demais para leitura longa.** Os badges têm 11,5px. Os kickers de seção ("Provas por instituição", "Detalhe") têm 11px, assim como os rótulos da navegação e as letras do cartão-resposta. Contagens e botões `.btn.sm` ficam em 12–13px. O piso devia ser 13px nos metadados e 14px no que se lê.

**P2-11. Cartão-resposta sem legenda.** Anel significa "marcada" e círculo cheio significa "respondida", sem nenhuma explicação, e a combinação marcada + respondida + atual é difícil de distinguir. O botão "Ir para a próxima em branco" mede 322×32 (`.btn.sm.sc-next`, abaixo de 44px) na zona do polegar, porque `.btn.sm` vence a regra `min-height:44px` de `sim.css`. Correção: legenda curta, ícone de bandeira no círculo marcado e `min-height` correto.

**P2-12. Modal "Criar simulado".** O total ("6 questões no simulado") some atrás do rodapé no celular e no tablet (`sim.js:58`). "Min/questão" e "tempo total" são dois campos acoplados com lógica oculta (`manualTime`), e os `−`/`+` são glifos de texto. Correção: total fixo perto do botão e ícones Lucide `minus` e `plus`.

**P2-13. Cabeçalho do resultado esmagado no tablet** (`sim.js:375-376`, `app.css:124`). A 960px o título vira uma coluna estreita ("Cardio / — / revisão…") e "Finalizado em…" fica ilegível, sobrepondo o link "Listas". Correção: `flex-wrap` na `.page-head` e ações abaixo do título em ≤1100px.

**P2-14. Aproveitamento da largura.** No PC (1440), a coluna de cartões tem só 540px, com 2 colunas de 265px, e nomes longos quebram em até 6 linhas, enquanto a área de conteúdo tem 1148px. No simulado, o `.qcard` tem 820px numa coluna de 1048px, o que deixa um vão de 248px até o cartão-resposta. No tablet (960) não há painel de detalhe e nada indica a seleção do cartão (`.lcard.sel` só existe no PC).

**P2-15. Dados sem sentido em simulado novo.** O detalhe mostra "0 de 4 respondidas na última prova" e "4 em branco" (`lists.js:259-260`) para quem nunca fez. Correção: esconder as métricas quando não há tentativa (`!n.last`). Também: "Resolver" fica habilitado em lista vazia e a primeira lista vazia é selecionada por padrão no PC (`lists.js:297`).

**P2-16. Teclado e leitor de tela na prova.** São 10 paradas de Tab por questão (5 `role=radio` mais 5 tesouras), sem navegação por setas (`sim.js:246-249`). O timer tem `aria-live="off"` e não avisa aos 10/5/1 min (`sim.js:237`), e a cor muda só abaixo de 5 min.

**P2-17. Confirm de Finalizar** só conta as em branco (`sim.js:305`). Incluir "N marcadas para revisar".

**P2-18. Funções do escopo que faltam:** predefinições de instituição editadas pelo admin, e concluídos com data e tempo, não só a nota. A lista inteligente nasce só em Questões, e o filtro não aparece nem se edita em Listas.

### P3: polimento

**P3-19.** Copy: "Continuar da 1" (`lists.js:261`; devia ser "da questão N"), "1 disponíveis" e "1 marcadas" (`sim.js:42,212`), "Nota 50%" sem contexto, "0:04 de 18 min" misturando formatos, e o título "Cardio — revisão — simulado — revisão" repetitivo.

**P3-20.** O Caderno de erros usa `--err-soft` como fundo (`app.css:831`, `lists.js:229`), contra a regra de verde/vermelho só para acerto e erro. O "Revisar" desabilitado em cima do rosa quase não se lê.

**P3-21.** A dica "Teclas A–E para marcar, M para marcar a questão" aparece no celular (`sim.js:249`). Esconder em `(hover: none)`.

**P3-22.** A 320px a navegação inferior (341px de largura) corta "Ajustes". É um caso extra, fora dos três formatos pedidos.

**P3-23.** A revisão pós-prova reaproveita o Resolver, com o banner "Resposta correta!" e o relógio vazio "-" no cabeçalho.

**P3-24.** Os 62 avisos de desvio do DESIGN.md em `app.css` (tamanhos fora da escala, raios, cores). Linhas 811-872 são de `.lst*` e `.lcard`, e 433, 466, 652 e 666 de badge e chip. Também: na tela Simulados as pastas são as mesmas de Listas e mostram 0, sem explicação; "Mostrar todas (n)" só aparece com mais de 4 provas.

## Persona: bandeiras vermelhas

- **Casey (uma mão, celular, sessão longa):** "Criar" e "Recentes" a 12% da altura. O simulado em andamento só aparece depois de rolar quase 3 telas. O botão de sair da prova fica no canto superior esquerdo. O resultado empilha 5 botões no topo. A alternativa E fica parcialmente sob a barra fixa com a página no topo. A favor: "Próxima" e "Cartão" estão a 96% da altura.
- **Alex (teclado, PC):** sem atalhos em Listas, menu ⋯ de 11 itens sem busca, duplicação só por menu e 10 Tabs por questão na prova. Não dá para editar o filtro de uma lista inteligente.
- **Sam (acessibilidade):** timer mudo, atalhos da navegação a 2,3–2,5:1, trilhos e bordas abaixo de 3:1, cartão-resposta distinguido só por anel e cor em 11px, e radios sem setas. A favor: foco âmbar sempre visível e `aria-label` completo nos círculos.

## Perguntas para pensar

1. Se o simulado é o ápice emocional do produto, por que a única diferença entre uma prova e um treino casual é um relógio?
2. Uma lista inteligente que não mostra o filtro que a gerou é uma lista inteligente ou uma lista aleatória que muda sozinha?
3. O que o estudante deve sentir ao ver "17%" depois de 6 questões: informação, vergonha ou um plano de estudo?

## O que não foi verificado

- **Login e banco real:** não houve login Google real nem banco publicado (`googleWebClientId` vazio). Foi usado "continuar sem conta" e as questões-exemplo do seed, mais 35 sintéticas para forçar as provas por instituição.
- **Estados não alcançados:** timer abaixo de 5 min, expiração automática do tempo, retomada de simulado depois de dias, "Continuar da N" numa lista parcialmente respondida, o diálogo "Modo prova" e a tabela de tentativas (precisa de 2 ou mais provas concluídas).
- **Ambiente de teste:** leitor de tela real (NVDA/VoiceOver), toque e iOS reais (a emulação é Chromium), paisagem, tablet retrato e zoom do navegador.
- **Alterações em andamento:** `app.css` e `auth.js` têm mudanças não commitadas, que podem ter alterado o visual depois das medições.
