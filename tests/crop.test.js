import {test} from 'node:test';import assert from 'node:assert/strict';
import {otsuThreshold,convexHull,minAreaRect,detectDocument} from '../docs/js/crop.js';

// Zeichnet ein gedrehtes helles Rechteck auf dunklen Untergrund.
function scene({width=400,height=300,rectW=240,rectH=170,angle=0,cx=width/2,cy=height/2,paper=235,background=40,noise=0}={}){
 const gray=new Uint8Array(width*height).fill(background);
 const cos=Math.cos(-angle),sin=Math.sin(-angle);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const dx=x-cx,dy=y-cy;
  const u=dx*cos-dy*sin,v=dx*sin+dy*cos;
  if(Math.abs(u)<=rectW/2&&Math.abs(v)<=rectH/2)gray[y*width+x]=paper;
 }
 if(noise)for(let i=0;i<gray.length;i++)gray[i]=Math.max(0,Math.min(255,gray[i]+((i*2654435761>>>0)%(2*noise))-noise));
 return {gray,width,height};
}

test('Otsu trennt zwei klar getrennte Helligkeiten',()=>{
 const hist=new Uint32Array(256);hist[30]=6000;hist[220]=4000;
 const t=otsuThreshold(hist,10000);
 // Otsu liefert die obere Grenze der dunklen Klasse; alles darüber gilt als hell.
 assert.ok(t>=30&&t<220,`Schwelle ${t} trennt die Gruppen nicht`);
 assert.equal(otsuThreshold(hist,10000)>=30,true);
});

test('Konvexe Hülle ignoriert innere Punkte',()=>{
 const hull=convexHull([{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10},{x:5,y:5},{x:3,y:7}]);
 assert.equal(hull.length,4);
 assert.ok(hull.every(p=>(p.x===0||p.x===10)&&(p.y===0||p.y===10)));
});

test('Kleinstes Rechteck findet Größe und Winkel eines gedrehten Quadrats',()=>{
 const angle=Math.PI/6,points=[];
 for(const [u,v] of [[-40,-20],[40,-20],[40,20],[-40,20]])
  points.push({x:100+u*Math.cos(angle)-v*Math.sin(angle),y:80+u*Math.sin(angle)+v*Math.cos(angle)});
 const rect=minAreaRect(convexHull(points));
 assert.ok(Math.abs(rect.width-80)<1&&Math.abs(rect.height-40)<1);
 assert.ok(Math.abs(Math.abs(rect.angle)-angle)<0.02);
 assert.ok(Math.abs(rect.cx-100)<1&&Math.abs(rect.cy-80)<1);
});

test('Gerades Dokument wird mit korrekter Größe erkannt',()=>{
 const {gray,width,height}=scene({rectW:240,rectH:170});
 const rect=detectDocument(gray,width,height);
 assert.ok(rect,'kein Dokument erkannt');
 assert.ok(Math.abs(rect.width-240)<4&&Math.abs(rect.height-170)<4,`${rect.width}x${rect.height}`);
 assert.ok(Math.abs(rect.cx-200)<3&&Math.abs(rect.cy-150)<3);
 assert.ok(rect.fill>0.95);
});

test('Schräg fotografiertes Dokument liefert den Drehwinkel',()=>{
 for(const angle of [0.12,-0.2,0.35]){
  const {gray,width,height}=scene({rectW:220,rectH:150,angle});
  const rect=detectDocument(gray,width,height);
  assert.ok(rect,`kein Dokument bei ${angle}`);
  assert.ok(Math.abs(rect.angle-angle)<0.03,`Winkel ${rect.angle} statt ${angle}`);
  assert.ok(Math.abs(rect.width-220)<6&&Math.abs(rect.height-150)<6,`${rect.width}x${rect.height}`);
 }
});

test('Bildrauschen verhindert die Erkennung nicht',()=>{
 const {gray,width,height}=scene({angle:0.15,noise:25});
 const rect=detectDocument(gray,width,height);
 assert.ok(rect);
 assert.ok(Math.abs(rect.angle-0.15)<0.05);
});

test('Ohne erkennbares Blatt wird nicht zugeschnitten',()=>{
 const flat=new Uint8Array(400*300).fill(200);
 assert.equal(detectDocument(flat,400,300),null);
 // Bildfüllendes, gerades Blatt: Zuschnitt brächte nichts.
 const full=scene({rectW:398,rectH:298});
 assert.equal(detectDocument(full.gray,full.width,full.height),null);
 // Kleiner heller Fleck ist kein Dokument.
 const speck=scene({rectW:40,rectH:30});
 assert.equal(detectDocument(speck.gray,speck.width,speck.height),null);
});

test('Sehr schiefe Aufnahmen werden abgelehnt statt falsch gedreht',()=>{
 const {gray,width,height}=scene({rectW:200,rectH:140,angle:0.6});
 const rect=detectDocument(gray,width,height);
 // 0.6 rad entspricht nach Normalisierung ~-0.97 rad und liegt außerhalb des Rahmens.
 assert.ok(rect===null||Math.abs(rect.angle)<=0.44);
});
