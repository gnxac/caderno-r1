/* Caderno R1 — configuração da sincronização com o Google.
   Preencha com o ID e a chave secreta do cliente OAuth do tipo
   "TVs e dispositivos de entrada limitada" que você criar no Google Cloud
   (passo a passo no LEIA-ME). Assim o Windows e o Android já saem configurados.
   Se deixar vazio, dá para colar os dois valores na tela Sincronizar de cada aparelho. */
window.MQ_CONFIG = {
  /* SITE: ID do cliente OAuth do tipo "Aplicativo da Web" (sem chave secreta). Passo a passo no LEIA-ME. */
  googleWebClientId: '',
  /* Apps nativos (Windows/Android): cliente "TVs e dispositivos de entrada limitada". */
  googleClientId: '',
  googleClientSecret: '',
  /* Código do banco publicado (aparece na primeira vez que o administrador usa "Publicar banco para todos"). */
  bankManifestId: '',
  /* Só quem entrar em Sincronizar com uma destas contas Google vê "Cadastrar questões"
     (cadastrar, editar, importar e gerenciar). Para os demais, o banco é só para resolver. */
  adminEmails: ['guilhermeacnx@gmail.com']
};
