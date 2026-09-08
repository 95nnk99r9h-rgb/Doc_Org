import {classify} from './rules.js';

const datePattern='(\\d{1,2})[.\\/]\\s*(\\d{1,2})[.\\/]\\s*(\\d{4}|\\d{2})(?!\\d)';
const AMOUNT='(\\d{1,3}(?:[.\\u00a0 ]\\d{3})*,\\d{2}|\\d+,\\d{2})';
// Ordered by specificity: the first label that appears with an amount wins.
const AMOUNT_LABELS=['rechnungsbetrag','rechnungssumme','gesamtbetrag','gesamtsumme','gesamtpreis','endbetrag','zahlbetrag','zahlungsbetrag','zu zahlender betrag','offener betrag','offene forderung','f(?:ä|ae)lliger betrag','bruttobetrag','gesamt brutto','brutto','zu zahlen','endsumme','rechnungstotal','betrag'];
const PAYMENT_PHRASE=/(zahlbar bis|zahlbar am|zahlungsziel|zahlungstermin|zahlungsfrist|f(?:ä|ae)llig (?:am|bis|zum)|f(?:ä|ae)lligkeit(?:sdatum)?|sp(?:ä|ae)testens (?:am|bis|zum)|zahlung(?:seingang)? bis|zu zahlen bis|(?:bitte )?(?:überweisen|ueberweisen) sie.{0,40}bis|begleichen sie.{0,40}bis|eingang des betrages bis)/i;
const APPOINTMENT_PHRASE=/(termin|wiedervorstellung|bitte erscheinen)/i;
const APPOINTMENT_BLOCK=/(vereinbaren|absagen|absage|stornier|verschoben|verlegt|zahlungs|liefertermin)/i;
const INVOICE_DATE=/(rechnungsdatum|rechnungsstellung|datum der rechnung|belegdatum)/i;

function iso(d,m,y){y=+y<100?2000+(+y):+y;const dt=new Date(Date.UTC(y,+m-1,+d));return dt.getUTCFullYear()===y&&dt.getUTCMonth()===+m-1&&dt.getUTCDate()===+d?`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`:null;}
function dates(text){return [...text.matchAll(new RegExp(datePattern,'g'))].map(m=>({date:iso(m[1],m[2],m[3]),index:m.index,raw:m[0]})).filter(x=>x.date);}
function addDays(date,days){const dt=new Date(date+'T12:00:00Z');dt.setUTCDate(dt.getUTCDate()+Number(days));return dt.toISOString().slice(0,10);}
const isDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v);

// Reads the invoice total. Labelled amounts are preferred; otherwise the largest
// amount that is explicitly marked as euro is used and flagged for review.
const value=s=>Number(s.replace(/[.  ]/g,'').replace(',','.'));
const tidy=s=>s.replace(/[.  ](?=\d{3})/g,'.');
const largest=list=>list.reduce((a,b)=>value(b)>value(a)?b:a);
export function readAmount(text){
 // Labelled amounts win. Where an invoice lists net and gross under labels, the
 // larger one is the amount actually payable.
 const labelled=[];
 for(const label of AMOUNT_LABELS)for(const m of text.matchAll(new RegExp(label+'[^\\n\\d]{0,40}?(?:EUR|€)?\\s*'+AMOUNT+'\\s*(?:EUR|€)?','gi')))labelled.push(tidy(m[1]));
 if(labelled.length)return {amount:largest(labelled),certain:true};
 const marked=[...text.matchAll(new RegExp('(?:EUR|€)\\s*'+AMOUNT+'|'+AMOUNT+'\\s*(?:EUR|€)','gi'))].map(m=>tidy(m[1]||m[2]));
 return marked.length?{amount:largest(marked),certain:false}:{amount:'',certain:true};
}

// Dokumenttitel aus dem erkannten Text. Reihenfolge: ausdrücklicher Betreff,
// sonst Dokumentart plus Absender, sonst die erste brauchbare Überschrift.
const SUBJECT=/^\s*(?:betreff|betrifft|thema)\s*:?\s+(.{3,90})$/i;
const DOC_TYPES=[
 [/bedienungsanleitung|gebrauchsanweisung|gebrauchsanleitung|betriebsanleitung/i,'Bedienungsanleitung'],
 [/montageanleitung|aufbauanleitung|installationsanleitung/i,'Montageanleitung'],
 [/benutzerhandbuch|bedienungshandbuch|anwenderhandbuch|handbuch/i,'Handbuch'],
 [/zahlungserinnerung/i,'Zahlungserinnerung'],[/\bmahnung/i,'Mahnung'],
 [/nebenkostenabrechnung|betriebskostenabrechnung/i,'Nebenkostenabrechnung'],
 [/beitragsrechnung/i,'Beitragsrechnung'],[/\bgutschrift/i,'Gutschrift'],
 [/heil\s*und\s*kostenplan/i,'Heil- und Kostenplan'],[/\brechnung/i,'Rechnung'],
 [/terminbest(?:ä|ae)tigung/i,'Terminbestätigung'],[/terminvereinbarung|ihr termin|nächster termin/i,'Termin'],
 [/versicherungsschein|versicherungspolice/i,'Versicherungsschein'],
 [/zulassungsbescheinigung/i,'Zulassungsbescheinigung'],[/hauptuntersuchung/i,'Hauptuntersuchung'],
 [/entlassungsbericht/i,'Entlassungsbericht'],[/laborbericht/i,'Laborbericht'],[/\bbefund/i,'Befund'],
 [/\bbescheid/i,'Bescheid'],[/k(?:ü|ue)ndigung/i,'Kündigung'],[/\bmietvertrag/i,'Mietvertrag'],
 [/\bvertrag/i,'Vertrag'],[/\bangebot/i,'Angebot'],[/lieferschein/i,'Lieferschein'],[/\bkontoauszug/i,'Kontoauszug']
];
const SENDER=/(gmbh|mbh|\bag\b|\bkg\b|\bse\b|e\.?\s?v\.?|stadtwerke|versicherung|praxis|klinik|krankenhaus|apotheke|kanzlei|finanzamt|sparkasse|\bbank\b|energie|werkstatt|autohaus|hausverwaltung|krankenkasse)/i;
const NOISE=/^[\s\d.,:/–-]*$/;
const clean=line=>line.replace(/\s+/g,' ').trim().replace(/^[-–•*]+\s*/,'').replace(/[.,;:]+$/,'');
const GREETING=/^(?:sehr geehrte|hallo|guten (?:tag|morgen|abend)|liebe[rs]?\b|moin|servus|anlage[n]?\b|seite\b|mit freundlichen|ihr[e]? \w+team)/i;
const usable=line=>line.length>=5&&line.length<=80&&/\p{L}{3}/u.test(line)&&!NOISE.test(line)&&!GREETING.test(line)&&!/^\s*(?:tel|telefon|fax|e-?mail|iban|bic|ust|steuernummer|kundennummer)\b/i.test(line);

export function titleFrom(text){
 const lines=String(text??'').split(/\n/).map(clean).filter(Boolean);
 for(const line of lines.slice(0,40)){const m=line.match(SUBJECT);if(m&&usable(clean(m[1])))return clean(m[1]).slice(0,90);}
 const head=lines.slice(0,30).join('\n');
 const type=DOC_TYPES.find(([pattern])=>pattern.test(head))?.[1]||'';
 const sender=lines.slice(0,15).find(line=>SENDER.test(line)&&usable(line)&&line.length<=60);
 if(type&&sender)return `${type} – ${sender}`.slice(0,90);
 if(type)return type;
 if(sender)return sender.slice(0,90);
 return (lines.slice(0,12).find(usable)||'').slice(0,90);
}

export function analyze(text,options={}){
 const classification=classify(text), events=[], warnings=[];
 const received=isDate(options.received)?options.received:new Date().toISOString().slice(0,10);
 const isInvoice=classification.categories.includes('Rechnungen');
 const detected=readAmount(text);
 // Unlabelled amounts are only adopted for documents that are actually invoices.
 const amount=(detected.certain||isInvoice)?detected.amount:'';
 if(amount&&!detected.certain)warnings.push('Rechnungsbetrag ohne eindeutige Beschriftung übernommen: bitte prüfen.');
 const lines=text.split(/\n/);
 let paymentSeen=false;

 for(let i=0;i<lines.length;i++){
  const line=lines[i], context=line+' '+(lines[i+1]||'');
  const payment=PAYMENT_PHRASE.test(line);
  const appointment=APPOINTMENT_PHRASE.test(line)&&!APPOINTMENT_BLOCK.test(line);
  if(!payment&&!appointment)continue;
  if(payment)paymentSeen=true;
  const found=dates(context);
  if(!found.length){warnings.push('Termin oder Zahlungsziel ohne eindeutig lesbares Datum: bitte manuell ergänzen.');continue;}
  const date=found[0].date;
  const suffix=context.slice(found[0].index+found[0].raw.length);
  const tm=suffix.match(/(?:um\s+)?\b([01]?\d|2[0-3]):([0-5]\d)\s*(?:uhr)?/i)||suffix.match(/\b([01]?\d|2[0-3])\.([0-5]\d)\s*uhr\b/i);
  const whole=suffix.match(/\bum\s+([01]?\d|2[0-3])\s*uhr\b/i);
  const time=tm?`${tm[1].padStart(2,'0')}:${tm[2]}`:whole?`${whole[1].padStart(2,'0')}:00`:'';
  const kind=payment?'payment':'appointment';
  if(!events.some(e=>e.kind===kind&&e.date===date))events.push(makeEvent({kind,date,time:kind==='appointment'?time:'',evidence:context.trim()}));
  if(found.length>1)warnings.push('Mehrere Datumsangaben im Terminabschnitt: Datum bitte prüfen.');
 }

 // Payment terms given as a period instead of a date.
 const relative=text.match(/(?:zahlbar\s+)?(?:innerhalb\s+(?:von\s+)?|binnen\s+)(\d{1,3})\s*(?:kalender|werk)?tagen?\s*(?:nach|ab)?\s*(rechnungsdatum|rechnungsstellung|rechnungseingang|erhalt|zugang|lieferung)?/i)
  ||text.match(/zahlungsziel\s*:?\s*(\d{1,3})\s*(?:kalender|werk)?tage/i)
  ||text.match(/(?:netto\s*(\d{1,3})\s*tage|(?:^|\s)(\d{1,3})\s*tage\s*netto)/i);
 if(relative&&!events.some(e=>e.kind==='payment')){
  paymentSeen=true;
  const days=Number(relative[1]||relative[2]);
  const reference=(relative[2]&&/erhalt|zugang|lieferung/i.test(relative[2]))?'receipt':'invoice';
  const baseLine=lines.find(l=>INVOICE_DATE.test(l)&&dates(l).length);
  if(reference==='receipt'&&!baseLine)warnings.push('Frist ab Erhalt/Zugang: tatsächliches Empfangsdatum ist erforderlich; bitte Zahlungsziel manuell eintragen.');
  else if(Number.isFinite(days)&&days>0&&days<=365){
   const base=baseLine?dates(baseLine)[0].date:received;
   if(!baseLine)warnings.push('Kein Rechnungsdatum gefunden: Zahlungsziel ab Eingangsdatum berechnet. Bitte prüfen.');
   events.push(makeEvent({kind:'payment',date:addDays(base,days),estimated:!baseLine,evidence:relative[0].trim()+(baseLine?'; '+baseLine.trim():'')}));
  }
 }

 // A recognised invoice always gets a payment date, even when the document does not name one.
 if(isInvoice&&!events.some(e=>e.kind==='payment')&&!paymentSeen){
  const baseLine=lines.find(l=>INVOICE_DATE.test(l)&&dates(l).length);
  const base=baseLine?dates(baseLine)[0].date:received;
  events.push(makeEvent({kind:'payment',date:addDays(base,14),estimated:true,evidence:'Kein Zahlungsziel im Text gefunden · 14 Tage ab '+(baseLine?'Rechnungsdatum':'Eingang')+' angenommen'}));
  warnings.push('Kein Zahlungsziel im Dokument gefunden: 14 Tage angenommen. Bitte Datum prüfen.');
 }
 if(isInvoice&&!amount)warnings.push('Kein Rechnungsbetrag erkannt: bitte manuell eintragen.');

 if(/lastschrift|wird.{0,30}abgebucht|ziehen wir.{0,30}ein/i.test(text))warnings.push('Möglicher Lastschrifteinzug: vor einer Überweisung Zahlungsweise prüfen.');
 if(classification.nameHints.length)warnings.push('Nur Vorname gefunden: mögliche Person '+classification.nameHints.join(', ')+'. Bitte bestätigen.');
 if(!classification.categories.length)warnings.push('Keine eindeutige Kategorie erkannt. Bitte auswählen.');
 return {...classification,amount,events,warnings:[...new Set(warnings)]};
}

function makeEvent({kind,date,time='',estimated=false,evidence=''}){
 return {id:crypto.randomUUID(),kind,date,time,title:kind==='payment'?'Zahlungstermin':'Termin',location:'',reminder:kind==='payment'?3:1,evidence,estimated,confirmed:true};
}
