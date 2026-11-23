// Dados iniciais. Só são gravados quando o banco de dados está vazio.
export const SEED_JOGOS = [
  {id:"br35-cruzeiro",comp:"Brasileirão",fase:"35ª rodada",data:"2026-11-18",hora:"20:30",adv:"Cruzeiro",mando:"fora",local:"Mineirão",gp:1,ga:2,fim:true,
   publico:"49.664",arbitro:"Anderson Daronco",
   gols:[{min:"46",autor:"Ramón Sosa",assist:"",lado:"pal",contra:false},{min:"73",autor:"Matheus Pereira",assist:"",lado:"adv",contra:false},{min:"76",autor:"Khellven",assist:"",lado:"adv",contra:true}],cartoes:[]},
  {id:"br36-flamengo",comp:"Brasileirão",fase:"36ª rodada",data:"2026-11-21",hora:"16:30",adv:"Flamengo",mando:"casa",local:"Nubank Parque",gp:1,ga:1,fim:true,gols:[],cartoes:[]},
  {id:"br37-chapecoense",comp:"Brasileirão",fase:"37ª rodada",data:"2026-11-24",hora:"18:00",adv:"Chapecoense",mando:"fora",local:"Arena Condá",gp:null,ga:null,fim:false,gols:[],cartoes:[]},
  {id:"lib-final-estudiantes",comp:"Libertadores",fase:"Final",data:"2026-11-28",hora:"17:00",adv:"Estudiantes",mando:"neutro",local:"Estádio Centenário, Montevidéu",gp:null,ga:null,fim:false,gols:[],cartoes:[]},
  {id:"br38-coritiba",comp:"Brasileirão",fase:"38ª rodada",data:"2026-12-02",hora:"21:30",adv:"Coritiba",mando:"casa",local:"",gp:null,ga:null,fim:false,gols:[],cartoes:[]},
  {id:"cdb-final-gremio",comp:"Copa do Brasil",fase:"Final",data:"2026-12-06",hora:"",adv:"Grêmio",mando:"neutro",local:"Mané Garrincha, Brasília",gp:null,ga:null,fim:false,gols:[],cartoes:[]}
];
// Classificação do Brasileirão após o jogo Palmeiras 1 x 1 Flamengo (fonte: ValorFinal, 22/11/2026).
// Os dois jogos acima já estão contados nesta tabela.
export const SEED_TABELA = {
  nome:"Brasileirão 2026", atualizado:"22/11/2026",
  linhas:[
    ["Flamengo",36,24,8,4,74,31],["Palmeiras",36,21,11,4,64,26],["Cruzeiro",36,20,6,10,59,50],["Fluminense",35,17,9,9,56,42],
    ["Athletico-PR",36,16,9,11,56,47],["Bahia",36,14,12,10,50,46],["Atlético-MG",35,14,9,12,44,40],["Santos",35,13,11,11,51,49],
    ["Bragantino",35,13,8,14,45,41],["Vasco",35,13,8,14,47,51],["Coritiba",36,12,9,15,41,52],["São Paulo",35,12,8,15,39,40],
    ["Botafogo",35,11,9,15,46,57],["Vitória",35,11,8,16,37,52],["Mirassol",35,10,11,14,39,48],["Corinthians",35,10,10,15,40,42],
    ["Internacional",35,9,11,15,39,44],["Grêmio",35,9,11,15,38,47],["Remo",36,7,11,18,41,61],["Chapecoense",36,4,9,23,34,74]
  ].map(([t,j,v,e,d,gp,gc])=>({t,j,v,e,d,gp,gc}))
};
export const SEED_APLICADOS = ["br35-cruzeiro","br36-flamengo"];
