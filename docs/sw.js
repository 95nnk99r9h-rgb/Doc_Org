// Update CACHE on each release. User documents are never stored in this cache.
const CACHE='doc-org-v4';
const ASSETS=[
  "./",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon.svg",
  "./css/app.css",
  "./index.html",
  "./js/analysis.js",
  "./js/app.js",
  "./js/calendar.js",
  "./js/crop.js",
  "./js/file-worker.js",
  "./js/ocr.js",
  "./js/preview.js",
  "./js/rules.js",
  "./js/storage.js",
  "./manifest.webmanifest",
  "./vendor/pdf/pdf.mjs",
  "./vendor/pdf/pdf.worker.mjs",
  "./vendor/tesseract/core/tesseract-core-lstm.wasm",
  "./vendor/tesseract/core/tesseract-core-lstm.wasm.js",
  "./vendor/tesseract/core/tesseract-core-simd-lstm.wasm",
  "./vendor/tesseract/core/tesseract-core-simd-lstm.wasm.js",
  "./vendor/tesseract/lang/deu.traineddata.gz",
  "./vendor/tesseract/tesseract.min.js",
  "./vendor/tesseract/worker.min.js"
];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 for(const asset of ASSETS)await cache.add(new Request(new URL(asset,self.registration.scope),{cache:'reload'}));
 await cache.put(new URL('./offline-ready',self.registration.scope),new Response('ready'));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('doc-org-')&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();for(const client of await self.clients.matchAll())client.postMessage('offline-ready');
})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==location.origin)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);const hit=await cache.match(event.request);if(hit)return hit;try{return await fetch(event.request);}catch(e){if(event.request.mode==='navigate')return await cache.match(new URL('./index.html',self.registration.scope));throw e;}})());
});
