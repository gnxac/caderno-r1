# Caderno R1

App de banco de questões para residência médica: resolver questões, listas, simulados cronometrados, marca-texto e desempenho. JS puro, sem build, tudo no objeto global `MQ`. Roda no Windows (Electron), no Android (Capacitor 7) e no navegador. Dados no IndexedDB, sincronizados pela conta Google (pasta oculta do Drive).

## Estrutura
- `www/` — o app: `index.html`, `css/app.css`, `js/` (um arquivo por tela: `bank`, `solve`, `lists`, `sim`, `perf`, `settings`, `editor`; `db.js` dados e mesclagem; `sync.js` Drive e banco publicado; `config.js` credenciais, admin e `bankManifestId`).
- `electron/` — janela do Windows e requisições ao Google (lista de hosts permitidos em `main.js`).
- `.github/workflows/gerar-instaladores.yml` — gera .exe e .apk.
- `.claude/agents/` — subagentes do projeto.

## Testar
`cd www && python -m http.server 8765` e abrir `http://localhost:8765`. Conferir console sem erros, celular (390x844) e PC, claro e escuro, alvos de toque >= 44px.

## Regras
- Administrador: `guilhermeacnx@gmail.com` (`adminEmails` em `config.js`); só ele cadastra e publica questões.
- IDs de questões nunca mudam. Questão removida vira `deleted: true` (lápide), nunca some, para não quebrar histórico, listas e simulados.
- Banco publicado: manifesto com versão + arquivo do banco, públicos no Drive do admin; o app só baixa quando a versão muda (`MQ.local.bank`). O aparelho do admin não baixa o próprio banco.
- Não publicar questões do Estratégia (nem de outros cursos). Por padrão só provas oficiais (INEP/Ebserh); questões de cursos ficam só no Drive do admin.
- Versão Windows Admin: `npm run dist:win:admin` gera `Pulse-Admin-<versão>.exe` (`electron-builder.admin.json`; painel de administrador sempre ligado e dados em `%APPDATA%\Caderno R1 Admin`, separados do app comum). É nela que se importa e se publica o banco; os outros apps só baixam, com `bankManifestId` no `config.js`.
- Antes de commitar: `revisor-codigo` e `testador-navegador`.

## Janelas e terminal (não atrapalhar o uso do PC)
- Não abra janelas novas: nada de `start`, `cmd /c start`, `explorer` ou abrir o navegador, a menos que eu peça. Para testar no navegador, use o `testador-navegador` (sem abrir o meu navegador).
- Não abra o app (Electron) nem o emulador Android para testar sem me avisar antes; prefira testes que rodam no terminal.
- Rode builds, servidores (ex.: `python -m http.server`) e comandos longos no mesmo terminal, em segundo plano, sem abrir console novo.
- Quando precisar iniciar um processo separado, use `Start-Process -WindowStyle Hidden` (ou `-NoNewWindow`) no PowerShell, para nenhum console aparecer na minha tela.

## Subagentes
`revisor-codigo`, `testador-navegador`, `git-publicador` (commit e push), `especialista-instaladores` (Electron, Gradle, workflow).

## Pendente
- Publicação do banco nunca testada com o Google real; falta colar `bankManifestId` em `config.js` após a primeira publicação e regerar os instaladores.
- O admin precisa desconectar e entrar de novo no Google (escopo novo `drive.file`).
- Imagens das questões não são publicadas com o banco.
- Desempenho antigo restaurado: sumiram as subtelas novas e o "simulado de revisão"; `multiLineChart` em `charts.js` está sem uso.
- Mudanças antigas sem commit: `package.json`, `LEIA-ME.md`, workflow; `package-lock.json` não rastreado.
