// Phrase: weight. Threshold 4; longer and specific terms carry more evidence.
// Default categories are part of the source; additional categories and the person
// list are created inside the app and stored locally on the device only.
export const DEFAULT_RULES = {
 Termine: {color:'purple',icon:'calendar',terms:{'terminbestätigung':7,'terminvereinbarung':6,'ihr termin':6,'nächster termin':6,'kontrolltermin':6,'untersuchungstermin':7,'impftermin':7,'einladung':3,'sprechstunde':2,'um uhr':1,'bitte erscheinen':5,'wiedervorstellung':4,'besichtigungstermin':6,'am um':1}},
 Rechnungen: {color:'orange',icon:'receipt',terms:{'rechnung':5,'rechnungsnummer':7,'rechnungsbetrag':7,'zahlungsziel':6,'zahlbar bis':6,'fällig am':4,'zu zahlen':5,'gesamtbetrag':3,'überweisen sie':5,'mahnung':6,'zahlungserinnerung':7,'offener betrag':5,'gutschrift':3,'iban':1,'umsatzsteuer':2,'lastschrift':2}},
 Versicherung: {color:'blue',icon:'shield',terms:{'versicherungsschein':7,'versicherungspolice':7,'versicherungsnummer':5,'versicherung':4,'versicherungsbeitrag':6,'haftpflicht':6,'rechtsschutz':6,'hausrat':6,'wohngebäudeversicherung':7,'gebäudeversicherung':7,'kfz versicherung':7,'kaskoversicherung':7,'schadennummer':5,'schadenmeldung':5,'deckungszusage':4,'lebensversicherung':6,'berufsunfähigkeit':6,'unfallversicherung':6}},
 Gesundheit: {color:'pink',icon:'health',terms:{'arzt':4,'ärztlich':3,'arztpraxis':6,'praxis':2,'krankenhaus':6,'klinik':5,'patient':4,'patientin':4,'befund':6,'diagnose':6,'rezept':6,'verordnung':4,'heilmittel':5,'physiotherapie':6,'ergotherapie':6,'impfung':6,'kinderarzt':6,'zahnarzt':6,'vorsorgeuntersuchung':6,'krankenversicherung':7,'krankenkasse':7,'pflegeversicherung':6,'gesundheitskasse':6,'behandlungsplan':6,'heil und kostenplan':6,'entlassungsbericht':7,'laborbericht':6,'aok':3,'barmer':3,'techniker krankenkasse':7,'tk':1,'beihilfe':3,'gebührenordnung für ärzte':6,'goä':5}},
 Auto: {color:'green',icon:'car',terms:{'fahrzeug':4,'kfz':5,'pkw':5,'kennzeichen':4,'fahrgestellnummer':6,'fahrzeug identifizierungsnummer':7,'zulassungsbescheinigung':7,'hauptuntersuchung':6,'abgasuntersuchung':6,'tüv':4,'werkstatt':3,'inspektion':3,'reifenwechsel':6,'kraftfahrzeugsteuer':7,'kfz versicherung':7,'kaskoversicherung':7,'vollkasko':6,'teilkasko':6,'kilometerstand':4,'leasing':3,'id buzz':6,'volkswagen':3,'vw':2}},
 Gebäude: {color:'teal',icon:'home',terms:{'immobilie':5,'gebäude':4,'wohngebäudeversicherung':7,'gebäudeversicherung':7,'hausrat':4,'miete':4,'mietvertrag':7,'nebenkosten':6,'betriebskostenabrechnung':7,'nebenkostenabrechnung':7,'hausgeld':6,'grundsteuer':7,'grundstück':4,'grundbuch':6,'strom':4,'stromrechnung':7,'gasrechnung':7,'wasserrechnung':7,'energieversorger':5,'abschlagszahlung':3,'zählernummer':4,'zählerstand':4,'handwerker':4,'heizung':5,'sanitär':4,'schornsteinfeger':6,'dachdecker':6,'abwasser':5,'müllgebühren':6,'wohnfläche':4,'hausverwaltung':6,'eigentümergemeinschaft':6,'modernisierung':3,'renovierung':4,'baufinanzierung':6}},
 Anleitungen: {color:'indigo',icon:'book',terms:{'bedienungsanleitung':7,'gebrauchsanweisung':7,'gebrauchsanleitung':7,'betriebsanleitung':7,'montageanleitung':7,'aufbauanleitung':7,'installationsanleitung':7,'benutzerhandbuch':7,'bedienungshandbuch':7,'kurzanleitung':6,'schnellstartanleitung':6,'anwenderhandbuch':7,'handbuch':5,'anleitung':4,'inbetriebnahme':5,'erste schritte':4,'sicherheitshinweise':4,'pflegehinweise':5,'wartungsplan':5,'ersatzteile':4,'ersatzteilliste':6,'garantiebedingungen':4,'konformitätserklärung':5,'lieferumfang':5,'technische daten':3,'modellnummer':3,'typenschild':4,'fehlerbehebung':5,'störungsbehebung':5}}
};

export const COLORS=['blue','orange','purple','pink','green','teal','indigo','red'];
export const COLOR_LABELS={blue:'Blau',orange:'Orange',purple:'Violett',pink:'Rosé',green:'Grün',teal:'Türkis',indigo:'Indigo',red:'Rot'};
export const ICONS=['folder','file','book','star','tag','briefcase','receipt','calendar','shield','health','car','home','plane','paw'];
export const ICON_LABELS={folder:'Ordner',file:'Dokument',book:'Buch',star:'Stern',tag:'Etikett',briefcase:'Aktentasche',receipt:'Beleg',calendar:'Kalender',shield:'Schild',health:'Gesundheit',car:'Auto',home:'Haus',plane:'Reise',paw:'Tier'};

const CATEGORY_STORE='doc-org-categories-v1';
const PEOPLE_STORE='doc-org-people-v1';
const store=()=>{try{return globalThis.localStorage||null;}catch{return null;}};

// RULES keeps its object identity so every module sees added or removed categories.
export const RULES={};
let custom=[];
function rebuild(){for(const key of Object.keys(RULES))delete RULES[key];for(const [key,value] of Object.entries(DEFAULT_RULES))RULES[key]=value;for(const c of custom)RULES[c.name]={color:c.color,icon:c.icon,terms:c.terms,custom:true};}
rebuild();

const cleanName=name=>String(name??'').replace(/\s+/g,' ').trim().slice(0,40);
function sanitize(entry){
 const name=cleanName(entry?.name);
 if(!name||DEFAULT_RULES[name])return null;
 const terms={};
 if(entry.terms&&typeof entry.terms==='object')for(const [term,weight] of Object.entries(entry.terms)){const t=String(term).toLowerCase().trim();if(t)terms[t]=Number.isFinite(+weight)?Math.min(9,Math.max(1,+weight)):5;}
 return {name,color:COLORS.includes(entry.color)?entry.color:'indigo',icon:ICONS.includes(entry.icon)?entry.icon:'folder',terms};
}
export const customCategories=()=>custom.map(c=>({...c,terms:{...c.terms}}));
export const isCustom=name=>custom.some(c=>c.name===name);
export function loadCategories(){
 const s=store();if(!s)return;
 try{const raw=JSON.parse(s.getItem(CATEGORY_STORE)||'[]');custom=(Array.isArray(raw)?raw:[]).map(sanitize).filter(Boolean).slice(0,40);}catch{custom=[];}
 rebuild();
}
function persistCategories(){const s=store();if(s)s.setItem(CATEGORY_STORE,JSON.stringify(custom));rebuild();}
export function termsFromKeywords(keywords){
 const terms={};
 for(const word of String(keywords??'').split(/[,;\n]/).map(w=>w.toLowerCase().replace(/\s+/g,' ').trim()).filter(Boolean).slice(0,60))terms[word]=5;
 return terms;
}
export function addCategory({name,color,icon,keywords,terms}){
 const entry=sanitize({name,color,icon,terms:terms??termsFromKeywords(keywords)});
 if(!cleanName(name))throw new Error('Bitte einen Namen für die Kategorie eingeben.');
 if(!entry)throw new Error('Dieser Name ist bereits als Standardkategorie vergeben.');
 if(RULES[entry.name])throw new Error('Diese Kategorie gibt es bereits.');
 custom.push(entry);persistCategories();return entry.name;
}
export function removeCategory(name){
 if(!isCustom(name))throw new Error('Standardkategorien lassen sich nicht löschen.');
 custom=custom.filter(c=>c.name!==name);persistCategories();
}

export const FAMILY='Familie / gemeinsam';
export const UNCLEAR='Unklar';
export let PEOPLE=[];
export function setPeople(list){PEOPLE=[...new Set((Array.isArray(list)?list:[]).map(p=>String(p).replace(/\s+/g,' ').trim()).filter(p=>p&&p!==FAMILY&&p!==UNCLEAR))].slice(0,25);return PEOPLE;}
export function loadPeople(){const s=store();if(!s)return;try{setPeople(JSON.parse(s.getItem(PEOPLE_STORE)||'[]'));}catch{setPeople([]);}}
export function savePeople(list){setPeople(list);const s=store();if(s)s.setItem(PEOPLE_STORE,JSON.stringify(PEOPLE));return PEOPLE;}
export const personOptions=()=>[FAMILY,...PEOPLE,UNCLEAR];

export const normalize = t => t.toLowerCase().normalize('NFKC').replace(/ß/g,'ss').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function classify(text){
 const n=' '+normalize(text)+' ';
 const scores=Object.entries(RULES).map(([category,rule])=>{
  const hits=Object.entries(rule.terms).filter(([term])=>n.includes(' '+normalize(term)+' '));
  return {category,score:hits.reduce((s,[,w])=>s+w,0),hits:hits.map(([word,weight])=>({word,weight}))};
 }).sort((a,b)=>b.score-a.score);
 // Private health insurance can legitimately belong to both categories; Krankenkasse alone is Gesundheit.
 if(/\b(private krankenversicherung|zusatzversicherung|zahnzusatzversicherung)\b/.test(n)){
  const s=scores.find(s=>s.category==='Versicherung');
  if(s){s.score+=7;s.hits.push({word:'private / zusätzliche Krankenversicherung',weight:7});}
 }
 const people=PEOPLE.filter(p=>n.includes(' '+normalize(p)+' '));
 const nameHints=people.length?[]:PEOPLE.filter(p=>n.includes(' '+normalize(p.split(' ')[0])+' '));
 const surnames=[...new Set(PEOPLE.map(p=>p.split(' ').at(-1)).filter(s=>s&&s.length>1))];
 const family=surnames.some(s=>n.includes(' '+normalize('familie '+s)+' '));
 return {categories:scores.filter(s=>s.score>=4).map(s=>s.category),scores,people:people.length?people:family?[FAMILY]:[UNCLEAR],nameHints};
}
