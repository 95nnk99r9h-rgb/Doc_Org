from pathlib import Path
from urllib.request import urlretrieve
from concurrent.futures import ThreadPoolExecutor
import hashlib,json
root=Path(__file__).resolve().parents[1]/'docs/vendor'
items={
 'tesseract/tesseract.min.js':'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js',
 'tesseract/worker.min.js':'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',
 'tesseract/LICENSE':'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/LICENSE.md',
 'tesseract/core/LICENSE':'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0/LICENSE',
 'tesseract/lang/deu.traineddata.gz':'https://cdn.jsdelivr.net/npm/@tesseract.js-data/deu@1.0.0/4.0.0_best_int/deu.traineddata.gz',
 'pdf/pdf.mjs':'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.mjs',
 'pdf/pdf.worker.mjs':'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.worker.mjs',
 'pdf/LICENSE':'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/LICENSE'
}
# Die App verwendet OEM 1 (nur LSTM); tesseract.js lädt dann ausschließlich die
# beiden LSTM-Kerne. Die Legacy-Kerne bleiben bewusst außen vor (rund 16 MB).
for variant in ['tesseract-core-lstm','tesseract-core-simd-lstm']:
 for ext in ['wasm.js','wasm']: items[f'tesseract/core/{variant}.{ext}']=f'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0/{variant}.{ext}'
def fetch(pair):
 name,url=pair; path=root/name; path.parent.mkdir(parents=True,exist_ok=True)
 if not path.exists(): urlretrieve(url,path)
 return {'file':name,'url':url,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
with ThreadPoolExecutor(max_workers=8) as pool: result=list(pool.map(fetch,items.items()))
(root/'sources.json').write_text(json.dumps(result,indent=2))
print(f'{len(result)} dependencies downloaded.')
