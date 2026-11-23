import { criarStore } from "./store.js";
import { SEED_JOGOS, SEED_TABELA, SEED_APLICADOS } from "./seed.js";

const COMPS = ["Brasileirão", "Libertadores", "Copa do Brasil", "Paulistão", "Intercontinental", "Amistoso"];
const CORES = { palmeiras: ["#006437", "#fff"], flamengo: ["#c8102e", "#111"], cruzeiro: ["#0033a0", "#fff"], chapecoense: ["#00843d", "#fff"],
  estudiantes: ["#d71920", "#fff"], coritiba: ["#00563f", "#fff"], gremio: ["#0d80bf", "#111"], corinthians: ["#111", "#fff"], "sao-paulo": ["#d9001b", "#fff"],
  santos: ["#111", "#fff"], fluminense: ["#7a0f2f", "#fff"], botafogo: ["#111", "#fff"], vasco: ["#111", "#fff"], internacional: ["#c8102e", "#fff"],
  bahia: ["#0b4ea2", "#fff"], "atletico-mg": ["#111", "#fff"], "athletico-pr": ["#c8102e", "#111"], bragantino: ["#e5e5e5", "#c8102e"], mirassol: ["#f5c400", "#0a6b2f"],
  vitoria: ["#c8102e", "#111"], remo: ["#0a2a6b", "#fff"] };
const QUEM = ["pai", "filho"];
const S = { jogos: {}, palp: {}, times: {}, cfg: { pai: "Pai", filho: "Filho" }, tabela: null, view: "inicio", albumDe: null, comp: "Todos", rcomp: "Todos", ok: false, store: null };
let eu = ler("verdao-eu") || "pai";
let instalar = null;

function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slug = n => String(n || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "time";
const nome = q => S.cfg[q] || (q === "pai" ? "Pai" : "Filho");
const inicio = j => new Date((j.data || "2100-01-01") + "T" + (j.hora || "00:00") + ":00-03:00");
const fechado = j => !!j.fim || Date.now() >= inicio(j).getTime();
const casa = j => j.mando !== "fora";
const temPlacar = j => j.gp != null && j.ga != null;
const lista = () => Object.values(S.jogos).sort((a, b) => inicio(a) - inicio(b));
function fmt(j, curto) {
  const d = inicio(j);
  const dia = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: curto ? "2-digit" : "short", timeZone: "America/Sao_Paulo" }).replace(".", "");
  return dia + (j.hora ? " · " + j.hora : " · horário a definir");
}
function falta(j) {
  const ms = inicio(j) - Date.now(); if (ms <= 0) return "";
  const h = Math.floor(ms / 36e5), d = Math.floor(h / 24);
  if (d >= 2) return `faltam ${d} dias`; if (d === 1) return "é amanhã"; if (h >= 1) return `faltam ${h}h`; return "começa já já";
}
function crest(n, cls = "") {
  const s = slug(n), t = S.times[s];
  if (t && t.img && /^data:image\//.test(t.img)) return `<span class="crest has ${cls}"><img alt="" src="${esc(t.img)}"></span>`;
  const c = CORES[s] || ["#6b7a72", "#fff"];
  const ini = String(n || "?").split(/[\s-]+/).filter(Boolean).map(w => w[0]).join("").slice(0, 3).toUpperCase();
  return `<span class="crest ${cls}" style="background:${c[0]};color:${c[1]}">${esc(ini)}</span>`;
}
const lados = j => { const a = { n: "Palmeiras", g: j.gp }, b = { n: j.adv, g: j.ga }; return casa(j) ? [a, b] : [b, a]; };
const resultado = j => !temPlacar(j) ? null : j.gp > j.ga ? "V" : j.gp < j.ga ? "D" : "E";
const corRes = r => r === "V" ? "var(--g2)" : r === "D" ? "var(--red)" : "#c99a00";
function mesmoNome(a, b) { const x = slug(a), y = slug(b); if (!x || !y || x === "time" || y === "time") return false; return x === y || (x.length >= 4 && y.includes(x)) || (y.length >= 4 && x.includes(y)); }

/* ---------- pontuação do bolão ---------- */
function pontos(j, p) {
  if (!j.fim || !p || p.gp == null || !temPlacar(j)) return null;
  let pt = 0, exato = false, art = false;
  if (p.gp === j.gp && p.ga === j.ga) { pt = 3; exato = true; }
  else if (Math.sign(p.gp - p.ga) === Math.sign(j.gp - j.ga)) pt = 1;
  if (p.autor && (j.gols || []).some(g => g.lado === "pal" && !g.contra && mesmoNome(g.autor, p.autor))) { pt += 2; art = true; }
  return { pt, exato, art };
}
function resumoBolao(comp) {
  const r = {}; QUEM.forEach(q => r[q] = { tot: 0, exatos: 0, art: 0, palp: 0, seq: 0, melhorSeq: 0, final: false, jogos: [] });
  for (const j of lista()) {
    if (comp !== "Todos" && j.comp !== comp) continue;
    for (const q of QUEM) {
      const p = S.palp[j.id + "_" + q]; if (p && p.gp != null) r[q].palp++;
      const x = pontos(j, p); if (!x) { if (j.fim) r[q].seq = 0; continue; }
      const o = r[q]; o.tot += x.pt; if (x.exato) o.exatos++; if (x.art) o.art++;
      if (x.pt > 0) { o.seq++; o.melhorSeq = Math.max(o.melhorSeq, o.seq); if (/final/i.test(j.fase || "")) o.final = true; } else o.seq = 0;
    }
  }
  return r;
}
const CONQ = [
  ["1", "Na mosca", "Acertou um placar exato", o => o.exatos >= 1],
  ["3", "Vidente", "Três placares exatos", o => o.exatos >= 3],
  ["S", "Embalado", "Pontuou três jogos seguidos", o => o.melhorSeq >= 3],
  ["G", "Faro de gol", "Acertou quem marcou", o => o.art >= 1],
  ["F", "Dia de final", "Pontuou numa final", o => o.final],
  ["10", "Fiel torcedor", "Deu palpite em 10 jogos", o => o.palp >= 10]
];

/* ---------- classificação ---------- */
function ordenarTabela(l) { return [...l].sort((a, b) => (pts(b) - pts(a)) || (b.v - a.v) || ((b.gp - b.gc) - (a.gp - a.gc)) || (b.gp - a.gp) || a.t.localeCompare(b.t)); }
const pts = l => l.v * 3 + l.e;
function contribuicao(gp, ga, sinal) { // efeito de um placar para (Palmeiras, adversário)
  const r = Math.sign(gp - ga);
  return [{ j: sinal, v: r > 0 ? sinal : 0, e: r === 0 ? sinal : 0, d: r < 0 ? sinal : 0, gp: gp * sinal, gc: ga * sinal },
          { j: sinal, v: r < 0 ? sinal : 0, e: r === 0 ? sinal : 0, d: r > 0 ? sinal : 0, gp: ga * sinal, gc: gp * sinal }];
}
async function ajustarTabela(antes, depois) {
  if (!S.tabela) return depois;
  const linhas = S.tabela.linhas.map(l => ({ ...l }));
  const achar = n => linhas.find(l => mesmoNome(l.t, n));
  const aplicar = (adv, gp, ga, sinal) => {
    const pal = achar("Palmeiras"), op = achar(adv); if (!pal || !op) return false;
    const [a, b] = contribuicao(gp, ga, sinal);
    for (const k in a) { pal[k] += a[k]; op[k] += b[k]; } return true;
  };
  let mudou = false;
  if (antes && antes.apl) { mudou = aplicar(antes.adv, antes.apl.gp, antes.apl.ga, -1) || mudou; }
  delete depois.apl;
  if (depois.comp === "Brasileirão" && depois.fim && temPlacar(depois) && aplicar(depois.adv, depois.gp, depois.ga, 1)) { depois.apl = { gp: depois.gp, ga: depois.ga }; mudou = true; }
  if (mudou) await S.store.gravar("tabela", "brasileirao", { ...S.tabela, linhas, atualizado: new Date().toLocaleDateString("pt-BR") });
  return depois;
}

/* ---------- telas ---------- */
const ICON = {
  inicio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  jogos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>',
  bolao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3a3 3 0 0 1-3 4M7 5H4a3 3 0 0 0 3 4"/></svg>',
  tabela: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.5M3.5 12h.5M3.5 18h.5"/></svg>',
  craques: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><path d="m12 7 4 3-1.5 5h-5L8 10z"/></svg>'
};
const NOMES = { inicio: "Início", jogos: "Jogos", bolao: "Bolão", tabela: "Tabela", craques: "Craques" };
const ICONQ = {
  alvo: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#ff5d4e"/><circle cx="20" cy="20" r="11.5" fill="#fff"/><circle cx="20" cy="20" r="6" fill="#ff5d4e"/></svg>',
  olho: '<svg viewBox="0 0 40 40"><circle cx="20" cy="22" r="14" fill="#7b5cff"/><circle cx="15" cy="17" r="4" fill="#fff" opacity=".7"/><rect x="9" y="33" width="22" height="5" rx="2.5" fill="#3a2300"/></svg>',
  fogo: '<svg viewBox="0 0 40 40"><path d="M20 3c2 7 11 11 11 21a11 11 0 0 1-22 0c0-6 4-9 5-13 2 3 2 5 4 6 1-5 0-10 2-14z" fill="#ff7a2e"/><path d="M20 20c1 3 5 5 5 9a5 5 0 0 1-10 0c0-3 3-5 5-9z" fill="#ffd24a"/></svg>',
  bola: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#fff" stroke="#0d2a1b" stroke-width="2.5"/><path d="m20 13 6 4.5-2.3 7h-7.4l-2.3-7z" fill="#0d2a1b"/></svg>',
  taca: '<svg viewBox="0 0 40 40"><path d="M11 5h18v9a9 9 0 0 1-18 0z" fill="#00753f"/><path d="M11 8H5a6 6 0 0 0 6 7M29 8h6a6 6 0 0 1-6 7" stroke="#00753f" stroke-width="3" fill="none"/><path d="M17 23h6v6h-6zM12 31h16v5H12z" fill="#00753f"/></svg>',
  coracao: '<svg viewBox="0 0 40 40"><path d="M20 35S5 26 5 15a8 8 0 0 1 15-4 8 8 0 0 1 15 4c0 11-15 20-15 20z" fill="#00753f"/><path d="M14 13h4" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/></svg>'
};
const CONQ_ICON = ["alvo", "olho", "fogo", "bola", "taca", "coracao"];
const avatar = q => `<span class="av" style="background:var(--${q})">${esc((nome(q)[0] || "?").toUpperCase())}</span>`;
function renderNav() { $("nav").innerHTML = Object.keys(NOMES).map(v => `<button class="navb ${S.view === v ? "on" : ""}" data-v="${v}">${ICON[v]}<span>${NOMES[v]}</span></button>`).join(""); }
function renderWho() { $("who").innerHTML = QUEM.map(q => `<button data-eu="${q}" class="${q === eu ? "on" : ""}" aria-label="Sou ${esc(nome(q))}">${avatar(q)}</button>`).join(""); }
const secao = (t, extra = "") => `<div class="sec"><h2>${t}</h2>${extra}</div>`;
const chips = (lst, atual, chave) => `<div class="chips">${lst.map(c => `<button data-${chave}="${esc(c)}" class="${c === atual ? "on" : ""}">${esc(c)}</button>`).join("")}</div>`;

function heroJogo(j) {
  if (!j) return `<div class="fig hero"><div class="fita">Álbum vazio</div><div class="vazio">Nenhum jogo ainda. Toque no + para colar o primeiro.</div></div>`;
  const [a, b] = lados(j);
  const aoVivo = !j.fim && Date.now() >= inicio(j).getTime();
  const fita = aoVivo ? `<div class="fita live">Ao vivo</div>` : j.fim ? `<div class="fita">Último jogo</div>` : `<div class="fita">Próximo jogo</div>`;
  const pl = temPlacar(j) ? `${a.g}<i>×</i>${b.g}` : `<span class="q">?</span><i>×</i><span class="q">?</span>`;
  const palp = q => { const p = S.palp[j.id + "_" + q];
    return p && p.gp != null ? `<div class="palp ok">${avatar(q)}<div><b>${casa(j) ? p.gp : p.ga} × ${casa(j) ? p.ga : p.gp}</b>${p.autor ? `<small>gol de ${esc(p.autor)}</small>` : `<small>${esc(nome(q))}</small>`}</div></div>`
      : `<div class="palp">${avatar(q)}<div><b>?</b><small>${esc(nome(q))} não palpitou</small></div></div>`; };
  const meu = S.palp[j.id + "_" + eu];
  const botao = aoVivo ? "Atualizar placar" : j.fim ? "Ver o jogo" : meu && meu.gp != null ? "Mudar meu palpite" : "Dar meu palpite";
  return `<div class="fig hero">${fita}
    <div class="comp">${esc(j.comp)}${j.fase ? " · " + esc(j.fase) : ""}</div>
    <div class="vs"><div class="team">${crest(a.n)}${esc(a.n)}</div><div class="placar">${pl}</div><div class="team">${crest(b.n)}${esc(b.n)}</div></div>
    <div class="info"><span class="pill">${esc(fmt(j))}</span>${j.local ? `<span class="pill">${esc(j.local)}</span>` : ""}${!aoVivo && !j.fim ? `<span class="pill hot">${falta(j)}</span>` : ""}</div>
    <div class="palps">${palp("pai")}${palp("filho")}</div>
    <button class="cta" data-abrir="${esc(j.id)}">${botao}</button></div>`;
}
function cardJogo(j) {
  const [a, b] = lados(j), r = j.fim ? resultado(j) : null;
  const p = S.palp[j.id + "_" + eu], x = pontos(j, p);
  const sub = x ? `<span class="pts">${esc(nome(eu))} +${x.pt}</span>` : !j.fim && !fechado(j) && !(p && p.gp != null) ? `<span class="falta">Falta seu palpite</span>` : "";
  return `<button class="fig card" data-abrir="${esc(j.id)}">${r ? `<span class="selo ${r}">${r === "V" ? "VITÓRIA" : r === "E" ? "EMPATE" : "DERROTA"}</span>` : ""}
    ${crest(j.adv, "m")}<span class="vs2">${esc(a.n)} × ${esc(b.n)}</span>
    <span class="sc">${temPlacar(j) ? `${a.g} × ${b.g}` : "– × –"}</span>
    <span class="dt">${esc(j.comp)}${j.fase ? " · " + esc(j.fase) : ""}<br>${esc(fmt(j, true))}</span>${sub}</button>`;
}
function dueloHtml(r) {
  const lid = r.pai.tot === r.filho.tot ? null : r.pai.tot > r.filho.tot ? "pai" : "filho";
  const lado = q => `<div class="lado">${avatar(q)}<span>${esc(nome(q))}</span>${lid === q ? `<span class="coroa">Na frente</span>` : ""}</div>`;
  return `<div class="fig duelo">${lado("pai")}<div><div style="display:flex;gap:10px;justify-content:center"><span class="n">${r.pai.tot}</span><span class="n" style="color:#c9d6cf">×</span><span class="n">${r.filho.tot}</span></div><div class="meio">${lid ? "pontos no bolão" : "empatados no bolão"}</div></div>${lado("filho")}</div>`;
}
function renderInicio() {
  const l = lista(); const prox = l.find(x => !x.fim) || l[l.length - 1];
  const ult = l.filter(j => j.fim).reverse().slice(0, 6);
  $("view").innerHTML = heroJogo(prox) +
    secao("Duelo do bolão", `<button data-v="bolao">Ver tudo</button>`) + dueloHtml(resumoBolao("Todos")) +
    (ult.length ? secao("Últimos jogos", `<button data-v="jogos">Ver todos</button>`) + `<div class="rolo">${ult.map(cardJogo).join("")}</div>` : "");
}
function renderJogos() {
  const comps = ["Todos", ...new Set(lista().map(j => j.comp))];
  const l = lista().filter(j => S.comp === "Todos" || j.comp === S.comp);
  const prox = l.filter(j => !j.fim), fim = l.filter(j => j.fim).reverse();
  const v = fim.filter(j => resultado(j) === "V").length, e = fim.filter(j => resultado(j) === "E").length, d = fim.filter(j => resultado(j) === "D").length;
  $("view").innerHTML = chips(comps, S.comp, "comp") +
    (prox.length ? secao("Próximos") + `<div class="grid">${prox.map(cardJogo).join("")}</div>` : "") +
    (fim.length ? secao("Encerrados", `<span>${v}V · ${e}E · ${d}D</span>`) + `<div class="grid">${fim.map(cardJogo).join("")}</div>` : "") +
    (!l.length ? `<div class="fig vazio" style="margin-top:16px">Nenhum jogo neste campeonato.</div>` : "");
}
function renderBolao() {
  const comps = ["Todos", ...new Set(lista().map(j => j.comp))];
  const r = resumoBolao(S.rcomp);
  const linhas = lista().filter(j => j.fim && (S.rcomp === "Todos" || j.comp === S.rcomp)).reverse();
  const pal = (j, q) => { const p = S.palp[j.id + "_" + q], x = pontos(j, p); return p && p.gp != null ? `${esc(nome(q))}: ${p.gp}×${p.ga}${p.autor ? ", " + esc(p.autor) : ""} <b style="color:var(--g)">+${x ? x.pt : 0}</b>` : `${esc(nome(q))}: sem palpite`; };
  const quemAlbum = S.albumDe || eu;
  const o = r[quemAlbum];
  const ganhas = CONQ.filter(c => c[3](o)).length;
  $("view").innerHTML = chips(comps, S.rcomp, "rcomp") + `<div style="margin-top:14px">${dueloHtml(r)}</div>
    <p class="note">Placar exato vale 3. Acertar quem vence ou o empate vale 1. Acertar quem marca pelo Verdão vale mais 2.</p>` +
    secao("Álbum de conquistas", `<span>${ganhas} de ${CONQ.length}</span>`) +
    `<div class="seg2">${QUEM.map(q => `<button data-album="${q}" class="${q === quemAlbum ? "on" : ""}">${avatar(q)}${esc(nome(q))}</button>`).join("")}</div>
    <div class="album">${CONQ.map((c, i) => c[3](o) ? `<div class="slot on">${ICONQ[CONQ_ICON[i]]}<b>${c[1]}</b><span>${c[2]}</span></div>` : `<div class="slot off"><b class="d" style="font-size:26px">${i + 1}</b><b>${c[1]}</b><span>${c[2]}</span></div>`).join("")}</div>` +
    secao("Jogo a jogo") + (linhas.length ? `<div class="fig lista">${linhas.map(j => `<div class="row">${crest(j.adv, "s")}<div class="tx"><b>Palmeiras ${j.gp} × ${j.ga} ${esc(j.adv)}</b><span class="mini">${pal(j, "pai")}</span><span class="mini">${pal(j, "filho")}</span></div></div>`).join("")}</div>`
      : `<div class="fig vazio">Os pontos aparecem quando um jogo é marcado como encerrado.</div>`);
}
function renderTabela() {
  if (!S.tabela) { $("view").innerHTML = `<div class="fig vazio" style="margin-top:16px">Carregando a classificação…</div>`; return; }
  const l = ordenarTabela(S.tabela.linhas);
  const copas = ["Libertadores", "Copa do Brasil"].map(c => [c, lista().filter(j => j.comp === c)]).filter(x => x[1].length);
  $("view").innerHTML = secao(esc(S.tabela.nome), `<span>${esc(S.tabela.atualizado)}</span>`) +
    `<div class="fig" style="overflow:hidden"><table class="tbl"><thead><tr><th>#</th><th>TIME</th><th>P</th><th>J</th><th>V</th><th>SG</th></tr></thead><tbody>
    ${l.map((x, i) => `<tr class="${slug(x.t) === "palmeiras" ? "pal" : ""}" data-linha="${esc(x.t)}"><td><span class="pos">${i + 1}</span></td><td><span class="tnome">${crest(x.t, "xs")}${esc(x.t)}</span></td><td class="p">${pts(x)}</td><td>${x.j}</td><td>${x.v}</td><td>${x.gp - x.gc > 0 ? "+" : ""}${x.gp - x.gc}</td></tr>`).join("")}
    </tbody></table></div><p class="note">Jogos do Palmeiras encerrados entram na tabela sozinhos. Toque num time para corrigir os números.</p>` +
    copas.map(([c, js]) => secao("Caminho na " + esc(c)) + `<div class="grid">${js.map(cardJogo).join("")}</div>`).join("");
}
function renderCraques() {
  const g = {}, a = {}, c = {}; let total = 0;
  for (const j of Object.values(S.jogos)) {
    for (const x of (j.gols || [])) if (x.lado === "pal") { total++; if (!x.contra) { const k = x.autor || "Sem nome"; g[k] = (g[k] || 0) + 1; } if (x.assist && !x.contra) a[x.assist] = (a[x.assist] || 0) + 1; }
    for (const x of (j.cartoes || [])) if (x.lado === "pal" && x.jogador) { const k = x.jogador; c[k] = c[k] || { am: 0, vm: 0 }; c[k][x.cor === "vermelho" ? "vm" : "am"]++; }
  }
  const ini = n => n.split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const cards = (o, un) => { const l = Object.entries(o).sort((x, y) => y[1] - x[1]);
    return l.length ? `<div class="grid">${l.map(([n, q], i) => `<div class="fig craque ${i === 0 ? "top" : ""}"><div class="foto">${esc(ini(n))}</div><b>${esc(n)}</b><span class="n">${q}</span><small>${q === 1 ? un : un + "s"}</small></div>`).join("")}</div>` : ""; };
  const cl = Object.entries(c).sort((x, y) => (y[1].vm * 2 + y[1].am) - (x[1].vm * 2 + x[1].am));
  $("view").innerHTML = secao("Artilheiros", `<span>${total} gol${total === 1 ? "" : "s"}</span>`) + (cards(g, "gol") || `<div class="fig vazio">Lance os gols nos jogos para encher o álbum de craques.</div>`) +
    secao("Garçons") + (cards(a, "assistência") || `<div class="fig vazio">Nenhuma assistência ainda. Ela entra junto com o gol.</div>`) +
    secao("Cartões") + (cl.length ? `<div class="fig lista">${cl.map(([n, v]) => `<div class="row"><div class="tx"><b>${esc(n)}</b></div>${"<span class=\"cart\" style=\"background:#ffd31a\"></span>".repeat(v.am)}${"<span class=\"cart\" style=\"background:#ff4b3e\"></span>".repeat(v.vm)}</div>`).join("")}</div>` : `<div class="fig vazio">Nenhum cartão lançado.</div>`);
}
function render() {
  renderWho(); renderNav();
  $("fab") && $("fab").remove();
  if (!S.ok) return;
  ({ inicio: renderInicio, jogos: renderJogos, bolao: renderBolao, tabela: renderTabela, craques: renderCraques })[S.view]();
  if (S.view === "jogos") document.body.insertAdjacentHTML("beforeend", `<button class="fab" id="fab" data-novo="1" aria-label="Novo jogo">+</button>`);
}

/* ---------- editor de jogo ---------- */
let ed = null, aba = "placar";
function abrir(id) {
  const j = S.jogos[id];
  ed = j ? JSON.parse(JSON.stringify(j)) : { id: "j" + Date.now().toString(36), comp: "Brasileirão", fase: "", data: new Date().toISOString().slice(0, 10), hora: "", adv: "", mando: "casa", local: "", gp: null, ga: null, gols: [], cartoes: [], fim: false, novo: true };
  ed.gols = ed.gols || []; ed.cartoes = ed.cartoes || [];
  ed._aberto = !j || !fechado(j); ed._p = {}; for (const q of QUEM) ed._p[q] = Object.assign({ gp: null, ga: null, autor: "" }, S.palp[ed.id + "_" + q] || {});
  aba = j ? (fechado(j) ? "placar" : "palpites") : "ficha";
  desenha(); $("sheet").classList.add("open");
}
function desenha() {
  const j = ed, trav = !j._aberto;
  const abas = [["placar", "Placar"], ["gols", "Lances"], ["palpites", "Palpites"], ["ficha", "Ficha"]];
  let corpo = "";
  if (aba === "placar") corpo = `
   <div class="g2" style="margin-top:12px">${[["gp", "Palmeiras"], ["ga", j.adv || "Adversário"]].map(([k, n]) => `<div class="step"><b>${esc(n)}</b><button data-pl="${k}" data-d="-1" aria-label="Tirar gol">−</button><div class="n">${j[k] ?? 0}</div><button data-pl="${k}" data-d="1" class="mais" aria-label="Somar gol">+</button></div>`).join("")}</div>
   <p class="pnote">Os botões + e − só mexem no placar. Para registrar quem fez, use “Lances”.</p>
   <label class="toggle"><input type="checkbox" data-f="fim" ${j.fim ? "checked" : ""}> Jogo encerrado (conta no bolão e na tabela)</label>
   <label>Pênaltis, se houver (Palmeiras × adversário)</label>
   <div class="g2"><input inputmode="numeric" type="number" min="0" data-f="penp" value="${esc(j.penp ?? "")}"><input inputmode="numeric" type="number" min="0" data-f="pena" value="${esc(j.pena ?? "")}"></div>`;
  if (aba === "gols") corpo = `
   <h2>Gols</h2>
   ${j.gols.map((g, i) => `<div class="item"><div class="g3"><input inputmode="numeric" placeholder="Min" data-g="${i}" data-k="min" value="${esc(g.min ?? "")}"><input placeholder="Quem fez" data-g="${i}" data-k="autor" value="${esc(g.autor || "")}"><button class="x" data-rg="${i}" aria-label="Apagar gol">✕</button></div>
     <div class="g2" style="margin-top:8px"><input placeholder="Assistência" data-g="${i}" data-k="assist" value="${esc(g.assist || "")}"><select data-g="${i}" data-k="tipo">
     <option value="pal" ${g.lado === "pal" && !g.contra ? "selected" : ""}>Gol do Verdão</option><option value="adv" ${g.lado === "adv" && !g.contra ? "selected" : ""}>Gol do adversário</option>
     <option value="contra-pal" ${g.lado === "pal" && g.contra ? "selected" : ""}>Contra, a favor do Verdão</option><option value="contra-adv" ${g.lado === "adv" && g.contra ? "selected" : ""}>Contra, a favor do adversário</option></select></div></div>`).join("") || `<p class="pnote">Nenhum gol lançado.</p>`}
   <div class="g2"><button class="cta g" data-ag="pal" style="font-size:17px">+ Gol do Verdão</button><button class="btn2" data-ag="adv" style="margin-top:12px">+ Gol do adversário</button></div>
   <h2>Cartões</h2>
   ${j.cartoes.map((c, i) => `<div class="item"><div class="g3"><input inputmode="numeric" placeholder="Min" data-c="${i}" data-k="min" value="${esc(c.min ?? "")}"><input placeholder="Jogador" data-c="${i}" data-k="jogador" value="${esc(c.jogador || "")}"><button class="x" data-rc="${i}" aria-label="Apagar cartão">✕</button></div>
     <div class="g2" style="margin-top:8px"><select data-c="${i}" data-k="cor"><option value="amarelo" ${c.cor !== "vermelho" ? "selected" : ""}>Amarelo</option><option value="vermelho" ${c.cor === "vermelho" ? "selected" : ""}>Vermelho</option></select>
     <select data-c="${i}" data-k="lado"><option value="pal" ${c.lado !== "adv" ? "selected" : ""}>Palmeiras</option><option value="adv" ${c.lado === "adv" ? "selected" : ""}>Adversário</option></select></div></div>`).join("") || `<p class="pnote">Nenhum cartão lançado.</p>`}
   <button class="btn2" data-ac="1" style="width:100%">+ Cartão</button>`;
  if (aba === "palpites") corpo = `
   ${trav ? `<p class="pnote" style="margin-top:12px">Palpites fechados: o jogo já começou.</p>` : `<p class="pnote" style="margin-top:12px">Palmeiras × ${esc(j.adv || "adversário")}. O nome de quem marca vale 2 pontos a mais.</p>`}
   ${QUEM.map(q => `<div class="item"><b style="display:flex;align-items:center;gap:8px"><span class="av" style="width:30px;height:30px;font-size:14px;border:0;background:var(--${q})">${esc((nome(q)[0] || "?").toUpperCase())}</span>${esc(nome(q))}</b><div class="g2" style="margin-top:6px"><input inputmode="numeric" type="number" min="0" aria-label="Gols do Palmeiras" placeholder="Palmeiras" data-pq="${q}" data-k="gp" value="${j._p[q].gp ?? ""}" ${trav ? "disabled" : ""}>
     <input inputmode="numeric" type="number" min="0" aria-label="Gols do adversário" placeholder="${esc(j.adv || "Adversário")}" data-pq="${q}" data-k="ga" value="${j._p[q].ga ?? ""}" ${trav ? "disabled" : ""}></div>
     <input style="margin-top:8px" placeholder="Quem marca pelo Verdão" data-pq="${q}" data-k="autor" value="${esc(j._p[q].autor || "")}" ${trav ? "disabled" : ""}>
     ${j.fim && pontos(j, S.palp[j.id + "_" + q]) ? `<p class="pnote">Fez ${pontos(j, S.palp[j.id + "_" + q]).pt} ponto(s) neste jogo.</p>` : ""}</div>`).join("")}`;
  if (aba === "ficha") corpo = `
   <label>Adversário</label><input data-f="adv" value="${esc(j.adv)}" autocomplete="off">
   <div class="g2"><div><label>Campeonato</label><select data-f="comp">${[...new Set([...COMPS, j.comp])].map(c => `<option ${c === j.comp ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div>
   <div><label>Rodada ou fase</label><input data-f="fase" value="${esc(j.fase || "")}"></div></div>
   <div class="g2"><div><label>Data</label><input type="date" data-f="data" value="${esc(j.data)}"></div><div><label>Horário</label><input type="time" data-f="hora" value="${esc(j.hora || "")}"></div></div>
   <div class="g2"><div><label>Mando</label><select data-f="mando"><option value="casa" ${j.mando === "casa" ? "selected" : ""}>Em casa</option><option value="fora" ${j.mando === "fora" ? "selected" : ""}>Fora</option><option value="neutro" ${j.mando === "neutro" ? "selected" : ""}>Campo neutro</option></select></div>
   <div><label>Estádio</label><input data-f="local" value="${esc(j.local || "")}"></div></div>
   <div class="g2"><div><label>Público</label><input inputmode="numeric" data-f="publico" value="${esc(j.publico || "")}"></div><div><label>Árbitro</label><input data-f="arbitro" value="${esc(j.arbitro || "")}"></div></div>
   <label>Escalação do Palmeiras</label><textarea data-f="escalacao" placeholder="Um jogador por linha">${esc(j.escalacao || "")}</textarea>
   <label>Anotações</label><textarea data-f="obs" style="min-height:70px">${esc(j.obs || "")}</textarea>
   ${j.novo ? "" : `<button class="btn2 danger" data-apagar="1">Apagar este jogo</button>`}`;
  $("panel").innerHTML = `<div class="ph"><h2>${j.novo ? "Novo jogo" : "Palmeiras × " + esc(j.adv)}</h2><button class="x2" data-fechar="1" aria-label="Fechar">✕</button></div>
   <div class="seg">${abas.map(([k, n]) => `<button data-aba="${k}" class="${aba === k ? "on" : ""}">${n}</button>`).join("")}</div>
   ${corpo}<button class="cta g" data-salvar="1" style="margin-top:16px">Salvar</button><p class="pnote aviso" id="aviso"></p>`;
}
function lerCampos() {
  const p = $("panel");
  p.querySelectorAll("[data-f]").forEach(e => { const k = e.dataset.f; ed[k] = e.type === "checkbox" ? e.checked : (k === "penp" || k === "pena") ? (e.value === "" ? null : +e.value) : e.value.trim(); });
  p.querySelectorAll("[data-g]").forEach(e => { const g = ed.gols[+e.dataset.g], k = e.dataset.k; if (k === "tipo") { g.contra = e.value.startsWith("contra"); g.lado = e.value.endsWith("adv") ? "adv" : "pal"; } else g[k] = e.value.trim(); });
  p.querySelectorAll("[data-c]").forEach(e => { ed.cartoes[+e.dataset.c][e.dataset.k] = e.value.trim(); });
  p.querySelectorAll("[data-pq]").forEach(e => { const k = e.dataset.k; ed._p[e.dataset.pq][k] = k === "autor" ? e.value.trim() : e.value === "" ? null : Math.max(0, parseInt(e.value, 10) || 0); });
}
async function salvar() {
  lerCampos();
  if (!ed.adv) { aba = "ficha"; desenha(); $("aviso").textContent = "Escreva o nome do adversário."; return; }
  const { _p, novo, _aberto, ...doc } = ed;
  doc.gols = doc.gols.map(g => ({ min: g.min || "", autor: g.autor || "", assist: g.assist || "", lado: g.lado, contra: !!g.contra }));
  doc.cartoes = doc.cartoes.map(c => ({ min: c.min || "", jogador: c.jogador || "", cor: c.cor || "amarelo", lado: c.lado || "pal" }));
  try {
    $("aviso").textContent = "Salvando…";
    const antigo = S.jogos[doc.id];
    const final = await ajustarTabela(antigo, doc);
    if (JSON.stringify(antigo) !== JSON.stringify(final)) await S.store.gravar("jogos", doc.id, final);
    if (_aberto) for (const q of QUEM) {
      const p = _p[q], v = S.palp[doc.id + "_" + q] || {};
      if (p.gp != null && p.ga != null && (p.gp !== v.gp || p.ga !== v.ga || (p.autor || "") !== (v.autor || "")))
        await S.store.gravar("palpites", doc.id + "_" + q, { jogo: doc.id, quem: q, gp: p.gp, ga: p.ga, autor: p.autor || "" });
    }
    fechar();
  } catch (e) { $("aviso").textContent = "Não foi possível salvar agora. Confira a internet e tente de novo."; }
}
const fechar = () => { $("sheet").classList.remove("open"); ed = null; };

/* ---------- comemoração ---------- */
function comemorar(quem) {
  const el = $("gol"); $("golquem").textContent = quem || "Palmeiras";
  el.classList.add("on"); try { navigator.vibrate && navigator.vibrate([120, 60, 120, 60, 300]); } catch (e) {}
  const cv = $("confete"), cx = cv.getContext("2d"); cv.width = innerWidth; cv.height = innerHeight;
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ps = calmo ? [] : Array.from({ length: 140 }, () => ({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * .5, vy: 2 + Math.random() * 4, vx: -1.5 + Math.random() * 3, r: 4 + Math.random() * 6, c: ["#f2c230", "#fff", "#34c07a", "#006437"][Math.floor(Math.random() * 4)], a: Math.random() * 6 }));
  const t0 = performance.now();
  const passo = t => { cx.clearRect(0, 0, cv.width, cv.height);
    for (const p of ps) { p.y += p.vy; p.x += p.vx; p.a += .1; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c; cx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); cx.restore(); }
    if (t - t0 < 2200) requestAnimationFrame(passo); else { el.classList.remove("on"); cx.clearRect(0, 0, cv.width, cv.height); } };
  requestAnimationFrame(passo);
}

/* ---------- ajustes e escudos ---------- */
function config() {
  const times = [...new Set(["Palmeiras", ...Object.values(S.jogos).map(j => j.adv), ...(S.tabela ? S.tabela.linhas.map(l => l.t) : [])])].sort((a, b) => a.localeCompare(b));
  $("panel").innerHTML = `<div class="ph"><h2>Ajustes</h2><button class="x2" data-fechar="1" aria-label="Fechar">✕</button></div>
   <div class="g2"><div><label>Jogador 1</label><input id="n-pai" value="${esc(nome("pai"))}"></div><div><label>Jogador 2</label><input id="n-filho" value="${esc(nome("filho"))}"></div></div>
   <button class="cta g" data-snomes="1">Salvar nomes</button>
   ${instalar ? `<button class="cta" data-instalar="1">Instalar o aplicativo</button>` : ""}
   <h2>Escudos</h2>
   <label class="cta g" style="display:block;text-align:center;cursor:pointer;margin-top:0;font-size:17px;line-height:1.2">Enviar vários escudos de uma vez<input type="file" accept="image/*" multiple data-lote="1" style="display:none"></label>
   <p class="pnote">Dê a cada imagem o nome do time, como “flamengo.png” ou “gremio.png”. O aplicativo liga cada imagem ao time certo. Para trocar um só, toque no time.</p>
   ${times.map(t => `<label class="row2" style="color:var(--ink);margin:0 0 6px">${crest(t, "s")}<span style="flex:1">${esc(t)}</span><span class="pnote">Trocar</span><input type="file" accept="image/*" data-escudo="${esc(t)}" style="display:none"></label>`).join("")}
   <p class="pnote">${S.store.modo === "demo" ? "Modo de demonstração: os dados ficam só neste aparelho." : "Os dados estão sincronizados entre os celulares."}</p>
   ${S.store.modo === "firebase" ? `<p class="pnote">Conectado como ${esc(S.store.email())}.</p><button class="btn2" data-sair="1">Sair</button>` : ""}
   <p class="pnote aviso" id="aviso"></p>`;
  $("sheet").classList.add("open");
}
function editarLinha(t) {
  const l = S.tabela.linhas.find(x => x.t === t); if (!l) return;
  const campos = [["j", "Jogos"], ["v", "Vitórias"], ["e", "Empates"], ["d", "Derrotas"], ["gp", "Gols pró"], ["gc", "Gols contra"]];
  $("panel").innerHTML = `<div class="ph"><h2>${esc(t)}</h2><button class="x2" data-fechar="1" aria-label="Fechar">✕</button></div>
   <div class="g2">${campos.map(([k, n]) => `<div><label>${n}</label><input inputmode="numeric" type="number" min="0" data-lin="${k}" value="${l[k]}"></div>`).join("")}</div>
   <button class="cta g" data-slinha="${esc(t)}" style="margin-top:16px">Salvar</button><p class="pnote aviso" id="aviso"></p>`;
  $("sheet").classList.add("open");
}
function reduzir(file) {
  return new Promise((ok, erro) => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const c = document.createElement("canvas"); c.width = c.height = 128;
    const x = c.getContext("2d"); const k = Math.min(128 / im.width, 128 / im.height); const w = im.width * k, h = im.height * k; x.drawImage(im, (128 - w) / 2, (128 - h) / 2, w, h); ok(c.toDataURL("image/png")); };
    im.onerror = erro; im.src = r.result; }; r.onerror = erro; r.readAsDataURL(file); });
}

/* ---------- eventos ---------- */
document.addEventListener("click", async e => {
  const t = e.target.closest("button,tr[data-linha]"); if (!t) return; const d = t.dataset;
  if (d.eu) { eu = d.eu; guardar("verdao-eu", eu); render(); }
  else if (d.v) { S.view = d.v; scrollTo({ top: 0 }); render(); }
  else if (d.comp) { S.comp = d.comp; render(); }
  else if (d.rcomp) { S.rcomp = d.rcomp; render(); }
  else if (d.album) { S.albumDe = d.album; render(); }
  else if (d.abrir) abrir(d.abrir);
  else if (d.novo) abrir(null);
  else if (d.config) config();
  else if (d.fechar) fechar();
  else if (d.linha) editarLinha(d.linha);
  else if (d.aba) { lerCampos(); aba = d.aba; desenha(); }
  else if (d.pl) { lerCampos(); ed[d.pl] = Math.max(0, (ed[d.pl] ?? 0) + (+d.d)); if (ed.gp == null) ed.gp = 0; if (ed.ga == null) ed.ga = 0; desenha(); }
  else if (d.ag) { lerCampos(); ed.gols.push({ min: "", autor: "", assist: "", lado: d.ag, contra: false }); const k = d.ag === "pal" ? "gp" : "ga"; ed[k] = (ed[k] ?? 0) + 1; if (ed.gp == null) ed.gp = 0; if (ed.ga == null) ed.ga = 0; desenha(); if (d.ag === "pal") comemorar("Palmeiras " + ed.gp + " × " + ed.ga + " " + (ed.adv || "")); }
  else if (d.rg != null) { lerCampos(); const g = ed.gols.splice(+d.rg, 1)[0]; const k = g.lado === "pal" ? "gp" : "ga"; ed[k] = Math.max(0, (ed[k] ?? 0) - 1); desenha(); }
  else if (d.ac) { lerCampos(); ed.cartoes.push({ min: "", jogador: "", cor: "amarelo", lado: "pal" }); desenha(); }
  else if (d.rc != null) { lerCampos(); ed.cartoes.splice(+d.rc, 1); desenha(); }
  else if (d.salvar) salvar();
  else if (d.apagar) {
    if (d.certo) { try { const j = S.jogos[ed.id]; if (j && j.apl) await ajustarTabela(j, { ...j, fim: false }); await S.store.apagar("jogos", ed.id); for (const q of QUEM) await S.store.apagar("palpites", ed.id + "_" + q); fechar(); } catch (x) { $("aviso").textContent = "Não foi possível apagar agora."; } }
    else { t.dataset.certo = "1"; t.textContent = "Toque de novo para confirmar"; }
  }
  else if (d.snomes) { const n = { ...S.cfg, pai: $("n-pai").value.trim() || "Pai", filho: $("n-filho").value.trim() || "Filho" }; try { await S.store.gravar("config", "geral", n); $("aviso").textContent = "Nomes salvos."; } catch (x) { $("aviso").textContent = "Não foi possível salvar agora."; } }
  else if (d.slinha) { const linhas = S.tabela.linhas.map(l => { if (l.t !== d.slinha) return l; const n = { ...l }; $("panel").querySelectorAll("[data-lin]").forEach(i => n[i.dataset.lin] = Math.max(0, parseInt(i.value, 10) || 0)); return n; });
    try { await S.store.gravar("tabela", "brasileirao", { ...S.tabela, linhas, atualizado: new Date().toLocaleDateString("pt-BR") }); fechar(); } catch (x) { $("aviso").textContent = "Não foi possível salvar agora."; } }
  else if (d.instalar && instalar) { instalar.prompt(); instalar = null; fechar(); }
  else if (d.sair) { await S.store.sair(); location.reload(); }
});
document.addEventListener("change", async e => {
  const t = e.target;
  if (t.dataset.lote && t.files.length) {
    const times = [...new Set(["Palmeiras", ...Object.values(S.jogos).map(j => j.adv), ...(S.tabela ? S.tabela.linhas.map(l => l.t) : [])])];
    const ok = [], sem = [];
    $("aviso").textContent = "Enviando escudos…";
    for (const f of t.files) {
      const base = f.name.replace(/\.[^.]+$/, "");
      const time = times.find(n => slug(n) === slug(base)) || times.find(n => mesmoNome(n, base));
      if (!time) { sem.push(f.name); continue; }
      try { await S.store.gravar("times", slug(time), { nome: time, img: await reduzir(f) }); ok.push(time); } catch (x) { sem.push(f.name); }
    }
    config();
    $("aviso").textContent = `${ok.length} escudo${ok.length === 1 ? "" : "s"} salvo${ok.length === 1 ? "" : "s"}.` + (sem.length ? ` Não reconheci: ${sem.join(", ")}. Renomeie com o nome do time e envie de novo.` : "");
    return;
  }
  if (!t.dataset.escudo || !t.files[0]) return;
  try { $("aviso").textContent = "Enviando escudo…"; const img = await reduzir(t.files[0]); await S.store.gravar("times", slug(t.dataset.escudo), { nome: t.dataset.escudo, img }); $("aviso").textContent = "Escudo salvo."; setTimeout(() => { if ($("n-pai")) config(); }, 300); }
  catch (x) { $("aviso").textContent = "Não consegui usar essa imagem."; }
});
$("sheet").addEventListener("click", e => { if (e.target.id === "sheet") fechar(); });
addEventListener("beforeinstallprompt", e => { e.preventDefault(); instalar = e; });
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});

/* ---------- entrada e dados ---------- */
function telaEntrar(cfg, msg) {
  $("view").innerHTML = `<div class="fig login"><div class="d" style="font-size:22px;text-align:center;line-height:1.15">Entrar no álbum<br>da família</div>
   <p class="pnote" style="text-align:center">Use a sua conta do Google. Cada um entra com a própria conta.</p>
   <button class="cta g" id="l-ok">Entrar com o Google</button><p class="pnote" id="l-msg" style="text-align:center">${esc(msg || "")}</p></div>`;
  $("l-ok").onclick = async () => { $("l-msg").textContent = "Abrindo o Google…";
    try { if (await S.store.entrar()) entrou(cfg); }
    catch (x) { $("l-msg").textContent = "Não deu para entrar. Tente de novo."; } };
}
function entrou(cfg) {
  const em = S.store.email(), mapa = (cfg && cfg.emails) || {};
  const quem = QUEM.find(q => mapa[q] && mapa[q].toLowerCase() === em);
  if (S.store.modo === "firebase" && !quem) { S.store.sair(); telaEntrar(cfg, `A conta ${em} não faz parte do álbum. Entre com a conta do pai ou do filho.`); return; }
  if (quem) { eu = quem; guardar("verdao-eu", eu); }
  iniciarDados();
}
async function semear() {
  const cfg = await S.store.lerTudo("config");
  if (cfg.geral && cfg.geral.semeado) return;
  for (const j of SEED_JOGOS) { const d = { ...j }; if (SEED_APLICADOS.includes(j.id)) d.apl = { gp: j.gp, ga: j.ga }; await S.store.gravar("jogos", j.id, d); }
  await S.store.gravar("tabela", "brasileirao", SEED_TABELA);
  await S.store.gravar("config", "geral", { ...(cfg.geral || {}), pai: (cfg.geral && cfg.geral.pai) || "Pai", filho: (cfg.geral && cfg.geral.filho) || "Filho", semeado: true });
}
async function iniciarDados() {
  $("view").innerHTML = `<div class="fig hero"><div class="vazio">Carregando os jogos…</div></div>`;
  try { await semear(); } catch (e) {}
  try { // escudos enviados pela família e incluídos no pacote: grava os que ainda não existem
    const { ESCUDOS } = await import("./escudos.js"); const atuais = await S.store.lerTudo("times");
    for (const [k, img] of Object.entries(ESCUDOS)) if (!atuais[k]) await S.store.gravar("times", k, { nome: k, img });
  } catch (e) {}
  const tm = setTimeout(() => { if (!S.ok) $("view").innerHTML = `<div class="fig hero"><div class="vazio">Os dados ainda não chegaram. Confira a internet do celular.</div></div>`; }, 10000);
  const erro = () => { $("view").innerHTML = `<div class="fig hero"><div class="vazio">Sem acesso aos dados. Saia e entre de novo nos Ajustes.</div></div>`; };
  S.store.ouvir("jogos", o => { for (const k in o) o[k].id = k; S.jogos = o; S.ok = true; clearTimeout(tm); render(); }, erro);
  S.store.ouvir("palpites", o => { S.palp = o; render(); });
  S.store.ouvir("times", o => { S.times = o; render(); });
  S.store.ouvir("tabela", o => { S.tabela = o.brasileirao || null; render(); });
  S.store.ouvir("config", o => { if (o.geral) S.cfg = { ...S.cfg, ...o.geral }; render(); });
}
(async () => {
  render();
  const cfg = window.VERDAO_CONFIG || {};
  try { S.store = await criarStore(cfg); }
  catch (e) { $("view").innerHTML = `<div class="fig hero"><div class="vazio">Não consegui abrir os dados. Confira a internet e abra de novo.</div></div>`; return; }
  if (S.store.precisaEntrar()) telaEntrar(cfg); else entrou(cfg);
})();
