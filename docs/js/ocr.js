import {analyzeSource,drawCropped} from './crop.js';
let pdfLib;
export async function loadPdfLib(){return pdf();}
async function pdf(){if(!Promise.withResolvers)Promise.withResolvers=function(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};pdfLib??=await import('../vendor/pdf/pdf.mjs');pdfLib.GlobalWorkerOptions.workerSrc=new URL('../vendor/pdf/pdf.worker.mjs',import.meta.url).href;return pdfLib;}

// Bild laden, wenn möglich auf das Blatt zuschneiden und auf Lesegröße bringen.
async function imageCanvas(blob,{autoCrop=true,maxEdge=2200}={}){
 const url=URL.createObjectURL(blob);
 try{
  const img=new Image();img.src=url;await img.decode();
  let rect=null;
  if(autoCrop)try{rect=analyzeSource(img);}catch{rect=null;}
  if(rect)return {canvas:drawCropped(img,rect,{maxEdge}),cropped:true};
  const scale=Math.min(1,maxEdge/Math.max(img.width,img.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
  const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
  return {canvas,cropped:false};
 }finally{URL.revokeObjectURL(url);}
}
const toBlob=canvas=>new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Zugeschnittenes Bild konnte nicht erzeugt werden.')),'image/jpeg',0.9));
const croppedName=name=>String(name).replace(/\.[^.]+$/,'')+'-zugeschnitten.jpg';

export async function extract(files,onProgress,{autoCrop=true}={}){
 let worker;const texts=[],warnings=[],crops={};let pages=0;
 async function recognize(canvas){
  worker??=await Tesseract.createWorker('deu',1,{workerPath:new URL('../vendor/tesseract/worker.min.js',import.meta.url).href,corePath:new URL('../vendor/tesseract/core/',import.meta.url).href,langPath:new URL('../vendor/tesseract/lang/',import.meta.url).href,cacheMethod:'none',logger:m=>{if(m.status==='recognizing text')onProgress(`Seite ${pages}: Text erkennen … ${Math.round(m.progress*100)} %`);}});
  const r=await worker.recognize(canvas);if(r.data.confidence<65)warnings.push(`Seite ${pages}: geringe Erkennungsqualität – Text bitte prüfen.`);return r.data.text;
 }
 try{for(const [index,file] of files.entries()){
  onProgress(`${file.name} wird gelesen …`);
  if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){
   const lib=await pdf();const loading=lib.getDocument({data:await file.arrayBuffer(),isEvalSupported:false,useSystemFonts:true});let doc;
   try{doc=await loading.promise;for(let p=1;p<=doc.numPages;p++){
    pages++;if(pages>60)throw new Error('Bitte höchstens 60 Seiten pro Dokument importieren.');onProgress(`PDF-Seite ${p} von ${doc.numPages} …`);
    const page=await doc.getPage(p),content=await page.getTextContent();let text=content.items.map(x=>x.str+(x.hasEOL?'\n':' ')).join('');
    if(text.replace(/\s/g,'').length<40){const initial=page.getViewport({scale:1});const scale=Math.min(2,2200/Math.max(initial.width,initial.height));const viewport=page.getViewport({scale});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;text=await recognize(canvas);canvas.width=canvas.height=0;}
    texts.push(text);page.cleanup();
   }}finally{await loading.destroy();}
  }else if(file.type.startsWith('image/')||/\.(png|jpe?g|webp|heic|heif)$/i.test(file.name)){
   pages++;if(pages>60)throw new Error('Bitte höchstens 60 Seiten pro Dokument importieren.');
   onProgress(`${file.name}: Blatt suchen und zuschneiden …`);
   let result;try{result=await imageCanvas(file,{autoCrop});}catch{throw new Error(`${file.name}: Bildformat nicht lesbar. Bitte als JPEG oder PNG exportieren.`);}
   if(result.cropped)try{crops[index]={blob:await toBlob(result.canvas),name:croppedName(file.name),type:'image/jpeg'};}catch{/* Original behalten */}
   texts.push(await recognize(result.canvas));
   result.canvas.width=result.canvas.height=0;
  }else throw new Error(`${file.name}: Bitte ein Bild oder PDF auswählen.`);
 }}finally{if(worker)await worker.terminate();}
 const text=texts.join('\n\n');if(!text.trim())warnings.push('Kein Text erkannt. Du kannst die Originale speichern und Angaben manuell ergänzen.');
 return {text,pages,warnings,crops};
}
