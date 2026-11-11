# Plano de implementação: reformulação para Pulse

Ordem aprovada na fase 1. Marque `[x]` ao concluir cada item. Decisões de visual em `DESIGN.md`, de produto em `PRODUCT.md`; plano e mockups: https://claude.ai/artifact/5UEsWEqJe55ZWP6JTiBqVA

**Toda etapa só termina quando:**
- testada no celular (390×844), no tablet (960×640) e no PC, em claro e escuro, sem erro no console;
- uma sincronização real entre dois aparelhos não perdeu nem duplicou dados;
- passou por `revisor-codigo` e `testador-navegador` antes do commit.

## 0. Fundação de dados
- [ ] `mergeData` mescla qualquer coleção presente nos dados remotos, não só as 5 atuais
- [ ] Coleções novas `notes`, `reviews` e `prefs` criadas vazias
- [ ] Campo `conf` (sabia, dúvida, chute) aceito nas respostas, opcional
- [ ] Simulado passa a gravar `timeSec` por questão
- [ ] Electron: `userData` fixo em `%APPDATA%\Caderno R1` (e `Caderno R1 Admin` na versão admin)
- [ ] Teste de mesclagem: dado antigo + dado novo, nos dois sentidos, sem perda
- [ ] Versão instalada em todos os aparelhos antes de seguir para funções que gravam coleções novas

## 1. Sistema visual
- [ ] Tokens da paleta Índigo + ciano (claro e escuro) no `app.css`
- [ ] Manrope e Literata em `.woff2` locais (`www/fonts/`, subconjunto latino)
- [ ] Sprite SVG local com os ícones Lucide (traço 2 px, `currentColor`)
- [ ] Botões, chips, botões de filtro, controle segmentado, cartões, barras e campos com estados de hover, foco, pressionado, desabilitado, carregando e vazio
- [ ] Nome Pulse exibido (janela, `productName`, `appName`, título)
- [ ] Ícone novo: `.ico` do Windows e ícones adaptativos do Android (fundo `#4338A8`, monocromático), splash com as cores novas

## 2. Casca responsiva
- [ ] Barra inferior (< 600 px), rail (600–1199 px) e barra lateral (≥ 1200 px)
- [ ] Aba Início (vazia) e rota padrão para ela
- [ ] Atalhos globais (`Ctrl 1–5`, `?`, `Esc`) e busca `Ctrl K`
- [ ] Pílula de sincronização no pé da navegação

## 3. Resolver questão
- [ ] Layout mapa | questão | painel no PC; questão | painel no tablet; tela cheia no celular
- [ ] Sabia / Tive dúvida / Chutei
- [ ] Cronômetro por questão e "sua média"
- [ ] Anotações por questão
- [ ] Motivo do erro
- [ ] Modo foco
- [ ] Atalhos de resolução
- [ ] Selo de anulada e desatualizada

## 4. Questões
- [ ] Busca, chips rápidos ("Que não resolvi" ligado por padrão) e filtros redesenhados, sem filtro de Professor
- [ ] Cartão de resultado e resumo do filtro
- [ ] Salvar como lista inteligente

## 5. Caderno de erros e revisão espaçada
- [ ] Caderno de erros automático (filtro)
- [ ] Revisão espaçada Leitner 1-3-7-15-30 dias na coleção `reviews`

## 6. Início
- [ ] Continuar de onde parei
- [ ] Meta de hoje
- [ ] Revisões de hoje
- [ ] Ponto mais fraco com "Treinar 20 questões"
- [ ] Sequência
- [ ] Heatmap de dias estudados
- [ ] Sessão rápida de 10 questões
- [ ] Estado de primeiro uso

## 7. Listas e Simulados
- [ ] Segmento Listas | Simulados
- [ ] Progresso e acerto por lista
- [ ] Ordenar, duplicar e mover entre pastas
- [ ] Listas inteligentes
- [ ] Modo prova por instituição (predefinições publicadas pelo admin)
- [ ] Cartão-resposta
- [ ] Revisão pós-prova

## 8. Desempenho
- [ ] Evolução semanal (`multiLineChart`)
- [ ] Acerto real sem chutes
- [ ] Tempo médio
- [ ] Pontos fracos com Treinar
- [ ] Por instituição
- [ ] Heatmap
- [ ] Histórico de simulados

## 9. Configurações
- [ ] Status de sincronização detalhado
- [ ] Backup e restauração (restaurar mescla, nunca apaga)
- [ ] Meta diária e lembrete
- [ ] Tela de atalhos

## 10. Extras
- [ ] Gerar flashcard Anki (.txt; AnkiConnect no Windows)
- [ ] Lembrete diário por notificação no Android

## 11. Revisão final de acabamento
- [ ] Revisão completa da skill `make-interfaces-feel-better` em todas as telas, nos 3 formatos, claro e escuro
- [ ] Correções aplicadas
- [ ] Instaladores gerados (.exe e .apk)
