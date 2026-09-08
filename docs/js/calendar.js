const escapeICS=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
function fold(line){let out='',n=0;for(const char of line){const len=new TextEncoder().encode(char).length;if(n+len>75){out+='\r\n ';n=1;}out+=char;n+=len;}return out;}
const stamp=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');

export function makeICS(doc,event){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(event.date||''))throw new Error('Bitte zuerst ein gültiges Datum eintragen.');
 if(!/^[a-zA-Z0-9-]+$/.test(event.id||''))throw new Error('Ungültige Kalenderkennung.');
 const validDate=new Date(event.date+'T12:00:00Z');if(Number.isNaN(+validDate)||validDate.toISOString().slice(0,10)!==event.date)throw new Error('Ungültiges Kalenderdatum.');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Doc-Org//DE','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${event.id}@doc-org.local`,`DTSTAMP:${stamp(new Date())}`];
 if(event.time){
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(event.time))throw new Error('Uhrzeit ist ungültig.');
  // Floating local time: intentionally no invented timezone conversion.
  const start=event.date.replaceAll('-','')+'T'+event.time.replace(':','')+'00';
  lines.push('DTSTART:'+start,'DURATION:PT30M');
 }else{
  const next=new Date(event.date+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);
  lines.push('DTSTART;VALUE=DATE:'+event.date.replaceAll('-',''),'DTEND;VALUE=DATE:'+next.toISOString().slice(0,10).replaceAll('-',''));
 }
 const description=[doc.title,event.kind==='payment'&&doc.amount?`Rechnungsbetrag: ${doc.amount} €`:'',event.estimated?'Zahlungsziel geschätzt – bitte im Dokument prüfen.':'',event.evidence].filter(Boolean).join('\n');
 lines.push('SUMMARY:'+escapeICS(event.title),'DESCRIPTION:'+escapeICS(description),'LOCATION:'+escapeICS(event.location));
 const days=Number(event.reminder);if(Number.isFinite(days)&&days>=0)lines.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+escapeICS(event.title),`TRIGGER:-P${days}D`,'END:VALARM');
 lines.push('END:VEVENT','END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';
}

// A file name the iOS calendar shows while importing.
export const icsName=event=>(String(event.title||'Termin').replace(/[^\p{L}\p{N} _-]/gu,'').replace(/\s+/g,'-').slice(0,60)||'Doc-Org-Termin')+'.ics';

// Share files when supported; otherwise offer a download.
export async function download(blob,name){
 const file=new File([blob],name,{type:blob.type});
 if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file]});return;}catch(e){if(e.name==='AbortError')return;}}
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}

// Apple Calendar has no browser API for inserting events. Pass structured data
// to the user's local Shortcut; never claim the event was saved by the browser.
export const shortcutName='Doc-Org Kalender';
export function calendarData(doc,event){
 makeICS(doc,event); // Reuse the existing strict date/time validation.
 const start=event.date+'T'+(event.time||'00:00')+':00';
 // UTC arithmetic here only adds 30 wall-clock minutes, including day rollover.
 const end=event.time?new Date(Date.parse(start+'Z')+30*60000).toISOString().slice(0,19):start;
 const reminder=Number(event.reminder);
 const reminderText=reminder<0?'Keine':reminder===0?'Am Termin':`${reminder} Tag(e) vorher`;
 return {
  title:event.kind==='payment'?'Zahlungstermin '+doc.title:event.title,
  start,end,allDay:!event.time,location:event.location||'',
  notes:[doc.title,doc.amount?`Rechnungsbetrag: ${doc.amount} €`:'',event.estimated?'Zahlungsziel geschätzt – bitte prüfen.':'',event.evidence,
   `Gewünschte Erinnerung: ${reminderText} (im Kalender prüfen/einstellen).`].filter(Boolean).join('\n'),
  reminderDays:reminder
 };
}
export function shortcutURL(doc,event){
 return 'shortcuts://run-shortcut?name='+encodeURIComponent(shortcutName)+'&input=text&text='+encodeURIComponent(JSON.stringify(calendarData(doc,event)));
}

export async function exportEvent(doc,event){
 const url=shortcutURL(doc,event);
 let dialog=document.getElementById('calendar-transfer');
 if(!dialog){
  dialog=document.createElement('dialog');dialog.id='calendar-transfer';
  dialog.setAttribute('aria-labelledby','calendar-transfer-title');
  dialog.innerHTML=`<div class="dialog-head"><h2 id="calendar-transfer-title">Zum iPhone-Kalender</h2><button type="button" class="icon-button" data-close aria-label="Schließen">✕</button></div>
   <div class="dialog-content"><p data-summary></p>
   <p>Der Button übergibt diesen Termin an deinen Kurzbefehl „Doc-Org Kalender“. Dort prüfst du die Angaben und bestätigst das Hinzufügen.</p>
   <a class="primary" data-shortcut>Termin auf dem iPhone übernehmen</a>
   <p class="hint">Einmalige Einrichtung erforderlich. Auf dem iPhone öffnen; auf anderen Geräten kannst du die Kalenderdatei verwenden.</p>
   <details><summary>Kurzbefehl einmalig einrichten</summary>
   <ol>
    <li>Öffne Apples App <strong>Kurzbefehle</strong>, erstelle mit + einen Kurzbefehl und nenne ihn genau <strong>Doc-Org Kalender</strong>.</li>
    <li>Füge <strong>Wörterbuch aus Eingabe abrufen</strong> hinzu. Wähle als Eingabe die Variable <strong>Kurzbefehleingabe</strong>.</li>
    <li>Füge für jeden Schlüssel <code>title</code>, <code>start</code>, <code>end</code>, <code>allDay</code>, <code>location</code> und <code>notes</code> eine Aktion <strong>Wörterbuchwert abrufen</strong> hinzu. Wähle jedes Mal das Wörterbuch aus Schritt 2 als Quelle. Benenne die jeweilige Ergebnisvariable wie ihren Schlüssel.</li>
    <li>Wandle <code>start</code> und <code>end</code> jeweils mit <strong>Datumsangaben aus Eingabe abrufen</strong> in ein Datum um. Nenne die Ergebnisse <strong>Beginn</strong> und <strong>Ende</strong>.</li>
    <li>Füge eine <strong>Wenn</strong>-Aktion hinzu: <code>allDay</code> ist wahr (bzw. 1). Füge in beide Zweige <strong>Neues Ereignis hinzufügen</strong> ein: Titel = <code>title</code>, Start = <strong>Beginn</strong>, Ende = <strong>Ende</strong>. Unter „Mehr anzeigen“ setzt du Ort = <code>location</code>, Notizen = <code>notes</code> und wählst deinen Kalender. Im Wahr-Zweig <strong>Ganztägig einschalten</strong>, im Sonst-Zweig ausschalten.</li>
    <li>Lasse bei beiden Kalenderaktionen <strong>Beim Ausführen anzeigen</strong> eingeschaltet. Bestätige beim ersten Start den Kalenderzugriff. Die gewünschte Erinnerung steht in den Notizen; stelle sie im Kalenderdialog ein.</li>
   </ol>
   <p>Die Bezeichnungen können je nach iOS-Version leicht abweichen. Ohne Uhrzeit wird ein ganztägiger Termin angelegt, mit Uhrzeit ein Termin von 30 Minuten. Erneutes Hinzufügen kann einen zweiten Eintrag erzeugen.</p>
   <p><a href="https://support.apple.com/de-de/guide/shortcuts/apd624386f42/ios" target="_blank" rel="noopener">Apple-Anleitung zur Übergabe an Kurzbefehle</a></p></details>
   <p data-error class="error" role="alert" hidden></p>
   </div><div class="dialog-foot"><button type="button" class="secondary" data-file>Alternativ: Kalenderdatei</button><button type="button" class="secondary" data-close>Schließen</button></div>`;
  document.body.append(dialog);
  dialog.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>dialog.close());
  dialog.addEventListener('close',()=>{dialog.querySelector('[data-shortcut]').removeAttribute('href');dialog.querySelector('[data-summary]').textContent='';dialog.querySelector('[data-file]').onclick=null;});
 }
 dialog.querySelector('[data-summary]').textContent=`${calendarData(doc,event).title} · ${event.date.split('-').reverse().join('.')} · ${event.time||'Ganztägig'}`;
 dialog.querySelector('[data-shortcut]').href=url;
 dialog.querySelector('[data-error]').hidden=true;
 dialog.querySelector('[data-file]').onclick=async()=>{
  try{await download(new Blob([makeICS(doc,event)],{type:'text/calendar;charset=utf-8'}),icsName(event));}
  catch(e){const el=dialog.querySelector('[data-error]');el.textContent=e.message;el.hidden=false;}
 };
 if(!dialog.open)dialog.showModal();
}
