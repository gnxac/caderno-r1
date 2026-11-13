# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Residentes e candidatos a residência médica, colegas do administrador (Guilherme), que recebem o app e o banco publicado. Estudam em sessões longas, no celular (muitas vezes com uma mão), no tablet e no computador, resolvendo questões de provas oficiais. O administrador cadastra, importa e publica as questões; os demais só resolvem.

## Product Purpose
Pulse é um banco de questões para resolver, organizar em listas e simulados cronometrados, marcar o texto, descartar alternativas, revisar os erros e acompanhar o desempenho por assunto. Sucesso: o estudante abre o app e sabe o que fazer agora, filtra rápido o que precisa, resolve sem atrito e vê onde errar menos.

## Positioning
Controle total do estudo (marca-texto, tesoura, listas, simulados, revisão dos erros e desempenho do jeito do estudante), gratuito e sem anúncios, que funciona offline e sem conta própria: os dados ficam no aparelho e sincronizam pelo Google Drive de cada pessoa, sem servidor nem assinatura.

## Operating Context
Windows (Electron portátil), Android (APK, Capacitor 7) e navegador. Layout responsivo em três formatos pela largura da janela: celular (barra inferior), tablet (rail e 2 colunas) e computador (barra lateral, 3 colunas e atalhos de teclado). Sincronização com a pasta oculta do Drive de cada usuário. O administrador publica o banco num arquivo público do próprio Drive (manifesto com versão + banco); os aparelhos baixam só quando a versão muda. Questões são importadas de pacotes `.json`, CSV ou cadastradas à mão.

## Capabilities and Constraints
- JS puro, sem build, tudo no objeto global `MQ`; dados no IndexedDB. A stack continua a mesma na reformulação.
- **Só o nome exibido mudou para Pulse.** Ficam como estão: `appId` `br.cadernor1.app`, banco IndexedDB `caderno-r1`, arquivos do Drive, `MQ`. No Electron, `userData` fica fixo em `%APPDATA%\Caderno R1` (e `Caderno R1 Admin` na versão admin), senão o app abriria vazio ao trocar o `productName`.
- **Sincronização compatível:** a mesclagem aceita qualquer coleção presente nos dados remotos, não só as conhecidas; nenhuma função nova grava coleção nova antes de essa versão estar em todos os aparelhos.
- Coleções novas: `notes` (anotação por questão), `reviews` (revisão espaçada por questão), `prefs` (meta diária, sincronizada). Tempo por questão já é gravado (`timeSec`). Respostas antigas podem ter `conf`/`why` (recurso removido); são ignorados.
- IDs de questões nunca mudam; remover = `deleted: true` (lápide).
- Só o administrador (`guilhermeacnx@gmail.com`) cadastra, importa e publica. Por padrão só provas oficiais (INEP/Ebserh) são publicadas; questões de cursos (como o Estratégia) não são publicadas.
- Detecção de questões repetidas por texto (alternativas embaralhadas incluídas).
- Sem servidor: não existe estatística coletiva (ex.: "% de acerto geral da questão").
- Em aberto: imagens das questões ainda não são publicadas com o banco.

## Scope of the Redesign
Funções que entram (plano aprovado: https://claude.ai/artifact/5UEsWEqJe55ZWP6JTiBqVA):
- **Início:** continuar de onde parei, meta diária, sequência, revisões do dia, ponto mais fraco com "Treinar agora", heatmap, sessão rápida de 10 questões.
- **Questões:** busca global (`Ctrl K`), caderno de erros automático, revisão espaçada das erradas (Leitner 1-3-7-15-30 dias), anotações por questão, tempo por questão, modo foco, gerar flashcard Anki (.txt; AnkiConnect no Windows), selo de anulada e desatualizada.
- **Anotações:** aba com todas as anotações das questões, filtro por assunto (hierarquia da questão), busca, editar e excluir.
- **Listas:** listas inteligentes (filtros salvos), progresso por lista, ordenar, duplicar e mover entre pastas.
- **Simulados:** modo prova por instituição (predefinições editadas e publicadas pelo admin), cartão-resposta, revisão pós-prova.
- **Desempenho:** evolução semanal, tempo médio, pontos fracos, por instituição, heatmap, histórico de simulados.
- **Configurações:** status de sincronização detalhado, backup e restauração (restaurar mescla, nunca apaga), meta, lembrete, atalhos.
- **Android:** lembrete diário por notificação local.

Fora, ou depois:
- **% de acerto geral da questão:** exigiria servidor; no lugar, o histórico do próprio estudante na questão.
- **Importar PDF:** só o admin importa, e fica em Configurações › Administrador, não em Listas; deixado para depois.
- **Widget Android:** código nativo, pouco ganho; o lembrete cobre a necessidade.
- **Ver gabarito sem responder:** não existe, de propósito.

## Brand Commitments
- **Nome:** Pulse.
- **Logo:** "pulso que vira check" (linha de monitor com um pico que termina em check), traço branco sobre índigo `#4338A8`; glifo sem fundo em `currentColor` dentro do app.
- **Paleta:** Índigo + ciano. Índigo para ação, ciano só para conquistas. Escuro quase preto com leve tom índigo.
- **Tipografia:** Manrope na interface, Literata no enunciado.
- **Ícones:** só Lucide, traço de 2 px.
- Detalhes e tokens em `DESIGN.md`.

## Evidence on Hand
Sem depoimentos, métricas ou casos de uso formais; não inventar. Questões de exemplo autorais no `seed.js`.

## Product Principles
- O estudante controla o estudo: filtros, listas e simulados sob medida.
- Toda tela responde "o que faço agora?" com uma ação principal.
- Dados são do usuário: offline primeiro, sincronização pela conta Google dele.
- Nenhum histórico se perde: IDs estáveis, lápides, repetidas mescladas sem apagar respostas, mesclagem que não descarta coleções desconhecidas.
- Leitura longa e uso com uma mão vêm antes de enfeite.
- O banco publicado é curado: oficial por padrão, conteúdo de curso fica privado.

## Accessibility & Inclusion
Leitura longa confortável: tamanho do enunciado ajustável (mínimo 15 px), linha de até ~68 caracteres, contraste mínimo 4,5:1 em claro e escuro. Certa e errada nunca dependem só da cor (✓ e ✗). Uso no celular com uma mão: alvos de toque de pelo menos 44 px e ações principais ao alcance do polegar. Teclado completo no computador, com anel de foco visível. Animações respeitam "reduzir movimento".
