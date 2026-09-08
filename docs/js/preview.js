// In-app preview of the stored originals. Images are shown directly, PDF pages are
// rendered with the bundled PDF.js. Nothing leaves the device.
import {loadPdfLib} from './ocr.js';

const isPdf=item=>item.type==='application/pdf'||/\.pdf$/i.test(item.name||'');
const isImage=item=>(item.type||'').startsWith('image/')||/\.(png|jpe?g|webp|gif|avif|heic|heif)$/i.test(item.name||'');

// items: [{name, type, blob}] – returns a flat, lazily rendered list of pages.
export async function buildPreview(items){
 const pages=[],tasks=[];
 for(const item of items){
  if(isPdf(item)){
   try{
    const lib=await loadPdfLib();
    const task=lib.getDocument({data:new Uint8Array(await item.blob.arrayBuffer()),isEvalSupported:false,useSystemFonts:true});
    const doc=await task.promise;tasks.push(task);
    for(let p=1;p<=doc.numPages;p++)pages.push({kind:'pdf',doc,page:p,label:`${item.name} · Seite ${p} von ${doc.numPages}`});
   }catch{pages.push({kind:'none',label:item.name,reason:'PDF konnte nicht gelesen werden.'});}
  }else if(isImage(item))pages.push({kind:'image',blob:item.blob,label:item.name});
  else pages.push({kind:'none',label:item.name,reason:'Für dieses Dateiformat gibt es keine Vorschau.'});
 }
 return {pages,async destroy(){for(const task of tasks)await task.destroy().catch(()=>{});}};
}

// Rendert eine Seite so, dass sie bei zoom = 1 vollständig in die angebotene
// Fläche passt. Gibt das Element und eine ggf. freizugebende Object-URL zurück.
const fit=(w,h,box,zoom)=>{
 const available=Math.min(box.width/w,box.height?box.height/h:Infinity);
 return Math.min(6,Math.max(.05,(Number.isFinite(available)?available:1)*zoom));
};
export async function renderPage(page,box,zoom=1){
 const area={width:Math.max(160,box.width||520),height:box.height>0?box.height:0};
 if(page.kind==='image'){
  const url=URL.createObjectURL(page.blob);
  const img=new Image();img.src=url;img.alt=page.label;img.className='preview-page';
  try{await img.decode();}catch{URL.revokeObjectURL(url);return {element:fallback('Bild konnte nicht angezeigt werden.'),url:null};}
  img.style.width=Math.round(img.naturalWidth*fit(img.naturalWidth,img.naturalHeight,area,zoom))+'px';
  return {element:img,url};
 }
 if(page.kind==='pdf'){
  const p=await page.doc.getPage(page.page);
  const base=p.getViewport({scale:1});
  const viewport=p.getViewport({scale:fit(base.width,base.height,area,zoom)});
  const canvas=document.createElement('canvas');
  canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  canvas.className='preview-page';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',page.label);
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  await p.render({canvasContext:ctx,viewport}).promise;p.cleanup();
  return {element:canvas,url:null};
 }
 return {element:fallback(page.reason||'Keine Vorschau verfügbar.'),url:null};
}

function fallback(message){const div=document.createElement('div');div.className='preview-fallback';div.textContent=message;return div;}
