import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classify,haversine,nearestFacilities,makeBins,binIndex,visibleFeature,csvString,escapeHTML,CLASSES} from '../core.js';
const data=name=>JSON.parse(fs.readFileSync(new URL('../data/'+name,import.meta.url)));
test('class boundaries match R cut() right-closed intervals, including zero',()=>{
  assert.deepEqual([0,.2,.200001,.4,.6,.8,1].map(classify),['Very Low','Very Low','Low','Low','Moderate','High','Very High']);
  assert.equal(classify(null),'Unclassified');
});
test('distance is geodesic, zero at origin and symmetric',()=>{
  assert.equal(haversine([90,24],[90,24]),0);assert.ok(Math.abs(haversine([0,0],[1,0])-111195)<5);
  assert.equal(haversine([90.4,23.8],[90.5,23.9]),haversine([90.5,23.9],[90.4,23.8]));
});
test('nearest five uses actual distance and type filter, with fewer than five handled',()=>{
  const f=[8,1,5,2,7,3,4,6].map(i=>({properties:{id:String(i),type:i%2?'Clinic':'Hospital'},geometry:{coordinates:[90+i*.001,24]}}));
  assert.deepEqual(nearestFacilities([90,24],f).map(x=>x.feature.properties.id),['1','2','3','4','5']);
  assert.deepEqual(nearestFacilities([90,24],f,'Hospital').map(x=>x.feature.properties.id),['2','4','6','8']);
  assert.equal(nearestFacilities([90,24],f,'missing').length,0);
});
test('quintiles preserve zero, ties, missingness and negative values',()=>{
  const b=makeBins([0,1,2,3,4,5,6,7,8,9,10]);assert.deepEqual(b,[2,4,6,8]);assert.equal(binIndex(0,b),0);assert.equal(binIndex(2,b),0);assert.equal(binIndex(null,b),-1);assert.equal(binIndex(-1,b),0);
});
test('class and top-decile filters intersect and allow an empty result',()=>{
  const p={HVI_Class:'High',Rank:5};assert.ok(visibleFeature(p,new Set(['High']),true,100));assert.ok(!visibleFeature(p,new Set(['Low']),true,100));assert.ok(!visibleFeature({...p,Rank:11},new Set(['High']),true,100));assert.ok(!visibleFeature(p,new Set(),false,100));
});
test('popup escaping and downloadable CSV safely preserve values',()=>{
  assert.equal(escapeHTML('<script>"&'), '&lt;script&gt;&quot;&amp;');assert.equal(csvString([{name:'a,"b',n:0}]),'"name","n"\r\n"a,""b","0"');
});
test('release datasets have complete keyed results, geographic geometry and correct metadata',()=>{
  const meta=data('metadata.json');for(const [scale,file] of [['grid','hvi.geojson'],['ward','wards.geojson']]){
    const geo=data(file),ids=new Set(),counts=Object.fromEntries(CLASSES.map(c=>[c,0]));assert.equal(geo.features.length,scale==='grid'?7706:134);
    for(const f of geo.features){const p=f.properties;assert.ok(!ids.has(p.unit_id));ids.add(p.unit_id);assert.equal(p.HVI_Class,classify(p.HVI));counts[p.HVI_Class]++;assert.ok(p.HVI>=0&&p.HVI<=1);assert.ok(p.center[0]>89&&p.center[0]<92&&p.center[1]>22&&p.center[1]<25);assert.ok(Array.isArray(p.imputed));assert.ok(f.geometry.coordinates.length);}
    assert.deepEqual(counts,meta.scales[scale].classes);assert.ok(Math.abs(Object.values(meta.scales[scale].weights).reduce((a,b)=>a+b,0)-1)<1e-12);
  }
  const care=data('healthcare.geojson');assert.equal(care.features.length,402);for(const f of care.features){assert.ok(f.properties.name);assert.equal(f.geometry.type,'Point');}
});
