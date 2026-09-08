"""Erzeugt die Musterunterlagen unter tests/fixtures/ neu.

Die Dateien enthalten ausschliesslich erfundene Angaben und sind deutlich als
Muster gekennzeichnet. Aufruf: python3 scripts/make-fixtures.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

root = Path(__file__).resolve().parents[1]
out = root / 'tests' / 'fixtures'
out.mkdir(parents=True, exist_ok=True)

PAGE_1 = [
    'MUSTERDOKUMENT - KEINE ECHTE RECHNUNG',
    '',
    'Arztpraxis Beispiel',
    'Patient: Theo Muster',
    '',
    'Rechnungsnummer: TEST-2026-01',
    'Rechnungsdatum: 08.09.2026',
    'Rechnungsbetrag: 123,45 EUR',
    'Zahlbar bis 22.09.2026',
]
PAGE_2 = [
    'MUSTERDOKUMENT - SEITE 2',
    '',
    'Ihr Termin am 25.09.2026 um 09:30 Uhr',
    'Arztpraxis Beispiel - Musterstrasse 1',
]

pdf = canvas.Canvas(str(out / 'muster-zweiseitig.pdf'), pagesize=A4)
for page in (PAGE_1, PAGE_2):
    pdf.setFont('Helvetica', 12)
    y = A4[1] - 80
    for line in page:
        pdf.drawString(60, y, line)
        y -= 22
    pdf.showPage()
pdf.save()

FONT_CANDIDATES = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
]
font = next((ImageFont.truetype(p, 30) for p in FONT_CANDIDATES if Path(p).exists()), ImageFont.load_default())

image = Image.new('RGB', (1240, 800), 'white')
draw = ImageDraw.Draw(image)
y = 60
for line in PAGE_1 + [''] + PAGE_2[2:]:
    draw.text((70, y), line, fill='black', font=font)
    y += 48
image.save(out / 'muster-arztrechnung.png')
print('Musterunterlagen neu erzeugt.')
