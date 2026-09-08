// Documents are ordinary files in the browser's private filesystem; no IndexedDB or backend.
import {customCategories,loadCategories,addCategory,PEOPLE,savePeople,RULES} from './rules.js';
const INDEX='doc-org-index-v1';
export function load(){const raw=localStorage.getItem(INDEX);if(!raw)return [];const parsed=JSON.parse(raw);if(!Array.isArray(parsed))throw new Error('Dokumentverzeichnis beschädigt. Bitte Sicherung verwenden.');return parsed;}
async function root(){if(!navigator.storage?.getDirectory)throw new Error('Lokale Dateispeicherung benötigt einen aktuellen Browser und HTTPS (am Computer auch localhost).');return (await navigator.storage.getDirectory()).getDirectoryHandle('doc-org',{create:true});}
export async function readFile(id,key){const dir=await (await root()).getDirectoryHandle(id);return (await dir.getFileHandle(key)).getFile();}
async function write(handle,file){
 if(handle.createWritable){const stream=await handle.createWritable();try{await stream.write(file);await stream.close();}catch(e){await stream.abort().catch(()=>{});throw e;}}
 else await new Promise((resolve,reject)=>{const worker=new Worker(new URL('./file-worker.js',import.meta.url));worker.onmessage=({data})=>{worker.terminate();data.ok?resolve():reject(new Error(data.error));};worker.onerror=e=>{worker.terminate();reject(new Error(e.message));};worker.postMessage({handle,file});});
}
export async function save(doc,files=[]){
 const docs=load();const existing=docs.some(d=>d.id===doc.id);const dir=await (await root()).getDirectoryHandle(doc.id,{create:true});
 try{for(const item of files){const handle=await dir.getFileHandle(item.key,{create:true});await write(handle,item.file);}
 const next=existing?docs.map(d=>d.id===doc.id?doc:d):[doc,...docs];localStorage.setItem(INDEX,JSON.stringify(next));return next;
 }catch(e){if(!existing)await (await root()).removeEntry(doc.id,{recursive:true}).catch(()=>{});throw e;}
}
export async function remove(id){const docs=load().filter(d=>d.id!==id);localStorage.setItem(INDEX,JSON.stringify(docs));await (await root()).removeEntry(id,{recursive:true}).catch(()=>{});return docs;}
export async function backup(){
 const docs=load(),files=[];
 for(const doc of docs)for(const a of doc.attachments){const file=await readFile(doc.id,a.key);const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});files.push({id:doc.id,key:a.key,data});}
 return new Blob([JSON.stringify({format:'doc-org',version:1,created:new Date().toISOString(),docs,files,categories:customCategories(),people:[...PEOPLE]})],{type:'application/json'});
}
export async function restore(file){
 const b=JSON.parse(await file.text());if(b.format!=='doc-org'||b.version!==1||!Array.isArray(b.docs)||!Array.isArray(b.files))throw new Error('Keine gültige Doc-Org-Sicherung.');
 const valid=s=>typeof s==='string'&&/^[a-zA-Z0-9._-]+$/.test(s)&&s!=='.'&&s!=='..';
 for(const doc of b.docs){if(!['open','done'].includes(doc.status)||typeof doc.received!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(doc.received)||!valid(doc.id)||typeof doc.title!=='string'||typeof doc.text!=='string'||!Array.isArray(doc.categories)||!Array.isArray(doc.people)||!Array.isArray(doc.events)||!doc.events.every(e=>typeof e.id==='string'&&/^[a-zA-Z0-9-]+$/.test(e.id)&&['payment','appointment'].includes(e.kind)&&typeof e.title==='string'&&typeof e.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)&&typeof e.time==='string')||!Array.isArray(doc.attachments)||!doc.attachments.every(a=>valid(a.key)&&typeof a.name==='string'&&typeof a.type==='string'))throw new Error('Ungültige Dokumentdaten.');for(const a of doc.attachments)if(!b.files.some(f=>f.id===doc.id&&f.key===a.key&&/^data:[^,]*;base64,/.test(f.data)))throw new Error('Datei fehlt in der Sicherung.');}
 // Categories and people from the backup are added; nothing existing is overwritten.
 if(Array.isArray(b.categories)){loadCategories();for(const c of b.categories)if(c&&typeof c.name==='string'&&!RULES[c.name])try{addCategory(c);}catch{}}
 if(Array.isArray(b.people))savePeople([...PEOPLE,...b.people.filter(p=>typeof p==='string')]);
 const added=[];
 try{for(const original of b.docs){const id=crypto.randomUUID();const files=original.attachments.map(a=>{const f=b.files.find(f=>f.id===original.id&&f.key===a.key);const raw=atob(f.data.slice(f.data.indexOf(',')+1));return {key:a.key,file:new Blob([Uint8Array.from(raw,c=>c.charCodeAt(0))],{type:a.type})};});await save({...original,id},files);added.push(id);}}catch(e){for(const id of added)await remove(id);throw e;}
 return load();
}
