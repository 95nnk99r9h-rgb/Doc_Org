import {test} from 'node:test';import assert from 'node:assert/strict';
import {classify,setPeople,addCategory,removeCategory,RULES,isCustom} from '../docs/js/rules.js';
import {analyze,readAmount,titleFrom} from '../docs/js/analysis.js';
import {makeICS} from '../docs/js/calendar.js';

// The person list lives on the device, so tests set one explicitly.
setPeople(['Denise Muster','Lukas Muster','Carlo Muster','Theo Muster','Milo Muster']);
const RECEIVED='2026-09-08';
const run=text=>analyze(text,{received:RECEIVED});

test('Gebäudeversicherung has two categories',()=>{const r=classify('Versicherungsschein Wohngebäudeversicherung Lukas Muster');assert.ok(r.categories.includes('Gebäude'));assert.ok(r.categories.includes('Versicherung'));assert.deepEqual(r.people,['Lukas Muster']);});
test('Doctor invoice overlaps health and invoice',()=>{const r=classify('Rechnungsnummer 123 Arztpraxis Kinderarzt Patient Theo Muster');assert.ok(r.categories.includes('Rechnungen'));assert.ok(r.categories.includes('Gesundheit'));assert.deepEqual(r.people,['Theo Muster']);});
test('Surname alone and embedded first name do not identify a person',()=>{assert.deepEqual(classify('Muster Theorie').people,['Unklar']);assert.deepEqual(classify('Theo').people,['Unklar']);assert.deepEqual(classify('Theo').nameHints,['Theo Muster']);});
test('Family and multiple people',()=>{assert.deepEqual(classify('Familie Muster').people,['Familie / gemeinsam']);assert.deepEqual(classify('Denise Muster und Lukas Muster').people,['Denise Muster','Lukas Muster']);});
test('Keyword repetition does not inflate score',()=>{assert.equal(classify('IBAN '.repeat(20)).categories.includes('Rechnungen'),false);});
test('Krankenkasse belongs to Gesundheit',()=>assert.deepEqual(classify('Krankenkasse').categories,['Gesundheit']));
test('Car insurance overlaps',()=>{const cats=classify('Kfz-Versicherung Teilkasko').categories;assert.ok(cats.includes('Auto')&&cats.includes('Versicherung'));});

test('Manuals are recognised as Anleitungen',()=>{
 const cats=classify('Bedienungsanleitung Waschmaschine – Inbetriebnahme und Sicherheitshinweise').categories;
 assert.ok(cats.includes('Anleitungen'));
});
test('Categories can be created and removed at runtime',()=>{
 const name=addCategory({name:'Schule',color:'indigo',icon:'book',keywords:'Zeugnis, Elternabend'});
 assert.equal(name,'Schule');assert.ok(isCustom('Schule'));
 assert.ok(classify('Einladung zum Elternabend mit Zeugnis').categories.includes('Schule'));
 assert.throws(()=>addCategory({name:'Schule'}),/gibt es bereits/);
 assert.throws(()=>removeCategory('Rechnungen'),/Standardkategorien/);
 removeCategory('Schule');
 assert.equal(RULES.Schule,undefined);
});

test('Titel: ausdrücklicher Betreff hat Vorrang',()=>{
 assert.equal(titleFrom('Stadtwerke Musterstadt GmbH\nMusterstrasse 1\n\nBetreff: Jahresabrechnung Strom 2026\n\nSehr geehrte Damen und Herren'),'Jahresabrechnung Strom 2026');
});
test('Titel: Dokumentart und Absender werden verbunden',()=>{
 assert.equal(titleFrom('MUSTERDOKUMENT\n\nArztpraxis Beispiel\nRechnungsnummer: 1\nRechnungsbetrag: 10,00 EUR'),'Rechnung – Arztpraxis Beispiel');
 assert.equal(titleFrom('Bedienungsanleitung\nWaschmaschine WM 4000\nMuster Haustechnik GmbH'),'Bedienungsanleitung – Muster Haustechnik GmbH');
 assert.equal(titleFrom('Allianz Versicherung AG\n\nVersicherungsschein Nr. 4711'),'Versicherungsschein – Allianz Versicherung AG');
});
test('Titel: Anrede, Seitenzahlen und leerer Text ergeben keinen Titel',()=>{
 assert.equal(titleFrom(''),'');
 assert.equal(titleFrom('\n  \n12.09.2026\n'),'');
 assert.equal(titleFrom('Seite 1\nTelefon: 030 123456\nIBAN DE00 1234'),'');
 assert.equal(titleFrom('Sehr geehrte Frau Muster,\nQuartalsbericht 2026 liegt bei'),'Quartalsbericht 2026 liegt bei');
});
test('Invoice date is not due date',()=>{
 const r=run('Rechnung\nRechnungsdatum: 08.09.2026\nRechnungsbetrag: 123,45 EUR\nZahlbar bis 22.09.2026');
 assert.equal(r.events.length,1);assert.equal(r.events[0].date,'2026-09-22');assert.equal(r.amount,'123,45');
 assert.equal(r.events[0].time,'');assert.equal(r.events[0].kind,'payment');assert.equal(r.events[0].estimated,false);
});
test('Amount labels, thousands separators and trailing currency',()=>{
 assert.equal(readAmount('Gesamtbetrag 1.234,50 EUR').amount,'1.234,50');
 assert.equal(readAmount('Zu zahlender Betrag: € 89,00').amount,'89,00');
 assert.equal(readAmount('Rechnungsbetrag netto 100,00 EUR\nGesamtbetrag 119,00 EUR').amount,'119,00');
 assert.equal(readAmount('Ihr Termin am 16.09.2026').amount,'');
});
test('Unlabelled amounts are only used for invoices and are flagged',()=>{
 const r=run('Rechnung\nÜberweisen Sie 250,00 EUR auf das Konto\nZahlbar bis 22.09.2026');
 assert.equal(r.amount,'250,00');
 assert.ok(r.warnings.some(w=>w.includes('ohne eindeutige Beschriftung')));
 assert.equal(analyze('Ihr Termin am 16.09.2026, Parkgebühr 3,50 EUR',{received:RECEIVED}).amount,'');
});
test('A recognised invoice always gets a payment date',()=>{
 const r=run('Rechnung\nRechnungsnummer 4711\nRechnungsdatum 08.09.2026\nRechnungsbetrag 60,00 EUR');
 const payment=r.events.find(e=>e.kind==='payment');
 assert.ok(payment);assert.equal(payment.date,'2026-09-22');assert.equal(payment.estimated,true);
 assert.ok(r.warnings.some(w=>w.includes('Kein Zahlungsziel')));
});
test('Without an invoice date the due date is derived from the received date',()=>{
 const payment=run('Rechnung\nRechnungsnummer 4711\nRechnungsbetrag 60,00 EUR').events.find(e=>e.kind==='payment');
 assert.equal(payment.date,'2026-09-22');assert.equal(payment.estimated,true);
});
test('Payment terms given as a period',()=>{
 assert.equal(run('Rechnungsdatum 29.12.2026\nZahlbar innerhalb von 14 Tagen nach Rechnungsdatum').events[0].date,'2027-01-12');
 assert.equal(run('Rechnung\nRechnungsdatum 01.09.2026\nZahlungsziel: 30 Tage').events[0].date,'2026-10-01');
 assert.equal(run('Rechnung\nRechnungsdatum 01.09.2026\n14 Tage netto').events[0].date,'2026-09-15');
});
test('Non-invoice documents get no payment date',()=>{
 assert.equal(run('Ihr Termin am 16.09.2026 um 09:30 Uhr').events.filter(e=>e.kind==='payment').length,0);
});
test('Date is never parsed as time',()=>assert.equal(run('Ihr Termin am 16.09.2026').events[0].time,''));
test('Medical appointment exact time',()=>{const e=run('Ihr Termin am 16.09.2026 um 09:30 Uhr').events[0];assert.equal(e.time,'09:30');assert.equal(e.date,'2026-09-16');});
test('Whole hour and dot-form time',()=>{assert.equal(run('Ihr Termin am 16.09.2026 um 9 Uhr').events[0].time,'09:00');assert.equal(run('Ihr Termin am 16.09.2026 um 9.30 Uhr').events[0].time,'09:30');});
test('Invalid date is never guessed',()=>{const r=run('Zahlbar bis 31.02.2026');assert.equal(r.events.length,0);assert.ok(r.warnings.some(w=>w.includes('ohne eindeutig lesbares Datum')));});
test('Receipt date cannot be inferred',()=>{const r=run('Zahlbar innerhalb von 14 Tagen nach Erhalt');assert.equal(r.events.length,0);assert.ok(r.warnings.some(w=>w.includes('Empfangsdatum')));});
test('Lastschrift gives payment warning',()=>assert.ok(run('Rechnung Zahlbar bis 22.09.2026\nLastschrift').warnings.some(w=>w.includes('Lastschrifteinzug'))));
test('Cancellation does not create an appointment',()=>assert.equal(run('Ihr Termin am 12.09.2026 wurde storniert').events.length,0));

test('ICS needs a valid date but no confirmation step',()=>{
 assert.throws(()=>makeICS({title:'x'},{id:'abc',date:''}),/Datum/);
 assert.ok(makeICS({title:'x'},{id:'abc',date:'2026-09-20',title:'Zahlungstermin x',reminder:3}).includes('BEGIN:VEVENT'));
});
test('ICS all-day exclusive end and stable UID',()=>{const e={id:'abc',date:'2026-12-31',title:'Zahlungstermin Rechnung',reminder:3};const s=makeICS({title:'Test'},e);assert.ok(s.includes('DTEND;VALUE=DATE:20270101'));assert.ok(s.includes('UID:abc@doc-org.local'));assert.ok(s.includes('TRIGGER:-P3D'));});
test('ICS carries the invoice amount for payment events',()=>{
 const s=makeICS({title:'Stromrechnung',amount:'123,45'},{id:'abc',kind:'payment',date:'2026-09-22',title:'Zahlungstermin Stromrechnung',reminder:3});
 assert.ok(s.includes('SUMMARY:Zahlungstermin Stromrechnung'));
 assert.ok(s.replace(/\r\n /g,'').includes('Rechnungsbetrag: 123\\,45'));
});
test('ICS time, escaping, no phantom fields, UTF-8 folding',()=>{const s=makeICS({title:'Ä'.repeat(100)},{id:'x',date:'2026-09-16',time:'09:30',title:'Test, Ort;\nEND:VEVENT',reminder:-1});assert.ok(s.includes('DTSTART:20260916T093000'));assert.ok(s.includes('SUMMARY:Test\\, Ort\\;\\nEND:VEVENT'));assert.ok(!s.includes('BEGIN:VALARM'));for(const line of s.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);});
