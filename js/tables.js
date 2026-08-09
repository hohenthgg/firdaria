/* ============================================================
   TABLES.JS — tábuas estáticas da tradição (sem dados de mapa)
   ============================================================ */
const SIGNS=['Áries','Touro','Gêmeos','Câncer','Leão','Virgem','Libra','Escorpião','Sagitário','Capricórnio','Aquário','Peixes'];
const SG=['ÁRI','TOU','GÊM','CÂN','LEO','VIR','LIB','ESC','SAG','CAP','AQU','PEI'];
const SIGN_ELEM=['fogo','terra','ar','água','fogo','terra','ar','água','fogo','terra','ar','água'];
const SIGN_MODE=['cardinal','fixo','mutável','cardinal','fixo','mutável','cardinal','fixo','mutável','cardinal','fixo','mutável'];
const ELEMQ={fogo:['quente','seco'],terra:['frio','seco'],ar:['quente','úmido'],'água':['frio','úmido']};
const PT_NAME={sun:'Sol',moon:'Lua',mercury:'Mercúrio',venus:'Vênus',mars:'Marte',jupiter:'Júpiter',saturn:'Saturno'};
const PT_GLYPH={sun:'☉',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',nn:'☊',sn:'☋',fort:'⊗',spirit:'☉̷'};
const PT_FULL={sun:'Sol',moon:'Lua',mercury:'Mercúrio',venus:'Vênus',mars:'Marte',jupiter:'Júpiter',saturn:'Saturno',nn:'Nodo N.',sn:'Nodo S.',fort:'Fortuna',spirit:'Espírito'};
/* regências, exaltações, quedas (signo → planeta) */
const SIGN_RULER=['mars','venus','mercury','moon','sun','mercury','venus','mars','jupiter','saturn','saturn','jupiter'];
const EXALT={sun:0,moon:1,mercury:5,venus:11,mars:9,jupiter:3,saturn:6};       // signo de exaltação
const FALL ={sun:6,moon:7,mercury:11,venus:5,mars:3,jupiter:9,saturn:0};       // queda
/* termos (tábua usada no projeto — limites superiores e senhores) */
const TERMS=[
 [[6,'jupiter'],[14,'venus'],[21,'mercury'],[26,'mars'],[30,'saturn']],   // Áries
 [[8,'venus'],[15,'mercury'],[22,'jupiter'],[26,'saturn'],[30,'mars']],   // Touro
 [[7,'mercury'],[14,'jupiter'],[21,'venus'],[25,'saturn'],[30,'mars']],   // Gêmeos
 [[6,'mars'],[13,'jupiter'],[20,'mercury'],[27,'venus'],[30,'saturn']],   // Câncer
 [[6,'saturn'],[13,'mercury'],[19,'venus'],[25,'jupiter'],[30,'mars']],   // Leão
 [[7,'mercury'],[13,'venus'],[18,'jupiter'],[24,'mars'],[30,'saturn']],   // Virgem
 [[6,'saturn'],[11,'venus'],[19,'jupiter'],[24,'mercury'],[30,'mars']],   // Libra
 [[6,'mars'],[14,'jupiter'],[21,'venus'],[27,'mercury'],[30,'saturn']],   // Escorpião
 [[8,'jupiter'],[14,'venus'],[19,'mercury'],[25,'saturn'],[30,'mars']],   // Sagitário
 [[6,'venus'],[12,'mercury'],[19,'jupiter'],[25,'mars'],[30,'saturn']],   // Capricórnio
 [[6,'saturn'],[12,'mercury'],[20,'venus'],[25,'jupiter'],[30,'mars']],   // Aquário
 [[8,'venus'],[14,'jupiter'],[20,'mercury'],[26,'mars'],[30,'saturn']]];  // Peixes
/* casas: significações tradicionais */

const HOUSE_SHORT={1:'o corpo e a vida',2:'o dinheiro',3:'estudos, irmãos e a palavra',4:'a casa e o pai',5:'filhos, prazeres e criações',6:'doenças e trabalho',7:'cônjuge, sócios e contendas',8:'morte, medos e dívidas',9:'doutrina e longas viagens',10:'o ofício e as honras',11:'amigos e apoios',12:'inimigos ocultos e exílios'};
/* temas literais de cada casa — claros, sem determinismo */
const HOUSE_THEME={
 1:'o próprio nativo: corpo, vitalidade, identidade e modo de se apresentar',
 2:'dinheiro e recursos próprios',
 3:'irmãos, estudos, comunicação e trajetos curtos',
 4:'casa, família de origem, pai e raízes',
 5:'filhos, romance, prazeres e criações',
 6:'saúde, rotina de trabalho e subordinados',
 7:'relacionamentos, sociedades, contratos e adversários declarados',
 8:'perdas, medos, dívidas, recursos de terceiros e crises',
 9:'religião, filosofia, estudos superiores e o estrangeiro',
 10:'carreira, reputação, autoridade e vocação',
 11:'amigos, grupos, apoios e projetos',
 12:'isolamento, bastidores, hospitais e assuntos ocultos'};
/* rótulos curtos (para títulos de promessa) */
const HOUSE_TAG={1:'identidade e corpo',2:'dinheiro',3:'estudos e comunicação',4:'casa e família',5:'filhos e prazeres',6:'saúde e trabalho',7:'relacionamentos',8:'perdas e recursos de terceiros',9:'estudos superiores e estrangeiro',10:'carreira',11:'amigos e grupos',12:'bastidores e isolamento'};
/* compatibilidade retro: aliases usados no restante do código */
const HOUSE_BLUNT=HOUSE_THEME, HOUSE_ACID=HOUSE_THEME;

/* firdária: ordens e durações */
const FIRD_DIURNAL=[['sun','Sol',10],['venus','Vênus',8],['mercury','Mercúrio',13],['moon','Lua',9],['saturn','Saturno',11],['jupiter','Júpiter',12],['mars','Marte',7],['nn','Nodo N.',3],['sn','Nodo S.',2]];
const FIRD_NOCTURNAL=[['moon','Lua',9],['saturn','Saturno',11],['jupiter','Júpiter',12],['mars','Marte',7],['sun','Sol',10],['venus','Vênus',8],['mercury','Mercúrio',13],['nn','Nodo N.',3],['sn','Nodo S.',2]];
const FIRD_COLORS={'Lua':'#d8d2c4','Saturno':'#8a8578','Júpiter':'#c9a86a','Marte':'#b0564a','Sol':'#e8d9a8','Vênus':'#6f9e83','Mercúrio':'#8496ab','Nodo N.':'#8878a8','Nodo S.':'#6f6758'};
/* estrelas fixas — cláusulas concisas (dom · vigilância) */
const STAR_MEANINGS={
 'Algol':'a Górgona: intensidade que decapita ou é lapidada em obra — não fitar crua',
 'Regulus':'o coração do Leão: honra e comando; queda se houver vingança',
 'Spica':'a espiga: dom protegido, colheita do que foi bem lavrado',
 'Arcturus':'o lavrador-guardião: prosperidade por rumo firme',
 'Antares':'o anti-Régulus: coragem obsessiva; não guerrear de fachada',
 'Aldebaran':'o olho do Touro: integridade vigilante — cair se trair a própria palavra',
 'Fomalhaut':'a boca do Peixe austral: promessa grande cumprida só com integridade',
 'Sirius':'a mais brilhante: ambição luminosa, fama que queima se sem rédea',
 'Canopus':'o piloto: navegação de longo curso, liderança de travessias',
 'Rigel':'o pé do gigante: marcha firme, ascensão por técnica',
 'Betelgeuse':'o ombro de Órion: êxito marcial visível',
 'Alhena':'o passo orgulhoso: graça de movimento, arte do acordo',
 'Dubhe':'a ponteira da Ursa: presença que orienta; ferocidade protetora',
 'Alioth':'a Ursa que guia na cerração',
 'Porrima':'a profetisa: saber a hora — timing como dom',
 'Vindemiatrix':'a vindimadora: colher no ponto certo; perda se colher cedo',
 'Zosma':'as costas do Leão: carregar sem vitimismo',
 'Denebola':'a cauda do Leão: virar páginas com dignidade; ir contra a corrente',
 'Al Jabhah':'a fronte do Leão: mente dianteira; medir a fala',
 'Adhafera':'a juba: brilho teatral',
 'Alphard':'o Solitário: intensidade só; medir o isolamento',
 'Markab':'a sela de Pégaso: firmeza sobre o veloz',
 'Scheat':'a perna do cavalo que afunda: nadar com técnica, não com pressa',
 'Deneb Algedi':'o juiz benéfico: a lei protege quem cumpre',
 'Sadalsuud':'a sorte das sortes: benevolência tranquila',
 'Nashira':'a afortunada: vitória após luta',
 'Vega':'a Lira: consolo e carisma pela arte',
 'Altair':'a águia: voo rápido e ousado',
 'Alcyone':'a Plêiade: visão e lágrimas — ver longe custa',
 'Hyadum I':'as chuvosas: tempestade emocional que, drenada, irriga',
 'Hyadum II':'as chuvosas: trabalho sob chuva',
 'Ain':'o olho menor do Touro: observação paciente',
 'Menkalinan':'o Cocheiro: força que pede rédea',
 'Castor':'o gêmeo mortal: engenho verbal',
 'Pollux':'o gêmeo imortal: coragem combativa',
 'Procyon':'o pré-cão: êxito rápido que exige consolidação',
 'Zuben Elgenubi':'o prato sul: o preço insuficiente cobra juros',
 'Zuben Eschamali':'o prato norte: cobrar o preço inteiro — honra nos acordos',
 'Unukalhai':'a serpente: segurar o veneno sem bebê-lo',
 'Khambalia':'a investigação penetrante: doutrina obtida escavando',
 'Cor Caroli':'o coração do Rei: coroa discreta',
 'Mirach':'a graça harmoniosa: amparo por afeto',
 'Almach':'o talento que agrada',
 'Menkar':'a fera na face: o instintivo à mostra',
 'Mira':'a Maravilhosa variável: brilhar, esmaecer e sempre retornar',
 'Sheratan':'o chifre do Carneiro: começar de cabeça',
 'Mesarthim':'a cabeça do Carneiro: primeiro impulso disponível',
 'Hamal':'a testa do Carneiro: teimosia dianteira',
 'Alkes':'a Taça: servir sem entornar',
 'Skat':'a canela do Aguadeiro: sorte por rede e ideal',
 'Facies':'o olhar do arqueiro: foco implacável — mirar sem crueldade',
 'Ascella':'a axila do Arqueiro: fortuna amparada',
 'Nunki':'a pena de Sagitário: sustento pelo que já se sabe',
 'Cursa':'a nascente do Rio: começar fluxos longos',
 'Ras Algethi':'a cabeça do Ajoelhado: o forte que se curva',
 'Ras Elased':'a cabeça do Leão: autoridade nativa',
 'Ras Elased Australis':'a cabeça do Leão: autoridade nativa',
 'Sabik':'o curandeiro: cura por vias tortas e honestidade difícil',
 'Wasat':'o meio dos Gêmeos: palavra com peso químico — cuidado com o tóxico',
 'Praesepe':'a Manjedoura: abundância em enxame; névoa nos olhos',
 'Asellus Borealis':'o jumento do norte: paciência que carrega',
 'Asellus Australis':'o jumento do sul: paciência que carrega',
 'Algorab':'o corvo: dizer não também constrói',
 'Alnilam':'o cinturão de Órion: a espada alinhada',
 'Alnitak':'o cinturão de Órion: corte preciso',
 'Polaris':'a estrela fixa do Norte: âncora na travessia',
 'Capulus':'a espada de Perseu: cortar limpo, sem fúria',
 'Deneb Kaitos':'a cauda da Baleia: paciência no fundo',
 'Achernar':'o fim do Rio: conclusões rápidas de longos cursos',
 'Haedus I':'os Cabritos: carregar os frágeis através da tempestade',
 'Haedus II':'os Cabritos: ternura sob tormenta',
 'Zavijava':'o canto da Virgem: precisão discreta',
 'Toliman':'o pé do Centauro: o mestre interior',
 'Agena':'o Centauro: honra por disciplina',
 'Alderamin':'o braço real de Cefeu: autoridade serena',
 'Etamin':'o olho do Dragão: visão penetrante',
 'Alwaid':'a cabeça do Dragão: guarda do tesouro',
 'Rukbat':'o joelho do Arqueiro: estabilidade da mira',
 'Sadalmelek':'a sorte do rei: favor de cima',
 'Enif':'o focinho de Pégaso: intuição impulsiva',
 'Baten Kaitos':'a barriga da Baleia: recolhimentos produtivos',
 'Acamar':'o Rio a meio curso: pausa honrosa',
 'Alpheratz':'a asa de Pégaso: liberdade veloz',
 'Mirfak':'o cotovelo de Perseu: façanha juvenil',
 'Bos':'o boi: labor constante',
 'Dabih':'o sacrifício que constrói',
 'Giedi I':'o cabrito: sorte estranha e dupla',
 'Giedi II':'o cabrito: sorte estranha e dupla',
 'Armus':'o coração do Cabrito: inquietude útil',
 'Albali':'o engolidor: absorver sem afogar',
 'Sadalachbia':'a sorte das tendas: achar o lugar certo',
 'Fum Alsamakah':'a boca do Peixe: fé que alimenta',
 'Alrischa':'o nó dos Peixes: unir os fios',
 'Al Pherg':'a fonte do Peixe: constância religiosa',
 'Deneb Adige':'a cauda do Cisne: idealismo alado',
 'Albireo':'o bico do Cisne: beleza que apazigua',
 'Terebellium':'a cauda do Arqueiro: fortuna com reveses',
 'Spiculum':'a ponta da flecha: visão ferida — proteger os olhos e o alvo',
 'Manubrium':'o cabo da flecha: coragem ígnea',
 'Oculus':'o olho do Cabrito: atenção fina',
 'Kerb':'a corda de Pégaso: amarrar o voo',
 'Coxa':'a coxa do Leão: avanço sustentado',
 'Han':'o pé de Ofiúco: cura no caminho',
 'Phecda':'a coxa da Ursa: constância doméstica',
 'Asterion':'os Cães de Caça: fidelidade vigilante',
 'Syrma':'a barra da Virgem: exatidão final',
 'Princeps':'o príncipe: estudo profundo para liderar',
 'Labrum':'o cálice: honra por dom',
 'Zaniah':'o ângulo da Virgem: refinamento e trato',
 'Alkaid':'a ponta do rabo da Ursa: fim de ciclos',
 'Foramen':'a quilha: passagem estreita vencida',
 'Schedir':'o peito de Cassiopeia: dignidade altiva',
 'Alrescha':'o nó dos Peixes: unir os fios',
 'Hyadum III':'as chuvosas: trabalho sob chuva',
 'Tejat':'o calcanhar de Castor: passo verbal',
 'Propus':'o pé estendido: avanço prudente',
 'Merak':'a Ursa segunda: apoio leal',
 'Sgr A*':'o centro da Galáxia: o chamado do imenso',
 'Rotanev':'o Delfim: graça que salva',
 'Sualocin':'o Delfim: brincar com as ondas',
 'Acrab':'a pinça do Escorpião: agarrar com método',
 'Acrux':'o Cruzeiro: devoção cerimonial',
 'Mimosa':'o Cruzeiro: fé prática',
 'Alnair':'a Grua: mensagem alta',
 'Ankaa':'a Fênix: renascer do próprio fim',
 'Diadem':'a coroa de Berenice: sacrifício coroado',
 'Vertex':'a Grande Nebulosa de Andrômeda: visão além do olho'
};
/* efemérides */
const TB=[['Sun','sun','☉'],['Moon','moon','☽'],['Mercury','mercury','☿'],['Venus','venus','♀'],['Mars','mars','♂'],['Jupiter','jupiter','♃'],['Saturn','saturn','♄']];
const MEAN={Sun:[280.46,0.98565],Moon:[218.32,13.176],Mercury:[252.25,4.0923],Venus:[181.98,1.6021],Mars:[355.43,0.5240],Jupiter:[34.35,0.083091],Saturn:[50.08,0.033460]};
const ASPECTS=[[0,'☌','conj','ativa',8],[60,'⚹','harm','favorece',4],[90,'□','tens','pressiona',6],[120,'△','harm','favorece',6],[180,'☍','tens','pressiona',7]];
/* conselhos por senhor do ano (genéricos, linguagem direta) */
const CONSELHO={
 sun:'Agir em nome próprio e à luz: o que levar o próprio rosto rende; o que for por procuração perde força.',
 moon:'Ritmo e ciclos curtos: constância vence onde o arranque falha; cuidar de casa, sono e público.',
 mercury:'Escrever, negociar, documentar: o ano ganha-se no papel e na palavra medida — e perde-se na palavra solta.',
 venus:'Acordos, preço justo e acabamento: aceitar cedo demais é o erro caro do período.',
 mars:'Cortar, competir, executar — uma frente por vez; pressa serve à execução, não a contratos.',
 jupiter:'Expandir só sobre fundação: crescer onde há fiador, contrato ou mestre; excesso sem lastro cobra depois.',
 saturn:'Durar: prazos longos, obrigações honradas, podas feitas cedo; o período paga em estrutura, não em aplauso.'};


/* eletiva */
const ELECT_SIG={'assinar contrato':{sig:'mercury',houses:[3,7]},'lançar produto':{sig:'sun',houses:[10,2]},'publicar vídeo':{sig:'mercury',houses:[3,11]},'abrir empresa':{sig:'sun',houses:[10,1]},'enviar proposta':{sig:'mercury',houses:[3,9]},'realizar reunião':{sig:'mercury',houses:[3,7]},'viajar':{sig:'mercury',houses:[3,9]},'iniciar curso':{sig:'jupiter',houses:[9,3]},'fazer compra':{sig:'venus',houses:[2]},'iniciar tratamento':{sig:'sun',houses:[6,1]},'realizar evento':{sig:'sun',houses:[5,10]},'realizar live':{sig:'mercury',houses:[3,11]},'pedir aumento':{sig:'sun',houses:[10,2]},'iniciar relacionamento':{sig:'venus',houses:[7,5]},'marcar casamento':{sig:'venus',houses:[7]}};
/* método (estático) */
const CONTEUDO={explic:[
 ['Firdária','Períodos persas de regência (Albumasar). Mapa diurno começa pelo Sol; noturno, pela Lua. Cada era divide-se em 7 sub-períodos iguais a partir do senhor maior. A firdária diz QUEM governa o capítulo; a condição natal do senhor diz COM QUE MÃOS.'],
 ['Profecções','O Ascendente avança um signo por ano de vida. O regente do signo profectado é o Senhor do Ano; o ano cumpre-se pelos temas da casa profectada E pela promessa natal do senhor (casa, dignidade, recepções).'],
 ['Revolução Solar','O mapa do retorno do Sol ao grau natal (Abu Mashar, De Revolutionibus). Julga-se: a casa natal em que cai o Asc da RS; a condição do Senhor do Ano na RS; planetas da RS sobre pontos natais; planeta repetindo o signo natal confirma a promessa; estrelas nos ângulos.'],
 ['Regra dos 5 graus','Planeta a menos de 5° da cúspide seguinte pertence à casa seguinte. Aplicada à natal e às revoluções informadas.'],
 ['Termos','Subdivisões dos signos com senhores próprios (tábua tradicional): o senhorio de detalhe que colore corpo, mente e pontos do mapa.'],
 ['Recepções','Planeta no domicílio ou exaltação de outro que o aspecta é recebido: o anfitrião responde pelo hóspede. O sistema detecta recepções e recepções mútuas automaticamente a partir das posições informadas.'],
 ['Estrelas fixas','Somente conjunções apertadas informadas nos dados (≤1°), lidas como cláusula dupla — um dom e uma vigilância. Estrelas fora da tábua interna aparecem sem glosa.'],
 ['Temperamento','Compleição por pesos: Asc + regente do Asc + planetas na casa I + Lua e fase (peso igual) → estação do Sol → senhor da genitura (mínimo). Pressupõe hemisfério norte para a estação; ajuste mental se austral.'],
 ['48 eixos','Caracterologia contínua (1–4; 2,5 = equilíbrio) por testemunhos ponderados computados do mapa informado: dignidades, angularidade, elementos, modos e aspectos. Debilidade altera a FORMA de expressão, não apaga a natureza.'],
 ['Motor de relevância','Cada trânsito pontua por: senhor da firdária (+3), da sub (+2), Senhor do Ano (+3), regência da casa profectada (+2), angularidade na RS informada (+2), toque em Asc/Sol/Lua/MC (+2), toque no Senhor do Ano natal (+2), eco de aspecto da RS (+2), orbe <1° (+2). Medida interna de repetição entre técnicas — não é probabilidade.']
]};
/* 48 eixos — configuração GENÉRICA: avaliada contra o mapa carregado */


/* ---------- CFG: pesos ajustáveis pelo usuário (aba Ajustes) ---------- */
const CFG_DEF={
  tw:{asc:3,cusp:3,h1:2,ruler:3,moon:2,phase:1,lord:1},        // temperamento
  cw:{promessa:3,firdaria:3,sub:2,casaProf:3,senhorAno:3,revAlta:2.5,revMedia:1.5,repete:1.5,bonus:1.5} // convergência
};
let CFG=(function(){
  try{const j=JSON.parse(localStorage.getItem('agx_cfg')||'null');
    if(j&&j.tw&&j.cw)return {tw:Object.assign({},CFG_DEF.tw,j.tw),cw:Object.assign({},CFG_DEF.cw,j.cw)};}catch(e){}
  return JSON.parse(JSON.stringify(CFG_DEF));
})();
function cfgSave(){try{localStorage.setItem('agx_cfg',JSON.stringify(CFG));}catch(e){}}
