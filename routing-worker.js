importScripts('vendor/proj4.js','routing-core.js');
let graph,engine,loading;
const projection='+proj=utm +zone=46 +datum=WGS84 +units=m +no_defs';
async function ready(){if(!loading)loading=fetch('data/road-network.json').then(r=>{if(!r.ok)throw Error('The road layer could not load.');return r.json();}).then(g=>{graph=g;engine=HVIRouting.createEngine(g);});return loading;}
self.onmessage=async({data})=>{try{await ready();const origin=engine.snap(proj4('EPSG:4326',projection,data.point));if(!origin){self.postMessage({id:data.id,error:'No mapped road within 500 m of this location. Try a point closer to a road.'});return;}
  const targets=data.facilities.map(f=>({id:f.properties.id,snap:graph.facilities[f.properties.id]}));const results=engine.routes(origin,targets);
  const selected=results.slice(0,5).map(r=>({...r,path:r.path.map(p=>proj4(projection,'EPSG:4326',p))}));
  self.postMessage({id:data.id,results:selected,reachable:results.length,eligible:targets.length});
}catch(error){loading=null;self.postMessage({id:data.id,error:'Road routing is unavailable. Please retry or use straight-line mode.'});}};
