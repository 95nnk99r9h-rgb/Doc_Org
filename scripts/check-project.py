from pathlib import Path
import re,json,subprocess
root=Path(__file__).resolve().parents[1];dist=root/'docs'
for p in (dist/'js').glob('*.js'):subprocess.run(['node','--check',str(p)],check=True)
subprocess.run(['node','--check',str(dist/'sw.js')],check=True)
html=(dist/'index.html').read_text()
ids=re.findall(r'\bid="([^"]+)"',html)
assert len(ids)==len(set(ids)),'Duplicate HTML ids'
for rel in re.findall(r'(?:src|href)="(\./[^"]+)"',html):assert (dist/rel).exists(),rel
for p in (dist/'js').glob('*.js'):
 for rel in re.findall(r"(?:from\s+|import\(|new URL\()'([.][. /][^']+)'",p.read_text()):assert rel=='./offline-ready' or (p.parent/rel).exists(),(p,rel)
for icon in json.loads((dist/'manifest.webmanifest').read_text())['icons']:assert (dist/icon['src']).exists()
sw=(dist/'sw.js').read_text();assets=json.loads(sw.split('const ASSETS=')[1].split(';',1)[0]);assert all((dist/a).exists() for a in assets)
print(f'Validated HTML ids, JavaScript syntax, module paths, manifest and {len(assets)} offline resources.')
