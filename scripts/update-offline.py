from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]/'docs'
files=['./']+['./'+str(p.relative_to(root)) for p in sorted(root.rglob('*')) if p.is_file() and not p.name.startswith('.') and p.suffix!='.md' and p.name not in ['sw.js','_headers','sources.json'] and not p.name.startswith('LICENSE')]
script='''// Update CACHE on each release. User documents are never stored in this cache.
const CACHE='doc-org-v3';
const ASSETS=__ASSETS__;
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
'''
(root/'sw.js').write_text(script.replace('__ASSETS__',json.dumps(files,indent=2)))
print(f'{len(files)} offline resources listed.')
