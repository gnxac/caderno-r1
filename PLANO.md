# Plano de implementação: reformulação para Pulse

Ordem aprovada na fase 1. Marque `[x]` ao concluir cada item. Decisões de visual em `DESIGN.md`, de produto em `PRODUCT.md`; plano e mockups: https://claude.ai/artifact/5UEsWEqJe55ZWP6JTiBqVA

**Toda etapa só termina quando:**
- testada no celular (390×844), no tablet (960×640) e no PC, em claro e escuro, sem erro no console;
- uma sincronização real entre dois aparelhos não perdeu nem duplicou dados;
- passou por `revisor-codigo` e `testador-navegador` antes do commit.

## 0. Fundação de dados
- [x] `mergeData` mescla qualquer coleção presente nos dados remotos, não só as 5 atuais (ignora `__proto__`, `constructor`, `prototype` e itens que não são objeto)
- [x] Coleções novas `notes`, `reviews` e `prefs` criadas vazias
- [x] Campo `conf` (sabia, dúvida, chute) aceito nas respostas, opcional
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
- [x] Atalhos globais `Ctrl 1–5` (não valem digitando nem no simulado) e `?`
- [x] Busca `Ctrl K` por texto, instituição, ano ou código R1-… (abre as questões achadas no Resolver)
- [x] Pílula de sincronização no pé da navegação (só o ponto no rail, com o texto no `title`)
- [x] Atalho `Esc` para sair do modo foco (passo 3)

## 3. Resolver questão
- [x] Layout mapa | questão | painel no PC (>= 1100 px); questão | painel no tablet (>= 860 px); só a questão no celular, com a anotação numa janela
- [x] Sabia / Tive dúvida / Chutei (campo `conf`; teclas 1, 2, 3)
- [x] Cronômetro por questão na barra e no painel, e "sua média" (teto de 600 s por resposta)
- [x] Anotações por questão (coleção `notes`, id = id da questão; a deduplicação junta as anotações)
- [x] Motivo do erro (campo `why`: não sabia, confundi conceito, li errado)
- [x] Modo foco (botão e tecla `F`; `Esc` sai)
- [x] Atalhos: `A–E`, `Shift A–E` (descartar), `1–3`, `Enter`, `← →`, `N`, `L`, `F`
- [x] Selo de anulada e desatualizada (já existia; o filtro que as esconde entra no passo 4)
- [ ] Atalho `H` (marca-texto na cor atual): o marca-texto continua pela barra que aparece ao selecionar o texto
- [ ] Anotações de uma questão removida como repetida em outro aparelho (a remapeação remota de `notes` não existe; a local sim)

## 4. Questões
- [x] Busca por texto ou código e atalhos de situação (Que não resolvi, Errei, Chutei ou dúvida); "Que não resolvi" ligado por padrão; sem filtro de Professor
- [x] Botões de filtro (Assunto, Instituição, Ano, Região, Finalidade, Banca) e Filtros avançados, como antes, com o campo novo "só chutes e dúvidas"
- [x] Cartão de resultado (contagem, filtros aplicados, Resolver, Criar lista, Lista inteligente, Simulado) e resumo "Neste filtro"; botão Resolver fixo no celular (a prévia das questões no PC foi retirada a pedido)
- [x] Salvar como lista inteligente (guarda o filtro; atualiza ao abrir Listas ou a lista; selo "Inteligente")
- [x] Atalho "Caderno de erros" (passo 5)
- [ ] Lista inteligente: o ponto de "continuar" é um índice e pode pular questões quando a lista encolhe; a lista só recalcula ao abrir Listas, então dois aparelhos podem disputar o mesmo registro até sincronizar

## 5. Caderno de erros e revisão espaçada
- [x] Caderno de erros automático: atalho em Questões (filtro: última resposta errada ou acerto marcado como chute); sai quando você acerta sem chute
- [x] Revisão espaçada Leitner 1-3-7-15-30 dias na coleção `reviews` (errou: volta em 1 dia; acertou uma revisão vencida: sobe uma caixa e, depois da última, sai; acerto no chute: repete em 3 dias; acertar antes de vencer não sobe a caixa). Vale para respostas do banco, das listas e dos simulados
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
- [ ] Sequência quando hoje está vazio e ontem tem resposta, e meta com 1 questão restante: lógica revisada, sem teste no navegador
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
- [ ] Teste do toque real (tap) em tablet com toque nas telas novas

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
