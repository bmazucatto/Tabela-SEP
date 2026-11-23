// Camada de dados: Firebase (sincroniza os celulares) ou modo de demonstração (só neste aparelho).
const FB = "https://www.gstatic.com/firebasejs/10.12.2/";

export async function criarStore(cfg) {
  if (cfg && cfg.firebase) return firebaseStore(cfg);
  return localStore();
}

function localStore() {
  const KEY = "verdao-demo";
  let dados = {};
  try { dados = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { dados = {}; }
  const ouvintes = {};
  const salvar = () => { try { localStorage.setItem(KEY, JSON.stringify(dados)); } catch (e) {} };
  const avisar = col => (ouvintes[col] || []).forEach(cb => cb({ ...(dados[col] || {}) }));
  return {
    modo: "demo",
    async entrar() { return true; },
    precisaEntrar() { return false; },
    email() { return ""; },
    sair() {},
    ouvir(col, cb) { (ouvintes[col] = ouvintes[col] || []).push(cb); setTimeout(() => cb({ ...(dados[col] || {}) }), 0); },
    async gravar(col, id, doc) { (dados[col] = dados[col] || {})[id] = JSON.parse(JSON.stringify(doc)); salvar(); avisar(col); },
    async apagar(col, id) { if (dados[col]) delete dados[col][id]; salvar(); avisar(col); },
    async lerTudo(col) { return { ...(dados[col] || {}) }; }
  };
}

async function firebaseStore(cfg) {
  const app = await import(FB + "firebase-app.js");
  const auth = await import(FB + "firebase-auth.js");
  const fs = await import(FB + "firebase-firestore.js");
  const a = app.initializeApp(cfg.firebase);
  const au = auth.getAuth(a);
  const db = fs.initializeFirestore(a, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
  try { await auth.getRedirectResult(au); } catch (e) {}
  let usuario = await new Promise(ok => { const fim = auth.onAuthStateChanged(au, u => { fim(); ok(u); }); });
  return {
    modo: "firebase",
    precisaEntrar() { return !usuario; },
    email() { return usuario && usuario.email ? usuario.email.toLowerCase() : ""; },
    async entrar() {
      const prov = new auth.GoogleAuthProvider(); prov.setCustomParameters({ prompt: "select_account" });
      try { const r = await auth.signInWithPopup(au, prov); usuario = r.user; return true; }
      catch (e) {
        if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment", "auth/cancelled-popup-request"].includes(e.code)) { await auth.signInWithRedirect(au, prov); return false; }
        throw e;
      }
    },
    sair() { return auth.signOut(au); },
    ouvir(col, cb, erro) {
      fs.onSnapshot(fs.collection(db, col), s => { const o = {}; s.forEach(d => o[d.id] = d.data()); cb(o); }, e => erro && erro(e));
    },
    async gravar(col, id, doc) { await fs.setDoc(fs.doc(db, col, id), JSON.parse(JSON.stringify(doc))); },
    async apagar(col, id) { await fs.deleteDoc(fs.doc(db, col, id)); },
    async lerTudo(col) { const s = await fs.getDocs(fs.collection(db, col)); const o = {}; s.forEach(d => o[d.id] = d.data()); return o; }
  };
}
