# Caderno R1

App de questões para residência médica, para **Windows** e **Android**, com sincronização pela sua **conta Google**.

## O que tem

- **Banco de questões** com filtros combináveis: especialidade e assunto em árvore (área › especialidade › tema › subtema), instituição, ano, UF, finalidade, banca, professor, situação (não resolvi, resolvi, acertei, errei), tipo, com/sem comentário, anuladas e desatualizadas, busca por texto ou código.
- **Resolver questões** com correção na hora, comentário, histórico de respostas, riscar alternativas, tamanho da letra, índice e atalhos de teclado (A–E, Enter, ← →).
- **Listas e pastas**: criar, mover, renomear, imprimir, recomeçar e duplicar só com erros, acertos, não respondidas ou respondidas.
- **Simulados cronometrados**: até 1.000 questões, cota por grande área, tempo por questão, mapa do simulado, marcar para revisar, resultado por área, revisão, refazer e lista com os erros. Dá para começar no PC e continuar no celular.
- **Meu desempenho**: período (7 dias a 2 anos ou datas), origem (banco, lista ou simulado), evolução, barras por matéria com detalhamento, bolhas Q1–Q4 (acerto × volume × peso no seu banco), assuntos com mais erros e botão "Treinar".
- **Cadastrar**: formulário, importação de planilha CSV, backup completo e exportação.

O app vem com 12 questões de exemplo escritas para ele. Apague em **Cadastrar → Gerenciar questões** quando quiser. Ele **não** traz questões do Estratégia MED nem de outras plataformas: são conteúdo protegido delas. Você monta seu banco cadastrando ou importando.

---

## 1. Configurar o acesso ao Google (uma vez, uns 5 minutos)

A sincronização guarda seus dados numa pasta oculta do app no seu Google Drive. O app não enxerga mais nada do seu Drive. Para isso o Google exige uma credencial que você mesmo cria (é grátis):

1. Entre em **console.cloud.google.com** com sua conta Google e crie um projeto chamado `Caderno R1`.
2. Menu **APIs e serviços → Biblioteca**, procure **Google Drive API** e clique em **Ativar**.
3. Menu **Google Auth Platform** (ou "Tela de permissão OAuth") → **Começar**:
   - Nome do app: `Caderno R1`; e-mail de suporte: o seu.
   - Público: **Externo**. Contato: o seu e-mail. Aceite os termos e crie.
4. Em **Público**, clique em **Publicar app** → confirme **Em produção**.
   Isso é importante: em "Teste", o Google desconecta o app a cada 7 dias. Como o app só usa permissões não sensíveis, não precisa de verificação.
5. Em **Clientes → Criar cliente**, escolha o tipo **TVs e dispositivos de entrada limitada**, dê um nome e crie.
6. Copie o **ID do cliente** (termina em `.apps.googleusercontent.com`) e a **Chave secreta do cliente** (começa com `GOCSPX-`).
7. Cole os dois em `www/js/config.js` **antes de gerar os instaladores**:
   ```js
   window.MQ_CONFIG = {
     googleClientId: 'SEU-ID.apps.googleusercontent.com',
     googleClientSecret: 'GOCSPX-SUA-CHAVE'
   };
   ```
   Assim o Windows e o Android já saem configurados. Se preferir não editar o arquivo, cole os mesmos dois valores na tela **Sincronizar** de cada aparelho.

> Não compartilhe a pasta do projeto com essa chave preenchida, nem deixe o repositório do GitHub público.

## 2. Gerar os instaladores

### Opção A — na nuvem do GitHub (não precisa instalar nada no PC)

1. Crie uma conta em **github.com** e um repositório novo **privado** (ex.: `caderno-r1`).
2. Na página do repositório, **Add file → Upload files** e arraste **todo o conteúdo** desta pasta (inclusive a pasta `.github`). Confirme em **Commit changes**.
3. Vá na aba **Actions → Gerar instaladores → Run workflow**.
4. Em uns 10 minutos aparecem dois arquivos em **Artifacts**, no fim da página da execução:
   - `Caderno-R1-Windows`: versão portátil `.exe` (roda sem instalar).
   - `Caderno-R1-Android`: o `Caderno-R1.apk`.

### Opção B — no seu PC com Windows

1. Instale o **Node.js LTS** (nodejs.org).
2. Abra o Prompt de Comando nesta pasta e rode:
   ```
   npm install
   npm run dist:win
   ```
   Os `.exe` ficam na pasta `dist`.
3. Para o Android, instale o **Android Studio** e rode:
   ```
   npx cap add android
   npm run android:icons
   npx cap sync android
   npx cap open android
   ```
   No Android Studio: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.

## 3. Instalar

- **Windows:** abra o instalador. Como ele não tem assinatura digital paga, o Windows pode mostrar "O Windows protegeu o computador": clique em **Mais informações → Executar assim mesmo**.
- **Android:** passe o `.apk` para o celular (Drive, WhatsApp, cabo) e abra. Permita **instalar apps desta fonte** quando pedir.

## 4. Conectar os dois aparelhos

Em cada aparelho: **Sincronizar → Entrar com o Google**. Aparece um código; abra **google.com/device** (em qualquer aparelho), entre com a **mesma conta Google** nos dois e digite o código.

A partir daí sincroniza sozinho: ao abrir o app, alguns segundos depois de cada mudança e a cada 5 minutos. Funciona offline e envia quando a internet voltar. Se o mesmo item for editado nos dois aparelhos, vale a edição mais recente.

## 5. Planilha para importar questões

Em **Cadastrar → Importar e exportar → Baixar modelo**. Uma questão por linha, colunas:

`enunciado; A; B; C; D; E; gabarito; comentario; area; especialidade; tema; subtema; instituicao; uf; ano; finalidade; banca; professor; tipo; anulada; desatualizada`

Obrigatórias: `enunciado`, pelo menos duas alternativas, `gabarito` e `area`. No Excel, salve como **CSV UTF-8**. Para certo/errado, use `tipo = certoerrado` e `gabarito = C` ou `E`.

## 6. Pacotes de questões (.json)

Listas convertidas de PDF chegam como um arquivo `.json`. Importe em **Cadastrar → Importar e exportar → Importar pacote ou backup**. As questões entram no banco com instituição, ano, assunto, gabarito e figuras, e uma lista com o mesmo nome aparece em **Listas e simulados → Importadas**. Importar o mesmo pacote de novo não duplica nada. Basta importar em um aparelho: a sincronização leva tudo, inclusive as imagens, para o outro.

## Limites desta versão

- Não existe comparação com "concorrência": o app é só seu, não tem dados de outros alunos.
- A "incidência" das bolhas usa quantas questões de cada matéria existem **no seu banco**.
- O `.apk` é de uso pessoal (assinatura de depuração); não serve para publicar na Play Store.
- Códigos `R1-00001…` criados ao mesmo tempo em dois aparelhos offline podem se repetir. Isso não afeta nada, só a numeração exibida.
