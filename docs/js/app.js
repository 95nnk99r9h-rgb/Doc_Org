import {RULES,COLORS,COLOR_LABELS,ICONS,ICON_LABELS,PEOPLE,personOptions,loadCategories,loadPeople,addCategory,removeCategory,savePeople,FAMILY,UNCLEAR} from './rules.js';
import {analyze,titleFrom} from './analysis.js';
import {extract} from './ocr.js';
import * as storage from './storage.js';
import {download,exportEvent} from './calendar.js';
import {buildPreview,renderPage} from './preview.js';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={folder:'M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z',calendar:'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Zm3 10h2m4 0h2m-8 3h2',receipt:'M5 3h14v19l-3-2-4 2-4-2-3 2V3Zm4 5h6m-6 4h6m-6 4h3',shield:'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6L12 2Zm-4 10 3 3 5-6',health:'M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z',car:'m4 10 2-6h12l2 6M3 10h18v9H3v-9Zm2 9v3m14-3v3M6 14h2m8 0h2',home:'m2 11 10-9 10 9M5 9v12h14V9M9 21v-8h6v8',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',lock:'M6 10h12v11H6V10Zm2 0V6a4 4 0 0 1 8 0v4m-4 5v2',plus:'M12 4v16M4 12h16',minus:'M4 12h16',clock:'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',filter:'M3 6h18M6 12h12m-8 6h4',scan:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 8h10M7 12h10M7 16h6',camera:'M8 5l2-3h4l2 3h5v16H3V5h5Zm8 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0',check:'m5 12 4 4L19 6',file:'M6 2h8l5 5v15H6V2Zm8 0v6h5M9 12h7m-7 4h7',book:'M5 3h14v18H7a2 2 0 0 1-2-2V3Zm0 14h14M9 7h6',star:'m12 3 2.6 5.6 6.1.7-4.6 4.2 1.3 6-5.4-3-5.4 3 1.3-6L3.3 9.3l6.1-.7L12 3Z',tag:'M3 3h8l10 10-8 8L3 11V3Zm4.5 4.5h.01',briefcase:'M3 8h18v12H3V8Zm6 0V5h6v3M3 13h18',plane:'M2.5 13 21 5l-7.5 15-2.6-6.4L2.5 13Z',paw:'M12 13.5c2.8 0 4.8 1.9 4.8 3.8a2.7 2.7 0 0 1-2.7 2.7H9.9a2.7 2.7 0 0 1-2.7-2.7c0-1.9 2-3.8 4.8-3.8ZM6 10.5a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Zm12 0a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8ZM9.8 7.3a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Zm4.4 0a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z',left:'m15 5-7 7 7 7',right:'m9 5 7 7-7 7',expand:'M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5'};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.file}"/></svg>`;
const drawIcons=root=>root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
drawIcons(document);

loadCategories();loadPeople();
let docs=[],category='all',view='documents',upcomingOnly=false,draft=null,pending=[],busy=false,editing=false,baseline='',viewerDoc=null;

const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const fmt=d=>d?new Date(d+'T12:00:00').toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}):'–';
const upcoming=e=>{const days=(new Date(e.date+'T12:00:00')-new Date(today()+'T12:00:00'))/864e5;return days>=0&&days<7;};
const nearest=d=>(d.events||[]).filter(e=>e.date).sort((a,b)=>a.date.localeCompare(b.date))[0];
const isInvoice=d=>d.categories.includes('Rechnungen');
const statusLabel=d=>d.status==='done'?(isInvoice(d)?'Bezahlt':'Erledigt'):'Offen';
const pageCount=d=>{const n=d.pages||d.attachments.length;return `${n} ${n===1?'Seite':'Seiten'}`;};
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,5500);}
function error(e){$('editor-error').textContent=e.message||String(e);$('editor-error').hidden=false;}
try{docs=storage.load();}catch(e){toast('Lokale Daten konnten nicht gelesen werden: '+e.message);}

function personFilterOptions(){const sel=$('person-filter'),current=sel.value;sel.innerHTML='<option value="all">Alle Personen</option>'+personOptions().map(p=>`<option>${esc(p)}</option>`).join('');sel.value=[...sel.options].some(o=>o.value===current)?current:'all';}
personFilterOptions();
function badges(categories){return categories.map(c=>`<span class="badge ${RULES[c]?.color||'slate'}">${esc(c)}</span>`).join('');}

function render(){
 if(category!=='all'&&!RULES[category])category='all';
 personFilterOptions();
 $('stat-all').textContent=docs.length;$('all-count').textContent=docs.length;$('stat-open').textContent=docs.filter(d=>d.status==='open').length;$('stat-upcoming').textContent=docs.filter(d=>d.status==='open').flatMap(d=>d.events||[]).filter(e=>e.date&&upcoming(e)).length;
 $('category-nav').innerHTML=Object.entries(RULES).map(([c,r])=>`<button class="nav-item ${category===c?'selected':''}" data-category="${esc(c)}" aria-pressed="${category===c}"><span class="category-icon ${r.color}">${icon(r.icon)}</span>${esc(c)}<span class="count">${docs.filter(d=>d.categories.includes(c)).length}</span></button>`).join('');
 $('category-chips').innerHTML=['all',...Object.keys(RULES)].map(c=>`<button class="chip ${category===c?'selected':''}" data-category="${esc(c)}" aria-pressed="${category===c}">${c==='all'?icon('folder'):icon(RULES[c].icon)}${c==='all'?'Alle Kategorien':esc(c)}</button>`).join('')+`<button class="chip manage-categories" type="button">${icon('plus')}Kategorie</button>`;
 const title=view==='deadlines'?'Termine & Fristen':category==='all'?'Alle Dokumente':category;
 $('breadcrumb').textContent=title;$('list-title').textContent=title;$('page-title').innerHTML=view==='deadlines'?'Das steht an<span>.</span>':'Deine Dokumente<span>.</span>';$('page-subtitle').textContent=view==='deadlines'?'Offene Zahlungsziele und Termine im Blick.':'Weniger Papierkram. Mehr Überblick.';
 document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('selected',b.dataset.view===view);b.setAttribute('aria-current',b.dataset.view===view?'page':'false');});
 let result=docs.filter(d=>(category==='all'||d.categories.includes(category))&&($('status-filter').value==='all'||d.status===$('status-filter').value)&&($('person-filter').value==='all'||d.people.includes($('person-filter').value))&&(!$('date-from').value||d.received.slice(0,10)>=$('date-from').value)&&(!$('date-to').value||d.received.slice(0,10)<=$('date-to').value)&&(!upcomingOnly||(d.status==='open'&&d.events.some(e=>e.date&&upcoming(e)))));
 const q=$('search').value.trim().toLocaleLowerCase('de');if(q)result=result.filter(d=>[d.title,d.text,...d.people].join(' ').toLocaleLowerCase('de').includes(q));
 result.sort((a,b)=>$('sort').value==='due'?(nearest(a)?.date||'9999').localeCompare(nearest(b)?.date||'9999'):$('sort').value==='old'?a.received.localeCompare(b.received):b.received.localeCompare(a.received));
 if(view==='deadlines'){
  // Finished documents are done: they no longer appear under deadlines.
  const open=result.filter(d=>d.status==='open');
  $('results-count').textContent=`${open.length} ${open.length===1?'Dokument':'Dokumente'}`;
  const events=open.flatMap(d=>(d.events||[]).filter(e=>e.date&&(!upcomingOnly||upcoming(e))).map(e=>({d,e}))).sort((a,b)=>a.e.date.localeCompare(b.e.date));
  $('document-list').innerHTML=events.length?events.map(deadlineRow).join(''):empty('Hier ist gerade nichts offen.','Offene Termine und Zahlungsziele erscheinen hier. Erledigte Dokumente werden ausgeblendet.',false);
 }else{
  $('results-count').textContent=`${result.length} ${result.length===1?'Dokument':'Dokumente'}`;
  $('document-list').innerHTML=result.length?listHead+result.map(docRow).join(''):empty(docs.length?'Keine passenden Dokumente.':'Dein Papierkram bekommt ein Zuhause.',docs.length?'Passe die Filter an, um weitere Dokumente zu sehen.':'Fotografiere deinen ersten Brief oder lade ein PDF hoch. Doc-Org schlägt die passende Ablage vor.',!docs.length);
 }
}
function doneButton(d){return `<button type="button" class="done-button" data-done="${esc(d.id)}">${icon('check')}${isInvoice(d)?'Bezahlt':'Erledigt'}</button>`;}
// Kopfzeile der Übersicht: benennt die Spalten, die darunter untereinander stehen.
const listHead='<div class="list-head" aria-hidden="true"><span class="head-spacer"></span><span class="head-cols"><span>Dokument</span><span>Kategorien</span><span class="received-col">Eingang</span><span>Nächste Frist</span></span><span class="head-actions">Stand</span></div>';
function docRow(d){
 const due=nearest(d),open=d.status==='open';
 return `<div class="doc-row"><button type="button" class="file-icon" data-view-file="${esc(d.id)}" title="Dateivorschau öffnen" aria-label="Dateivorschau für ${esc(d.title)} öffnen">${icon('file')}</button><button class="doc-open" data-document="${esc(d.id)}"><span class="doc-main"><span class="doc-title">${esc(d.title)}</span><span class="doc-meta">${pageCount(d)}${d.amount?' · '+esc(d.amount)+' €':''} · ${esc(d.people.join(', '))}</span></span><span class="badges">${badges(d.categories)}</span><span class="row-date received-col"><small>Eingang</small>${fmt(d.received.slice(0,10))}</span><span class="row-date ${due&&open?(due.date<today()?'overdue':'due'):''}"><small>${due?(due.estimated?'Frist geschätzt':due.kind==='payment'?'Zahlungsziel':'Termin'):'Keine Frist'}</small>${due?fmt(due.date):'–'}</span></button><span class="row-actions"><span class="status ${esc(d.status)}">${statusLabel(d)}</span>${open?doneButton(d):'<span class="action-slot"></span>'}</span></div>`;
}
function deadlineRow({d,e}){
 return `<div class="deadline-row"><button class="deadline-open" data-document="${esc(d.id)}"><span class="deadline-date"><strong>${Number(e.date.slice(8))}</strong>${esc(new Date(e.date+'T12:00:00').toLocaleDateString('de-DE',{month:'short'}))}</span><span class="deadline-info"><strong class="doc-title">${esc(e.title)}</strong><small>${esc(d.title)} · ${fmt(e.date)}${e.time?' · '+esc(e.time)+' Uhr':''}${e.kind==='payment'&&d.amount?' · '+esc(d.amount)+' €':''}</small><span class="badges">${badges(d.categories)}<span class="badge ${e.date<today()?'red':e.estimated?'amber':e.kind==='payment'?'orange':'purple'}">${e.date<today()?'Fällig':e.estimated?'Frist geschätzt':e.kind==='payment'?'Zahlungsziel':'Termin'}</span></span></span></button><span class="row-actions"><button type="button" class="secondary small" data-ics="${esc(d.id)}|${esc(e.id)}">${icon('calendar')}Kalender</button>${doneButton(d)}</span></div>`;
}
function empty(title,description,add){return `<div class="empty"><span>${icon('scan')}</span><h3>${esc(title)}</h3><p>${esc(description)}</p><button class="${add?'primary':'secondary'}" id="empty-action">${add?'Erstes Dokument erfassen':'Filter zurücksetzen'}</button></div>`;}
function resetFilters(){category='all';upcomingOnly=false;$('search').value='';$('status-filter').value='all';$('person-filter').value='all';$('date-from').value='';$('date-to').value='';render();}

async function markDone(id){
 const d=docs.find(x=>x.id===id);if(!d||d.status==='done')return;
 try{docs=await storage.save({...d,status:'done'},[]);render();toast(isInvoice(d)?'Als bezahlt markiert.':'Als erledigt markiert.');}
 catch(e){toast('Speichern fehlgeschlagen: '+e.message);}
}
async function exportFromList(value){
 const [docId,eventId]=value.split('|');const d=docs.find(x=>x.id===docId);const e=d?.events.find(x=>x.id===eventId);
 if(!d||!e)return;try{await exportEvent(d,e);}catch(err){toast(err.message);}
}
document.addEventListener('click',e=>{
 if(e.target.closest('.manage-categories')){openManage();return;}
 const file=e.target.closest('[data-view-file]');if(file){openViewer(file.dataset.viewFile);return;}
 const done=e.target.closest('[data-done]');if(done){markDone(done.dataset.done);return;}
 const ics=e.target.closest('[data-ics]');if(ics){exportFromList(ics.dataset.ics);return;}
 const cat=e.target.closest('[data-category]');if(cat){category=cat.dataset.category;upcomingOnly=false;render();}
 const nav=e.target.closest('[data-view]');if(nav){view=nav.dataset.view;upcomingOnly=false;if(view==='documents')resetFilters();else render();}
 const row=e.target.closest('[data-document]');if(row)openDoc(row.dataset.document);
 if(e.target.closest('#empty-action')){if(!docs.length&&view==='documents')newDoc();else{resetFilters();if(view==='deadlines'){view='documents';render();}}}
 const stat=e.target.closest('[data-stat]');if(stat){resetFilters();view=stat.dataset.stat==='upcoming'?'deadlines':'documents';if(stat.dataset.stat==='open')$('status-filter').value='open';upcomingOnly=stat.dataset.stat==='upcoming';render();}
});
for(const id of ['search','status-filter','person-filter','sort','date-from','date-to'])$(id).addEventListener(id==='search'?'input':'change',render);
$('date-toggle').onclick=()=>$('date-filters').hidden=!$('date-filters').hidden;$('date-reset').onclick=()=>{$('date-from').value=$('date-to').value='';render();};

/* ---------- Editor ---------- */
function newDoc(){
 destroyPreview();draft=null;pending=[];editing=false;baseline='';
 $('document-form').reset();$('editor-title').textContent='Papier wird Überblick.';$('editor-eyebrow').textContent='NEUES DOKUMENT';
 $('import-area').hidden=false;$('review-area').hidden=true;$('save-document').hidden=true;$('delete-document').hidden=true;$('editor-error').hidden=true;
 $('selected-files').innerHTML='';$('analyze-button').hidden=true;$('processing').hidden=true;$('editor').showModal();
}
$('new-document').onclick=$('mobile-add').onclick=newDoc;
// Snapshot of everything the user can change; used to skip the save prompt when nothing differs.
function currentState(){
 if(!draft||$('review-area').hidden)return null;
 collect();
 return JSON.stringify({t:draft.title,x:draft.text,a:draft.amount,s:draft.status,c:[...draft.categories].sort(),p:[...draft.people].sort(),e:draft.events.map(e=>({k:e.kind,d:e.date,i:e.time,l:e.location,r:String(e.reminder),n:e.title}))});
}
function closeEditor(){
 if(busy)return;
 const state=currentState();
 const dirty=editing?(state!==null&&state!==baseline):(!!draft||pending.length>0);
 if(dirty&&!confirm('Bearbeitung ohne Speichern schließen?'))return;
 destroyPreview();$('editor').close();
}
$('close-editor').onclick=$('cancel-editor').onclick=closeEditor;$('editor').addEventListener('cancel',e=>{e.preventDefault();closeEditor();});
$('camera-button').onclick=()=>$('camera-input').click();$('upload-button').onclick=()=>$('upload-input').click();
function addFiles(files){if(busy)return;const next=[...pending,...files];if(next.reduce((sum,f)=>sum+f.size,0)>40*1024*1024){error(new Error('Bitte höchstens 40 MB pro Dokument auswählen.'));return;}pending=next;renderFiles();}
function renderFiles(){$('selected-files').innerHTML=pending.map((f,i)=>`<div class="selected-file">${icon('file')}<span>${i+1}. ${esc(f.name)} <small>${(f.size/1024/1024).toFixed(1)} MB</small></span><button type="button" data-up="${i}" aria-label="Seite nach oben" ${i===0?'disabled':''}>↑</button><button type="button" data-remove="${i}" aria-label="Datei entfernen">✕</button></div>`).join('');$('analyze-button').hidden=!pending.length;}
$('selected-files').onclick=e=>{const r=e.target.closest('[data-remove]'),u=e.target.closest('[data-up]');if(r)pending.splice(+r.dataset.remove,1);if(u){const i=+u.dataset.up;if(i>0)[pending[i-1],pending[i]]=[pending[i],pending[i-1]];}renderFiles();};
for(const id of ['upload-input','camera-input'])$(id).onchange=e=>{addFiles([...e.target.files]);e.target.value='';};
$('dropzone').ondragover=e=>{e.preventDefault();$('dropzone').classList.add('dragging');};$('dropzone').ondragleave=()=>$('dropzone').classList.remove('dragging');$('dropzone').ondrop=e=>{e.preventDefault();$('dropzone').classList.remove('dragging');addFiles([...e.dataTransfer.files]);};
function setBusy(value){busy=value;document.querySelectorAll('#editor button').forEach(b=>{if(value){b.dataset.wasDisabled=String(b.disabled);b.disabled=true;}else{b.disabled=b.dataset.wasDisabled==='true';delete b.dataset.wasDisabled;}});if(!value&&draft&&!$('review-area').hidden)renderEvents();}
$('analyze-button').onclick=async()=>{
 setBusy(true);$('editor-error').hidden=true;$('processing').hidden=false;
 const fileTitle=()=>pending[0].name.replace(/\.[^.]+$/,'');
 const base=(crops={})=>({id:crypto.randomUUID(),title:fileTitle(),received:today()+'T'+new Date().toTimeString().slice(0,8),status:'open',crops,useCrop:Object.keys(crops).length>0});
 try{
  const result=await extract(pending,message=>$('progress-text').textContent=message);
  const a=analyze(result.text,{received:today()});
  draft={...base(result.crops),text:result.text,pages:result.pages,...a,warnings:[...result.warnings,...a.warnings]};
  // Titel aus dem Text lesen; der Dateiname bleibt die Rückfallebene.
  draft.title=titleFrom(result.text)||fileTitle();
  // Anleitungen sind Nachschlagewerke, kein offener Vorgang.
  if(a.categories.includes('Anleitungen'))draft.status='done';
  draft.attachments=draftAttachments();
  showReview();
 }catch(e){
  error(e);const button=document.createElement('button');button.type='button';button.className='secondary full';button.textContent='Originale ohne Texterkennung ablegen';
  button.onclick=()=>{draft={...base(),text:'',pages:pending.length,...analyze('',{received:today()})};draft.attachments=draftAttachments();showReview();};
  $('editor-error').append(button);
 }finally{setBusy(false);$('processing').hidden=true;}
};
function showReview(){
 $('import-area').hidden=true;$('review-area').hidden=false;$('save-document').hidden=false;$('delete-document').hidden=!editing;$('editor-error').hidden=true;
 $('editor-title').textContent=editing?'Dokument bearbeiten':'Ablage prüfen';$('editor-eyebrow').textContent=editing?'DEIN ARCHIV':'ZUORDNUNGSVORSCHLAG';
 $('doc-title').value=draft.title;$('doc-text').value=draft.text;$('doc-amount').value=draft.amount||'';$('doc-status').value=draft.status;
 $('edit-categories').innerHTML=Object.entries(RULES).map(([c,r])=>`<label class="choice"><input type="checkbox" value="${esc(c)}" ${draft.categories.includes(c)?'checked':''}>${icon(r.icon)}${esc(c)}</label>`).join('');
 $('edit-people').innerHTML=personOptions().map(p=>`<label class="choice"><input type="checkbox" value="${esc(p)}" ${draft.people.includes(p)?'checked':''}>${esc(p)}</label>`).join('');
 $('person-summary').textContent=draft.people.join(', ');
 $('warnings').innerHTML=(draft.warnings||[]).map(w=>`<p class="warning">${esc(w)}</p>`).join('');
 $('evidence').innerHTML=(draft.scores||[]).filter(s=>s.score).map(s=>`<p><strong>${esc(s.category)} · ${s.score} Punkte</strong><br>${s.hits.map(h=>esc(h.word)+' (+'+h.weight+')').join(', ')}</p>`).join('');
 renderOriginals();renderCropToggle();renderEvents();
}
function renderOriginals(){
 if(!draft)return;
 $('originals').innerHTML='<h3>Originaldateien</h3>'+(draft.attachments||[]).map((a,i)=>`<button type="button" class="secondary small" data-original="${i}">${icon('file')}${esc(a.name)}</button>`).join('');
}
function openDoc(id){
 const d=docs.find(d=>d.id===id);if(!d)return;
 draft=structuredClone(d);draft.events=(draft.events||[]).map(e=>({location:'',reminder:1,evidence:'',...e}));
 pending=[];editing=true;showReview();$('editor').showModal();baseline=currentState();
}

/* ---------- Preview ---------- */
// Eine Instanz je Dialog: Bearbeiten und reine Dateivorschau teilen sich den Code.
function createPreview(prefix){
 const root=$(prefix),stage=$(prefix+'-stage'),label=$(prefix+'-label');
 let handle=null,index=0,zoom=1,url=null,token=0;
 async function show(){
  if(!handle||!handle.pages.length)return;
  const mine=++token,page=handle.pages[index];
  label.textContent=`${index+1} / ${handle.pages.length} · ${page.label}`;
  $(prefix+'-prev').disabled=index===0;$(prefix+'-next').disabled=index>=handle.pages.length-1;
  const style=getComputedStyle(stage);
  const pad=parseFloat(style.paddingLeft||0)+parseFloat(style.paddingRight||0);
  const padY=parseFloat(style.paddingTop||0)+parseFloat(style.paddingBottom||0);
  const box={width:Math.max(220,(stage.clientWidth||520)-pad),height:Math.max(0,(stage.clientHeight||0)-padY)};
  try{
   const {element,url:objectUrl}=await renderPage(page,box,zoom);
   if(mine!==token){if(objectUrl)URL.revokeObjectURL(objectUrl);return;}
   if(url)URL.revokeObjectURL(url);
   url=objectUrl;stage.replaceChildren(element);stage.scrollTop=0;stage.scrollLeft=0;
  }catch{if(mine===token)stage.textContent='Diese Seite konnte nicht dargestellt werden.';}
 }
 function destroy(){
  token++;
  if(url){URL.revokeObjectURL(url);url=null;}
  const old=handle;handle=null;index=0;zoom=1;
  stage.replaceChildren();root.hidden=true;root.classList.remove('full');
  if(old)old.destroy();
 }
 async function load(items){
  destroy();
  const mine=++token;
  if(!items||!items.length)return;
  root.hidden=false;label.textContent='Vorschau wird geladen …';
  let built;
  try{built=await buildPreview(items);}catch{if(mine===token)label.textContent='Vorschau nicht möglich.';return;}
  if(mine!==token){built.destroy();return;}
  handle=built;index=0;zoom=1;show();
 }
 function fail(message){destroy();root.hidden=false;label.textContent=message;}
 $(prefix+'-prev').onclick=()=>{if(handle&&index>0){index--;show();}};
 $(prefix+'-next').onclick=()=>{if(handle&&index<handle.pages.length-1){index++;show();}};
 $(prefix+'-in').onclick=()=>{zoom=Math.min(4,zoom+.25);show();};
 $(prefix+'-out').onclick=()=>{zoom=Math.max(.5,zoom-.25);show();};
 return {load,destroy,fail};
}
// Eine einzige Vorschau, die als Vollbild über allem liegt – aus der Übersicht
// wie aus dem Bearbeitungsfenster. Nichts wird ungefragt gerendert.
const viewerPreview=createPreview('viewer-preview');
let viewerSession=0;
const destroyPreview=()=>closeViewer();
// Blobs der aktuellen Fassung: bei Fotos je nach Schalter Zuschnitt oder Original.
function draftFiles(){return pending.map((file,i)=>{const crop=draft?.useCrop&&draft.crops?.[i];return crop?crop.blob:file;});}
function draftAttachments(){
 return pending.map((file,i)=>{
  const crop=draft?.useCrop&&draft.crops?.[i];
  return {key:`original-${i}`,name:crop?crop.name:file.name,type:crop?crop.type:(file.type||(/\.pdf$/i.test(file.name)?'application/pdf':'application/octet-stream'))};
 });
}
async function storedItems(doc){
 return Promise.all((doc.attachments||[]).map(async a=>({name:a.name,type:a.type,blob:await storage.readFile(doc.id,a.key)})));
}
function renderCropToggle(){
 const count=Object.keys(draft?.crops||{}).length;
 $('crop-toggle').hidden=!count||editing;
 if(!count||editing)return;
 $('use-crop').checked=!!draft.useCrop;
 $('crop-note').textContent=draft.useCrop
  ?`${count} ${count===1?'Foto wurde':'Fotos wurden'} auf das Blatt beschnitten und gerade gerückt. Abwählen, um die Originalaufnahme zu speichern.`
  :`Die Originalaufnahmen werden gespeichert. ${count===1?'Ein Zuschnitt steht':'Zuschnitte stehen'} bereit.`;
}
$('use-crop').onchange=()=>{
 if(!draft)return;
 draft.useCrop=$('use-crop').checked;
 draft.attachments=draftAttachments();
 renderCropToggle();renderOriginals();
};

/* ---------- Events ---------- */
const paymentTitle=()=>('Zahlungstermin '+(($('doc-title').value||draft?.title||'').trim())).trim();
function syncPaymentTitles(){
 if(!draft)return;const title=paymentTitle();
 draft.events.forEach((e,i)=>{if(e.kind!=='payment')return;e.title=title;const el=$('event-list').querySelector(`[data-event="${i}"] [data-field="title"]`);if(el&&el.value!==title)el.value=title;});
}
function renderEvents(){
 if(!draft)return;
 $('event-list').innerHTML=draft.events.length?draft.events.map((e,i)=>`<div class="event-card" data-event="${i}"><div class="event-top"><select data-field="kind" aria-label="Art des Kalendereintrags"><option value="payment" ${e.kind==='payment'?'selected':''}>Zahlungsziel</option><option value="appointment" ${e.kind==='appointment'?'selected':''}>Termin</option></select><button type="button" class="icon-button" data-delete-event="${i}" aria-label="Eintrag entfernen">✕</button></div>${e.kind==='payment'?`<label class="field">Kalendertitel <small>wird aus dem Dokumenttitel gebildet</small><input data-field="title" value="${esc(paymentTitle())}" readonly></label>`:`<label class="field">Kalendertitel<input data-field="title" value="${esc(e.title)}" required></label>`}<div class="field-grid"><label class="field">Datum<input type="date" data-field="date" value="${esc(e.date)}" required></label><label class="field">Uhrzeit (optional)<input type="time" data-field="time" value="${esc(e.time)}"></label></div><div class="field-grid"><label class="field">Ort<input data-field="location" value="${esc(e.location)}" placeholder="Optional"></label><label class="field">Erinnerung<select data-field="reminder"><option value="-1" ${+e.reminder===-1?'selected':''}>Keine</option>${[0,1,3,7].map(n=>`<option value="${n}" ${+e.reminder===n?'selected':''}>${n===0?'Am Termin':n+' Tag'+(n===1?'':'e')+' vorher'}</option>`).join('')}</select></label></div>${e.estimated?'<p class="warning">Zahlungsziel wurde geschätzt. Bitte im Dokument prüfen.</p>':''}<p>Erkannt aus: ${esc(e.evidence||'Manuell ergänzt')}</p><button type="button" class="primary small full-mobile" data-export-event="${i}">${icon('calendar')}Zum iPhone-Kalender hinzufügen</button></div>`).join(''):'<p class="muted">Keine eindeutigen Termine oder Zahlungsziele erkannt.</p>';
}
$('doc-title').addEventListener('input',syncPaymentTitles);
$('event-list').addEventListener('input',e=>{
 const el=e.target,card=el.closest('[data-event]');if(!card||!el.dataset.field||!draft)return;
 const event=draft.events[+card.dataset.event];if(!event)return;
 if(el.dataset.field==='kind'){
  event.kind=el.value;
  if(el.value==='payment'){event.title=paymentTitle();event.time='';event.reminder=3;}
  else if(!event.title||event.title.startsWith('Zahlungstermin'))event.title='Termin';
  renderEvents();return;
 }
 event[el.dataset.field]=el.value;
 if(el.dataset.field==='date')event.estimated=false;
});
$('event-list').onclick=async e=>{
 const del=e.target.closest('[data-delete-event]'),exp=e.target.closest('[data-export-event]');
 if(del){draft.events.splice(+del.dataset.deleteEvent,1);renderEvents();return;}
 if(exp){try{collect();await exportEvent(draft,draft.events[+exp.dataset.exportEvent]);}catch(err){error(err);}}
};
$('add-event').onclick=()=>{draft.events.push({id:crypto.randomUUID(),kind:'appointment',date:'',time:'',title:'Termin',location:'',reminder:1,evidence:'Manuell ergänzt',estimated:false,confirmed:true});renderEvents();};
function collect(){
 if(!editing)draft.attachments=draftAttachments();
 draft.title=$('doc-title').value.trim();draft.text=$('doc-text').value;draft.amount=$('doc-amount').value.trim();draft.status=$('doc-status').value;
 draft.categories=[...$('edit-categories').querySelectorAll('input:checked')].map(x=>x.value);
 draft.people=[...$('edit-people').querySelectorAll('input:checked')].map(x=>x.value);
 if(!draft.people.length)draft.people=[UNCLEAR];
 syncPaymentTitles();
}
// Anleitungen sind Nachschlagewerke: Auswahl setzt den Stand auf erledigt.
$('edit-categories').onchange=e=>{
 if(e.target.value==='Anleitungen'&&e.target.checked&&$('doc-status').value!=='done'){
  $('doc-status').value='done';
  toast('Anleitungen werden als erledigt abgelegt. Der Stand lässt sich weiter unten ändern.');
 }
};
$('edit-people').onchange=e=>{
 const checked=[...$('edit-people').querySelectorAll('input:checked')];
 if(e.target.checked){if(e.target.value===UNCLEAR)checked.filter(x=>x!==e.target).forEach(x=>x.checked=false);else checked.filter(x=>x.value===UNCLEAR).forEach(x=>x.checked=false);}
 $('person-summary').textContent=[...$('edit-people').querySelectorAll('input:checked')].map(x=>x.value).join(', ');
};
$('reanalyze').onclick=()=>{
 if(!confirm('Automatische Vorschläge neu erstellen? Bisherige Kategorien, Personen und Kalendereinträge werden ersetzt.'))return;
 collect();Object.assign(draft,analyze(draft.text,{received:draft.received?.slice(0,10)||today()}));showReview();
};
$('originals').onclick=async e=>{
 const b=e.target.closest('[data-original]');if(!b)return;
 try{const i=+b.dataset.original,a=draft.attachments[i];const file=editing?await storage.readFile(draft.id,a.key):draftFiles()[i];await download(new Blob([file],{type:a.type}),a.name);}catch(err){error(err);}
};
$('document-form').onsubmit=async e=>{
 e.preventDefault();if(!draft||busy)return;collect();
 if(!draft.title)return error(new Error('Bitte einen Dokumenttitel eingeben.'));
 if(!draft.categories.length)return error(new Error('Bitte mindestens eine Kategorie auswählen.'));
 setBusy(true);
 try{docs=await storage.save(draft,editing?[]:draftFiles().map((file,i)=>({key:draft.attachments[i].key,file})));destroyPreview();$('editor').close();draft=null;pending=[];baseline='';render();toast('Dokument lokal gespeichert.');}
 catch(err){error(new Error('Speichern fehlgeschlagen. Originale bitte behalten. '+err.message));}
 finally{setBusy(false);}
};
$('delete-document').onclick=async()=>{
 if(!confirm('Dieses Dokument und seine Originaldateien endgültig von diesem Gerät löschen?'))return;
 try{docs=await storage.remove(draft.id);destroyPreview();$('editor').close();draft=null;baseline='';render();toast('Dokument gelöscht.');}catch(e){error(e);}
};

/* ---------- Reine Dateivorschau (Vollbild) ---------- */
function openViewerShell({title,eyebrow,meta,editable,originals}){
 $('viewer-title').textContent=title;
 $('viewer-eyebrow').textContent=eyebrow;
 $('viewer-meta').textContent=meta;
 $('viewer-originals').innerHTML=originals;
 $('viewer-edit').hidden=!editable;
 if(!$('viewer').open)$('viewer').showModal();
}
async function openViewer(id){
 const doc=docs.find(d=>d.id===id);if(!doc)return;
 const session=++viewerSession;
 viewerPreview.destroy();
 viewerDoc=doc;
 openViewerShell({
  title:doc.title,eyebrow:'DATEIVORSCHAU',
  meta:`${pageCount(doc)} · Eingang ${fmt(doc.received.slice(0,10))} · ${statusLabel(doc)}${doc.amount?' · '+doc.amount+' €':''}`,
  editable:true,
  originals:(doc.attachments||[]).map((a,i)=>`<button type="button" class="secondary small" data-viewer-original="${i}">${icon('file')}${esc(a.name)}</button>`).join('')
 });
 try{
  const items=await storedItems(doc);
  if(session!==viewerSession||!$('viewer').open)return;
  await viewerPreview.load(items);
 }catch{if(session===viewerSession&&$('viewer').open)viewerPreview.fail('Originale konnten nicht geladen werden.');}
}
function clearViewer(){
 viewerSession++;viewerPreview.destroy();viewerDoc=null;
 $('viewer-title').textContent='Dokument';$('viewer-meta').textContent='';$('viewer-originals').replaceChildren();
}
function closeViewer(){clearViewer();if($('viewer').open)$('viewer').close();}
$('viewer').addEventListener('close',()=>{if(!$('viewer').open)clearViewer();});
$('close-viewer').onclick=$('viewer-close-button').onclick=closeViewer;
$('viewer').addEventListener('cancel',e=>{e.preventDefault();closeViewer();});
$('viewer-edit').onclick=()=>{const id=viewerDoc?.id;closeViewer();if(id)openDoc(id);};
$('viewer-originals').onclick=async e=>{
 const b=e.target.closest('[data-viewer-original]');if(!b||!viewerDoc)return;
 try{const a=viewerDoc.attachments[+b.dataset.viewerOriginal];await download(new Blob([await storage.readFile(viewerDoc.id,a.key)],{type:a.type}),a.name);}
 catch(err){toast('Datei konnte nicht geöffnet werden: '+err.message);}
};

/* ---------- Categories & people ---------- */
$('category-color').innerHTML=COLORS.map(c=>`<option value="${c}">${COLOR_LABELS[c]}</option>`).join('');
$('category-icon').innerHTML=ICONS.map(i=>`<option value="${i}">${ICON_LABELS[i]}</option>`).join('');
function manageError(e){$('manage-error').textContent=e.message||String(e);$('manage-error').hidden=false;}
function renderManage(){
 $('manage-error').hidden=true;
 $('category-manage-list').innerHTML=Object.entries(RULES).map(([name,rule])=>`<div class="manage-row"><span class="category-icon ${rule.color}">${icon(rule.icon)}</span><span class="manage-name">${esc(name)}<small>${rule.custom?Object.keys(rule.terms).length+' Stichwörter · eigene Kategorie':'Standardkategorie'} · ${docs.filter(d=>d.categories.includes(name)).length} Dokumente</small></span>${rule.custom?`<button type="button" class="danger text-button" data-remove-category="${esc(name)}">Löschen</button>`:''}</div>`).join('');
 $('people-manage-list').innerHTML=PEOPLE.length?PEOPLE.map(p=>`<div class="manage-row"><span class="manage-name">${esc(p)}</span><button type="button" class="danger text-button" data-remove-person="${esc(p)}">Entfernen</button></div>`).join(''):`<p class="muted">Noch keine Personen angelegt. „${FAMILY}“ und „${UNCLEAR}“ stehen immer zur Verfügung.</p>`;
}
function openManage(){renderManage();if(!$('manage-dialog').open)$('manage-dialog').showModal();}
$('close-manage').onclick=()=>$('manage-dialog').close();
$('manage-dialog').addEventListener('close',()=>{render();if(draft&&!$('review-area').hidden){const state=currentState();showReview();if(editing&&state===baseline)baseline=currentState();}});
$('category-form').onsubmit=e=>{
 e.preventDefault();
 try{
  const name=addCategory({name:$('category-name').value,color:$('category-color').value,icon:$('category-icon').value,keywords:$('category-terms').value});
  $('category-form').reset();renderManage();toast(`Kategorie „${name}“ angelegt.`);
 }catch(err){manageError(err);}
};
$('person-form').onsubmit=e=>{
 e.preventDefault();
 const name=$('person-name').value.trim();
 if(!name)return manageError(new Error('Bitte einen Namen eingeben.'));
 if(PEOPLE.includes(name))return manageError(new Error('Diese Person gibt es bereits.'));
 savePeople([...PEOPLE,name]);$('person-form').reset();renderManage();toast('Person hinzugefügt.');
};
$('manage-dialog').addEventListener('click',async e=>{
 const cat=e.target.closest('[data-remove-category]'),person=e.target.closest('[data-remove-person]');
 if(cat){
  const name=cat.dataset.removeCategory;
  const affected=docs.filter(d=>d.categories.includes(name));
  if(!confirm(`Kategorie „${name}“ löschen?${affected.length?` Sie wird aus ${affected.length} Dokument(en) entfernt.`:''}`))return;
  try{for(const d of affected)docs=await storage.save({...d,categories:d.categories.filter(c=>c!==name)},[]);removeCategory(name);if(category===name)category='all';renderManage();toast('Kategorie gelöscht.');}
  catch(err){manageError(err);}
 }
 if(person){
  const name=person.dataset.removePerson;
  if(!confirm(`„${name}“ aus der Auswahlliste entfernen? Bereits zugeordnete Dokumente behalten den Namen.`))return;
  savePeople(PEOPLE.filter(p=>p!==name));renderManage();
 }
});

/* ---------- Settings ---------- */
async function settings(){
 $('settings-dialog').showModal();
 if(navigator.storage?.estimate){const {usage,quota}=await navigator.storage.estimate();$('storage-info').textContent=`Belegt: ${((usage||0)/1024/1024).toFixed(1)} MB · Speicherrahmen: ${((quota||0)/1024/1024).toFixed(0)} MB`;}
 if('caches'in window){const c=await caches.open('doc-org-v3');$('offline-status').textContent=(await c.match(new URL('./offline-ready',location.href)))?'Offline-Dateien sind vollständig verfügbar.':'Offline-Dateien werden noch vorbereitet. Bitte online geöffnet lassen.';}
}
$('settings').onclick=$('mobile-settings').onclick=settings;$('close-settings').onclick=()=>$('settings-dialog').close();
$('persist').onclick=async()=>{try{const ok=await navigator.storage?.persist?.();toast(ok?'Dauerhafte Speicherung ist aktiviert.':'Der Browser verwaltet die Speicherdauer. Bitte regelmäßig sichern.');}catch{toast('Bitte regelmäßig eine Sicherung exportieren.');}};
$('backup').onclick=async()=>{$('backup').disabled=true;try{await download(await storage.backup(),`Doc-Org-Sicherung-${today()}.json`);}catch(e){toast('Sicherung fehlgeschlagen: '+e.message);}finally{$('backup').disabled=false;}};
$('restore').onclick=()=>$('restore-input').click();
$('restore-input').onchange=async e=>{
 const file=e.target.files[0];e.target.value='';if(!file)return;
 if(!confirm('Sicherung als zusätzliche Dokumente importieren? Bestehende Dokumente bleiben erhalten.'))return;
 $('restore').disabled=true;
 try{docs=await storage.restore(file);render();toast('Sicherung importiert.');}catch(err){toast('Import fehlgeschlagen: '+err.message);}finally{$('restore').disabled=false;}
};
window.addEventListener('storage',e=>{if(e.key==='doc-org-index-v1'){try{docs=storage.load();render();}catch{toast('Dokumentverzeichnis konnte nicht aktualisiert werden.');}}});
render();
if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').then(()=>{navigator.serviceWorker.addEventListener('message',e=>{if(e.data==='offline-ready')$('offline-status').textContent='Offline-Dateien sind vollständig verfügbar.';});}).catch(()=>{$('offline-status').textContent='Offline-Vorbereitung fehlgeschlagen. Bitte Verbindung und HTTPS prüfen.';});
if(location.protocol==='file:')toast('Bitte Doc-Org über HTTPS oder den mitgelieferten lokalen Server öffnen.');
