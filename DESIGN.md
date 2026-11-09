---
name: Caderno R1
description: Banco de questões de residência médica com ferramentas de estudo à mão, em azul-marinho de jaleco sobre papel limpo.
colors:
  navy: "#1F3A4D"
  accent: "#2F6F8F"
  accent-soft: "#D5E4EC"
  paper: "#F1F5F7"
  surface: "#FFFFFF"
  sunk: "#E3EDF2"
  ink: "#1D2B33"
  ink-2: "#3F525E"
  ink-3: "#587080"
  line: "#CFD8DC"
  line-2: "#B4C2CA"
  ok: "#1F7A4D"
  ok-soft: "#E1F3E8"
  err: "#B3261E"
  err-soft: "#FBE7E5"
  warn: "#8A5A00"
  warn-soft: "#FFF2D6"
  focus: "#B45309"
  dark-paper: "#0A0A0A"
  dark-rail: "#111111"
  dark-surface: "#161616"
  dark-sunk: "#1E1E1E"
  dark-line: "#2A2A2A"
  dark-line-2: "#3A3A3A"
  dark-ink: "#EDEDED"
  dark-ink-2: "#A8A8A8"
  dark-ink-3: "#8A8A8A"
  dark-accent: "#6FB1D1"
  dark-accent-soft: "#1E3644"
typography:
  display:
    fontFamily: "Segoe UI Variable Text, Segoe UI, Roboto, Noto Sans, system-ui, sans-serif"
    fontSize: "1.7rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Segoe UI Variable Text, Segoe UI, Roboto, Noto Sans, system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Segoe UI Variable Text, Segoe UI, Roboto, Noto Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  question:
    fontFamily: "Sitka Text, Charter, Bitstream Charter, Noto Serif, Cambria, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Segoe UI Variable Text, Segoe UI, Roboto, Noto Sans, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 600
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  pill: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "28px"
components:
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "38px"
    padding: "0 14px"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    height: "38px"
  button-action:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    height: "52px"
  filter-button:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.navy}"
    rounded: "{rounded.lg}"
    height: "54px"
    padding: "0 16px"
  chip:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.navy}"
    rounded: "{rounded.lg}"
  question-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "22px 26px 24px"
  alternative:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "10px 8px 10px 12px"
  input:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    height: "38px"
---

# Design System: Caderno R1

## Overview

**Creative North Star: "O Caderno Anotado"**

O app é uma superfície de estudo que guarda a mão do estudante: marca-texto em cinco cores claras, alternativas riscadas com a tesoura, listas e simulados montados por ele. A interface fica quieta para que essas marcas sejam a única cor expressiva da página. O azul-marinho de jaleco dá identidade e seriedade clínica; o resto é papel limpo, texto legível e bordas finas.

A densidade é de ferramenta de uso longo: o enunciado da questão é lido em serifa, como texto impresso, e todo o resto (navegação, filtros, números) em sans de sistema. Nada pisca nem decora. Cantos suaves, sem sombras de repouso, e pílulas só onde há ação principal ou chip de filtro.

**Key Characteristics:**
- Azul-marinho (#1F3A4D) como identidade, azul-petróleo (#2F6F8F) como ação; azul só em destaques, nunca em fundos grandes.
- Enunciado em serifa; interface em sans.
- Modo escuro neutro (preto/cinza sem tom azul); o azul claro (#6FB1D1) vira o destaque.
- Verde e vermelho só para acerto e erro; marca-texto e tesoura são cores do usuário, não da marca.
- Alvos de toque de 44px no celular; uso com uma mão.

## Colors

Paleta contida: neutros frios de papel, um azul de marca e semânticos de acerto/erro. No escuro os fundos viram preto/cinza puros.

### Primary
- **Azul-marinho de jaleco** (#1F3A4D): títulos, ícone do app, textos sobre azul claro (`--navy`, `--on-soft`).
- **Azul-petróleo clínico** (#2F6F8F): botão principal, link, item ativo. No escuro, #6FB1D1.
- **Névoa azul** (#D5E4EC): fundo de chips, botões de filtro, item ativo da navegação e alternativa selecionada. No escuro, #1E3644.

### Neutral
- **Papel frio** (#F1F5F7): fundo da página. Escuro: #0A0A0A.
- **Superfície** (#FFFFFF): cartões, painéis, modais, campos, barra lateral. Escuro: #161616 (barra lateral #111111).
- **Afundado** (#E3EDF2): campos aninhados, tópicos, histórico, trilho de barras. Escuro: #1E1E1E (alternativas também).
- **Tinta** (#1D2B33), **tinta 2** (#3F525E), **tinta 3** (#587080): texto principal, secundário e terciário. Escuro: #EDEDED, #A8A8A8, #8A8A8A (todos ≥ 4,5:1).
- **Linha** (#CFD8DC) e **linha forte** (#B4C2CA): bordas fracas e fortes. Escuro: #2A2A2A e #3A3A3A.

### Semânticas
- **Acerto** (#1F7A4D) e **erro** (#B3261E), cada um com fundo suave (#E1F3E8, #FBE7E5); **aviso** (#8A5A00) com #FFF2D6; **foco** (#B45309), anel de 2px.

### Named Rules
**The Quiet Paper Rule.** Nenhum fundo grande é azul. O azul vive em botões, chips, item ativo e selos; o resto é papel ou, no escuro, preto/cinza neutro.
**The User's Ink Rule.** As cores do marca-texto e da tesoura são do estudante e nunca entram como cor de marca nem de estado.

## Typography

**Interface Font:** Segoe UI Variable Text (Segoe UI, Roboto, Noto Sans, system-ui, sans-serif)
**Question Font:** Sitka Text (Charter, Noto Serif, Cambria, Georgia, serif)

**Character:** sans do sistema para tudo que é ferramenta; serifa só no texto que se lê e se marca (enunciado, alternativas, comentário). O tamanho da letra da questão é ajustável pelo usuário (`--font-scale`).

### Hierarchy
- **Display** (600, 1.6–1.7rem, 1.25): título de página e contador de questões.
- **Headline** (600, 1.15rem, 1.25): títulos de seção e cartões.
- **Title** (600, 1rem): subtítulos e grupos (`h3`).
- **Body** (400, 15px, 1.5): interface geral. Texto longo da questão em serifa 1rem × escala, linha 1.5.
- **Label** (600, 0.85rem): rótulos de campo e selos; números sempre com `tabular-nums`.

### Named Rules
**The Printed Question Rule.** O que o estudante lê para responder (enunciado, alternativas, comentário) é serifa; toda a interface ao redor é sans.

## Layout

Casca de duas colunas no computador: barra lateral de 232px e conteúdo com 28px/36px de respiro; no celular (≤ 860px) a barra lateral vira barra inferior e o conteúdo usa 16px de lateral, com folga para a área segura (`env(safe-area-inset-*)`). Cartão da questão limitado a 820px.

Telas de operação usam grades simples: filtros em coluna à esquerda (≈500px) e painel de filtros aplicados à direita no computador; coluna única no celular. Desempenho usa painel lateral de filtros (240px) e grade de 12 colunas para os gráficos. Espaçamento em múltiplos de 4–8px; alvos de toque de pelo menos 44px no celular.

## Elevation & Depth

Sistema plano e em camadas tonais: papel → superfície → afundado. Cartões e painéis se separam por borda fina (1px), não por sombra. Sombra existe só em camadas flutuantes.

### Shadow Vocabulary
- **Modal** (`box-shadow: 0 18px 50px rgba(0,0,0,.25)`): janelas de diálogo.
- **Menu** (`box-shadow: 0 10px 30px rgba(0,0,0,.18)`): menus e popovers.
- **Painel de filtro** (`box-shadow: -10px 0 40px rgba(0,0,0,.22)`): página lateral de filtros.

### Named Rules
**The Flat-At-Rest Rule.** Superfícies em repouso não têm sombra; só o que flutua sobre a página (modal, menu, página de filtro, barra de marca-texto) a ganha.

## Shapes

Cantos suaves e consistentes: 6px em botões, campos e navegação, 8px em cartões e alternativas, 12px em botões de filtro e cartões de desempenho, pílula (999px) para a ação principal grande, chips de navegação e selos. Bordas de 1px. Letras das alternativas em círculo.

## Components

### Buttons
- **Shape:** cantos de 6px, altura de 38px (44px no celular).
- **Padrão:** fundo de superfície, borda forte, texto tinta; hover escurece a borda.
- **Primary:** azul-petróleo com texto branco; hover clareia.
- **Ghost:** sem borda nem fundo; hover afunda.
- **Danger:** texto e borda de erro; hover com fundo suave de erro.
- **Ação grande (`.big`):** pílula de 52px de altura e largura total, para Confirmar e ações principais.
- **Foco:** anel de 2px na cor de foco.

### Filter buttons
Botões de filtro da tela Questões: 54px de altura, cantos de 12px, fundo névoa azul (no escuro #1A1A1A com borda #2A2A2A), círculo "+" à esquerda e selo "+N" à direita. "Filtros avançados" é preenchido de azul.

### Chips
Cantos de 16px, fundo névoa azul, texto marinho. Cada chip tem dois alvos: o texto (abre o filtro) e o × (remove só ele), ambos com 44px de altura no celular.

### Cards / Containers
- **Cartão da questão:** superfície, borda fina, cantos de 8px, padding 22px 26px, máx. 820px.
- **Painéis e cartões de configuração:** superfície, borda de 1px, cantos de 8px, padding 18px.
- **Cartões de desempenho:** fundo névoa azul, cantos de 12px, ícone em círculo.

### Alternatives
Cantos de 8px, borda forte, letra em círculo de 30px. Selecionada: fundo névoa azul. No escuro, não selecionada em #1E1E1E. Tesoura à direita risca a alternativa.

### Inputs / Fields
Altura de 38px, cantos de 6px, borda forte, fundo de superfície; foco troca a borda por anel de 2px na cor de foco. Busca em pílula na barra do filtro.

### Navigation
Barra lateral de 232px com itens de 6px de raio; ativo em névoa azul com texto marinho e peso 600. No celular, barra inferior com ícone sobre rótulo e itens de 52px de altura.

### Marca-texto e tesoura (signature)
Barra flutuante em pílula com cinco cores claras (vermelho, amarelo, azul, verde, rosa) e borracha; o texto marcado fica em `mark.hl` com texto tinta escuro fixo para manter contraste nos dois temas. A tesoura risca a alternativa sem alterar a resposta.

## Do's and Don'ts

### Do:
- **Do** manter fundos em papel/superfície (ou preto/cinza neutro no escuro) e usar o azul só em ação, estado ativo, chips e selos.
- **Do** compor enunciado, alternativas e comentário em serifa; o resto da interface em sans.
- **Do** separar camadas por borda de 1px e tom, e reservar sombra para o que flutua.
- **Do** garantir 44px de alvo de toque no celular e contraste ≥ 4,5:1 em claro e escuro.
- **Do** usar verde e vermelho só para acerto e erro; manter a área segura (`safe-area-inset`) no topo e na base do celular.

### Don't:
- **Don't** pintar fundos grandes de azul nem usar azul-marinho como fundo no escuro.
- **Don't** usar as cores do marca-texto ou da tesoura como cor de marca ou de estado.
- **Don't** adicionar sombras de repouso, gradientes decorativos ou animações que não sinalizem estado.
- **Don't** usar pílula em botões comuns; pílula é só para a ação principal grande, chips e selos.
- **Don't** reduzir o texto da questão abaixo da escala escolhida pelo usuário.
