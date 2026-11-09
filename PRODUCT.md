# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Residentes e candidatos a residência médica, colegas do administrador (Guilherme), que recebem o app e o banco publicado. Estudam em sessões longas, no celular (muitas vezes com uma mão) e no computador, resolvendo questões de provas oficiais. O administrador cadastra, importa e publica as questões; os demais só resolvem.

## Product Purpose
Banco de questões para resolver, organizar em listas e simulados cronometrados, marcar o texto, descartar alternativas e acompanhar o desempenho por assunto. Sucesso: o estudante filtra rápido o que precisa, resolve sem atrito e vê onde errar menos.

## Positioning
Controle total do estudo (marca-texto, tesoura, listas, simulados e desempenho do jeito do estudante), gratuito e sem anúncios, que funciona offline e sem conta própria: os dados ficam no aparelho e sincronizam pelo Google Drive de cada pessoa, sem servidor nem assinatura.

## Operating Context
Windows (Electron portátil), Android (APK, Capacitor 7) e navegador. Sincronização com a pasta oculta do Drive de cada usuário. O administrador publica o banco num arquivo público do próprio Drive (manifesto com versão + banco); os aparelhos baixam só quando a versão muda. Questões são importadas de pacotes `.json`, CSV ou cadastradas à mão.

## Capabilities and Constraints
- JS puro, sem build, tudo no objeto global `MQ`; dados no IndexedDB.
- IDs de questões nunca mudam; remover = `deleted: true` (lápide).
- Só o administrador (`guilhermeacnx@gmail.com`) cadastra e publica. Por padrão só provas oficiais (INEP/Ebserh) são publicadas; questões de cursos (como o Estratégia) não são publicadas.
- Detecção de questões repetidas por texto (alternativas embaralhadas incluídas).
- Em aberto: imagens das questões ainda não são publicadas com o banco.

## Brand Commitments
Nome: Caderno R1. Ícone e marca em azul (#1F3A4D / #2F6F8F). Modo escuro neutro (preto/cinza, sem tom azul nos fundos), mantendo azul só nos destaques.

## Evidence on Hand
Sem depoimentos, métricas ou casos de uso formais; não inventar. Questões de exemplo autorais no `seed.js`.

## Product Principles
- O estudante controla o estudo: filtros, listas e simulados sob medida.
- Dados são do usuário: offline primeiro, sincronização pela conta Google dele.
- Nenhum histórico se perde: IDs estáveis, lápides, repetidas mescladas sem apagar respostas.
- Leitura longa e uso com uma mão vêm antes de enfeite.
- O banco publicado é curado: oficial por padrão, conteúdo de curso fica privado.

## Accessibility & Inclusion
Leitura longa confortável: tamanho de letra ajustável, contraste mínimo 4,5:1 (claro e escuro neutro). Uso no celular com uma mão: alvos de toque de pelo menos 44px e ações principais ao alcance do polegar.
