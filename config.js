// Configuração do Firebase.
// Enquanto "firebase" estiver como null, o aplicativo roda em modo de demonstração:
// os dados ficam só neste aparelho e não aparecem no outro celular.
// "emails" diz qual conta do Google é de quem. Só essas duas contas entram no aplicativo.
window.VERDAO_CONFIG = {
  firebase: {
    apiKey: "AIzaSyCAzENueBo-5QKHZM6ss8-6Jn24KMrLcEI",
    authDomain: "tabela-sep.firebaseapp.com",
    projectId: "tabela-sep",
    storageBucket: "tabela-sep.firebasestorage.app",
    messagingSenderId: "343498996313",
    appId: "1:343498996313:web:2648d2a47a10f2f2d90f48"
  },
  emails: { pai: "bmazucatto@gmail.com", filho: "" }
};
