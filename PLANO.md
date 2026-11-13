# Plano de implementação: reformulação para Pulse

Ordem aprovada na fase 1. Marque `[x]` ao concluir cada item. Decisões de visual em `DESIGN.md`, de produto em `PRODUCT.md`; plano e mockups: https://claude.ai/artifact/5UEsWEqJe55ZWP6JTiBqVA

**Toda etapa só termina quando:**
- testada no celular (390×844), no tablet (960×640) e no PC, em claro e escuro, sem erro no console;
- uma sincronização real entre dois aparelhos não perdeu nem duplicou dados;
- passou por `revisor-codigo` e `testador-navegador` antes do commit.

## 0. Fundação de dados
- [x] `mergeData` mescla qualquer coleção presente nos dados remotos, não só as 5 atuais (ignora `__proto__`, `constructor`, `prototype` e itens que não são objeto)
- [x] Coleções novas `notes`, `reviews` e `prefs` criadas vazias
- [x] Campo `conf` nas respostas (recurso removido depois; respostas antigas que o tenham são ignoradas)
- [x] Simulado passa a gravar `timeSec` por questão (`run.times`; para de contar ao sair do simulado)
- [x] Electron: `userData` fixo em `%APPDATA%\Caderno R1` (e `Caderno R1 Admin` na versão admin)
- [x] Teste de mesclagem: dado antigo + dado novo, nos dois sentidos, sem perda (`node tests/mesclagem.test.js`)
- [ ] Sincronização real entre dois aparelhos com a versão 1.3.0
- [ ] Versão 1.3.0 instalada em todos os aparelhos antes de seguir para funções que gravam coleções novas
- Ao implementar anotações e revisões: remapear `notes` e `reviews` em `dedupe.js` (como já é feito com `runs.times`)

## 1. Sistema visual
- [x] Tokens da paleta Índigo + ciano (claro e escuro) no `app.css`
- [x] Manrope e Literata em `.woff2` locais (`www/fonts/`, subconjunto latino, licenças OFL junto)
- [x] Ícones Lucide (traço 2 px, `currentColor`) no mapa `ICONS` de `util.js`
- [x] Botões, chips, botões de filtro, controle segmentado, cartões, barras e campos com hover, foco, pressionado (`scale .96`) e desabilitado; alvos de 40 px no PC e 44 px no toque
- [ ] Estados de carregando (esqueleto) e vazio redesenhados: entram junto com cada tela nos passos seguintes
- [x] Nome Pulse exibido (janela, `productName`, `appName`, título, instaladores `Pulse-*`)
- [x] Ícone novo: `.ico`/PNG do Windows, ícones adaptativos e splash do Android, cores no workflow
- [ ] Conferir ícone e splash no .apk gerado pelo workflow

## 2. Casca responsiva
- [x] Barra inferior (< 600 px), rail de 76 px (600–1199 px) e barra lateral de 220 px (≥ 1200 px); em Resolver o PC recolhe para o rail
- [x] Aba Início (esqueleto; o painel real é o passo 6) e rota padrão `#/inicio`
- [x] Atalhos globais `Ctrl 1–6` (não valem digitando nem no simulado) e `?`
- [x] Busca `Ctrl K` por texto, instituição, ano ou código R1-… (abre as questões achadas no Resolver)
- [x] Pílula de sincronização no pé da navegação (só o ponto no rail, com o texto no `title`)
- [x] Atalho `Esc` para sair do modo foco (passo 3)

## 3. Resolver questão
- [x] Layout mapa | questão | painel no PC (>= 1100 px); questão | painel no tablet (>= 860 px); só a questão no celular, com a anotação numa janela
- [x] ~~Sabia / Tive dúvida / Chutei~~ (removido a pedido)
- [x] Cronômetro por questão na barra e no painel, e "sua média" (teto de 600 s por resposta)
- [x] Anotações por questão (coleção `notes`, id = id da questão; a deduplicação junta as anotações)
- [x] ~~Motivo do erro~~ (removido a pedido)
- [x] Modo foco (botão e tecla `F`; `Esc` sai)
- [x] Atalhos: `A–E`, `Shift A–E` (descartar), `Enter`, `← →`, `N`, `L`, `F`
- [x] Selo de anulada e desatualizada (já existia; o filtro que as esconde entra no passo 4)
- [ ] Atalho `H` (marca-texto na cor atual): o marca-texto continua pela barra que aparece ao selecionar o texto
- [ ] Anotações de uma questão removida como repetida em outro aparelho (a remapeação remota de `notes` não existe; a local sim)

## 4. Questões
- [x] Busca por texto ou código e atalhos de situação (Que não resolvi, Errei, Caderno de erros, Revisão de hoje); "Que não resolvi" ligado por padrão; sem filtro de Professor
- [x] Botões de filtro (Assunto, Instituição, Ano, Região, Finalidade, Banca) e Filtros avançados, como antes
- [x] Cartão de resultado (contagem, filtros aplicados, Resolver, Criar lista, Lista inteligente, Simulado) e resumo "Neste filtro"; botão Resolver fixo no celular (a prévia das questões no PC foi retirada a pedido)
- [x] Salvar como lista inteligente (guarda o filtro; atualiza ao abrir Listas ou a lista; selo "Inteligente")
- [x] Atalho "Caderno de erros" (passo 5)
- [ ] Lista inteligente: o ponto de "continuar" é um índice e pode pular questões quando a lista encolhe; a lista só recalcula ao abrir Listas, então dois aparelhos podem disputar o mesmo registro até sincronizar

## 5. Caderno de erros e revisão espaçada
- [x] Caderno de erros automático: atalho em Questões (filtro: última resposta errada); sai quando você acerta
- [x] Revisão espaçada Leitner 1-3-7-15-30 dias na coleção `reviews` (errou: volta em 1 dia; acertou uma revisão vencida: sobe uma caixa e, depois da última, sai; acertar antes de vencer não sobe a caixa). Vale para respostas do banco, das listas e dos simulados
- [x] Atalho "Revisão de hoje" (com contador das vencidas e atrasadas) e linha "Revisão: volta …" no Resolver
- [x] Teste da regra: `node tests/revisao.test.js`
- [ ] Montar a revisão com os erros antigos (quem já tem histórico começa com a revisão vazia; o Caderno de erros já mostra esses erros)
- [ ] Atalho "Caderno de erros" fixo no topo de Listas (entra no passo 7)

## 6. Início
- [x] Continuar de onde parei (simulado em andamento, lista ou sessão do banco; guardado só neste aparelho)
- [x] Meta de hoje (anel; meta na coleção `prefs`, sincroniza entre aparelhos; "Mudar meta")
- [x] Revisões de hoje (com as atrasadas e "Revisar agora")
- [x] Ponto mais fraco em 30 dias (mínimo de 15 respostas) com "Treinar 20 questões"
- [x] Sequência de dias e bolinhas da semana
- [x] Mapa de dias estudados (20, 18 ou 33 semanas, conforme o formato)
- [x] Sessão rápida de 10 questões (revisões, ponto fraco e não resolvidas)
- [x] Estado de primeiro uso; no tablet e no PC também "Acerto por grande área" e "Simulados recentes"
- [x] Sequência com hoje vazio e ontem com resposta, e meta com 1 questão restante: testados no navegador
- [ ] A meta de hoje mostra "Meta batida!" no mesmo cartão; falta decidir se a sequência e a meta destacam a conquista com mais ênfase (ciano hoje só no número, nas bolinhas e no anel cheio)

## 7. Listas e Simulados
- [x] Segmento Listas | Simulados; cartões com progresso (barra de certas e erradas, % feito, % acerto) e botão Continuar
- [x] Caderno de erros fixo no topo de Listas (automático); pasta virtual "Inteligentes"
- [x] Pastas em coluna (PC) ou chips (tablet e celular), ordenar (recentes, nome, progresso, acerto), duplicar, mover, renomear, excluir, recomeçar
- [x] PC em 3 colunas (pastas | cartões | detalhe com "Continuar da N", Refazer erradas, Criar simulado e acerto por tema)
- [x] Modo prova por instituição e ano: provas montadas a partir do banco (mínimo de 10 questões), na ordem do banco, com minutos por questão editáveis
- [x] Simulado sem navegação do app, com botão Sair, atalhos `M` (marcar), `Shift C` (cartão) e `Ctrl Enter` (finalizar); cartão-resposta com letra marcada, em branco, marcadas e "próxima em branco"; barra fixa no celular
- [x] Revisão pós-prova: nota, acerto por área, cartão de tempo (total, média e as 5 mais demoradas), grade clicável, "Revisar só as erradas" e criar lista com os erros
- [ ] Predefinições de prova editadas e publicadas pelo administrador (hoje as provas saem do banco sem edição; publicar junto com o banco mexe no fluxo de publicação, ainda não testado com o Google real)
- [ ] `provaPresets()` varre o banco a cada abertura de Listas; criar cache se o banco passar de alguns milhares de questões
- [x] Teste do toque real (tap) em tablet com toque nas telas novas

## 7b. Aba Anotações (pedido posterior)
- [x] Aba Anotações na navegação (Ctrl 4; Desempenho passa a Ctrl 5 e Configurações a Ctrl 6)
- [x] Cartões com todas as anotações, filtro por assunto (hierarquia), busca, abrir questão, editar e excluir

## 8. Desempenho
- [x] Período e origem no topo; 4 números (questões, acerto, tempo médio, dias estudados)
- [x] Evolução (linha, por dia, 2 dias ou semana conforme o período)
- [x] Pontos fracos: temas com pior acerto (mínimo de 5 respostas) e "Treinar 20"
- [x] Acerto por grande área com detalhamento até o subtema; por instituição
- [x] Mapa de dias estudados (26 semanas) e histórico de simulados do período
- [x] "Onde focar" (bolhas e tabela) mantido numa seção recolhível; lista/simulado com as erradas; excluir histórico
- [x] ~~Acerto real sem chutes~~ (removido junto com o recurso de chute)
- [x] Comparação com o período anterior em Questões, Acerto e Tempo médio (verde melhorou, vermelho piorou; some em "todo o histórico")
- [x] Tooltips das barras, do mapa e do gráfico e a mensagem de "sem tema elegível", testados no navegador com mouse
- [x] Tooltips por toque no celular (hoje só reagem ao mouse)

## 9. Configurações
- [x] Índice de seções (coluna no PC, chips no tablet e celular) e as seções: Conta e sincronização, Aparência, Estudo, Dados e backup, Atalhos, Administrador, Sobre
- [x] Aparência: tema e tamanho do enunciado com prévia ao vivo (80% a 160%)
- [x] Estudo: meta diária e filtro padrão em Questões ("Que não resolvi" ou "Todas")
- [x] Dados e backup: exportar backup completo, restaurar (mescla; não apaga o que é mais novo que o arquivo), exportar respostas em CSV (separador ponto e vírgula, para o Excel em português); a mesma ação também na tela de cadastro do administrador
- [x] Tela de atalhos e "Sobre" com a versão (`tests/versao.test.js` confere com o package.json)
- [ ] Status de sincronização detalhado (alterações pendentes, erro legível) — adiado a pedido, junto com o teste de sincronização entre dois aparelhos
- [ ] Lembrete diário (entra com os extras, só no Android)

## 10. Extras
- [x] Flashcard Anki: feito e depois removido a pedido do usuário
- [x] Lembrete diário por notificação no Android (plugin `@capacitor/local-notifications`; liga e escolhe o horário em Configurações; reagenda ao abrir o app e ao mudar a meta). Testado no navegador com o plugin simulado
- [ ] Lembrete testado em um aparelho Android de verdade (permissão de notificações, ícone da notificação, horário); só dá para confirmar com o .apk gerado pelo workflow
- [ ] Imagens das questões não vão nos flashcards

## 11. Revisão final de acabamento
- [x] Revisão completa da skill `make-interfaces-feel-better` em todas as telas, nos 3 formatos, claro e escuro (nenhum achado grave)
- [x] Correções aplicadas: alvos de toque (40 px no PC, 44 px no toque), hover e pressionado em linhas e células, foco visível no menu e nas bolhas, `text-wrap` e números tabulares, entrada suave de janelas, hover por cor em cartões largos, cantos concêntricos, contorno da imagem ampliada
- [x] Versão 1.6.0 e instalador Admin gerado
- [ ] Estado de carregamento (esqueleto): descartado de propósito, os dados vêm do aparelho e aparecem em menos de 1 s
- [ ] Ícones fora da grade 16/18/20 (12, 14, 15, 17 px) e traço de espessura visual variável: adiado, risco de regressão visual
- [ ] Movimento a 10% da velocidade e a tela de Resultado do simulado só foram inspecionados pelo CSS
- [ ] .apk gerado pelo workflow, com ícone, splash e lembrete conferidos em um aparelho Android
- [ ] Teste de sincronização entre dois aparelhos (passo 0), adiado a pedido
