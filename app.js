import {CLASSES,HVI_COLORS,PALETTES,escapeHTML as esc,makeBins,binIndex,nearestFacilities,visibleFeature,csvString} from './core.js';
const $=id=>document.getElementById(id), number=(v,d=2)=>Number.isFinite(v)?v.toLocaleString('en-US',{maximumFractionDigits:d}):'No data';
const metric=(key,label,unit,palette,group,note)=>({key,label,unit,palette,group,note});
const formatMetric=(value,m)=>number(value,m.unit==='index'?4:m.unit==='0–1'?3:2);
const common=[metric('HVI','Heat vulnerability index','0–1','heat','Index & domains','Higher values indicate greater relative vulnerability. Fixed HVI classes.'),
  metric('Exposure_s','Exposure score','0–1','heat','Index & domains','Normalized exposure domain: higher means more exposure.'),
  metric('Sensitivity_s','Sensitivity score','0–1','purple','Index & domains','Normalized sensitivity domain: higher means more sensitivity.'),
  metric('Adaptive_s','Adaptive capacity score','0–1','teal','Index & domains','Higher adaptive capacity represents greater protection.')];
const grid=[
  metric('LST_resampled','Land surface temperature','°C','heat','Exposure','2023 land surface temperature; this is not current air temperature.'),
  metric('Pop_density_resampled','Population density','source units','purple','Exposure','WorldPop 2020 supplied density values; source scaling is preserved.'),
  metric('Roads_resampled','Distance to roads','m','blue','Exposure','Raster-derived mean distance; lower values are nearer roads.'),
  metric('SVF_resampled','Sky view factor','0–1','blue','Exposure','Higher values mean a more open sky; the model reverses this indicator.'),
  metric('Industries_distance','Distance to industries','m','purple','Exposure','Raster-derived mean distance to industrial areas.'),
  metric('Informal_resampled','Distance to informal settlements','m','purple','Sensitivity','Raster-derived mean distance to informal settlements.'),
  metric('poverty_final','Poverty rate','%','purple','Sensitivity','Supplied poverty headcount estimate; not a new household survey.'),
  metric('Building_resampled','Distance to buildings','m','blue','Sensitivity','Raster-derived mean distance to building footprints.'),
  metric('NDBI_resampled','Built-up index (NDBI)','index','purple','Sensitivity','Normalized Difference Built-up Index; larger values indicate a stronger built-up signal.'),
  metric('Water_distance','Distance to water','m','blue','Adaptive capacity','Raster-derived mean distance; nearer water contributes to greater adaptive capacity.'),
  metric('NTL_resampled','Nighttime light','source units','purple','Adaptive capacity','Supplied nighttime light values; source units and scaling are preserved.'),
  metric('Hospitals_distance','Distance to healthcare','m','teal','Adaptive capacity','Raster-derived cell mean. This can differ from nearby-care point distances.'),
  metric('Green_distance','Distance to green space','m','teal','Adaptive capacity','Raster-derived mean distance; nearer green space contributes to greater adaptive capacity.')];
const ward=[
  metric('LST_mean','Land surface temperature','°C','heat','Exposure','2023 ward mean land surface temperature; not current air temperature.'),
  metric('Road_Density','Road density','source units','blue','Exposure','Supplied ward road-density values; source scaling is preserved.'),
  metric('industry%','Industrial area','%','purple','Exposure','Industrial land share of the ward.'),
  metric('Pop_Density','Population density','source units','purple','Exposure','WorldPop 2020 supplied population-density values; source scaling is preserved.'),
  metric('SVF_mean','Sky view factor','0–1','blue','Exposure','Ward mean sky view factor; the model reverses this indicator.'),
  metric('Poverty_HCR','Poverty rate','%','purple','Sensitivity','Supplied ward poverty headcount estimate.'),
  metric('build_km2','Building density','buildings/km²','blue','Sensitivity','Supplied ward building-density values.'),
  metric('informal%','Informal settlement area','%','purple','Sensitivity','Informal-settlement area share of the ward.'),
  metric('NDBI_media','Built-up index (NDBI)','index','purple','Sensitivity','Supplied ward NDBI median.'),
  metric('Green%','Green space','%','teal','Adaptive capacity','Green-space area share of the ward.'),
  metric('Blue%','Water area','%','blue','Adaptive capacity','Water-body area share of the ward.'),
  metric('Hosp_count','Healthcare facility count','facilities','teal','Adaptive capacity','Analytical ward facility count; it can differ from the separate nearby-care dataset.'),
  metric('NTL_median','Nighttime light','source units','purple','Adaptive capacity','Supplied ward nighttime-light median.')];
const state={scale:'grid',metric:'HVI',classes:new Set(CLASSES),top:false,opacity:.78,base:'light',datasets:{},meta:null,facilities:[],selected:null,origin:null,bins:[],ready:false};
// SVG avoids a large high-DPI canvas texture on phones and touch tablets.
const mobileRendering=matchMedia('(max-width: 999px), (pointer: coarse)').matches;
const map=L.map('map',{preferCanvas:!mobileRendering,renderer:mobileRendering?L.svg({padding:.1}):L.canvas({padding:.1}),
  zoomAnimation:!mobileRendering,fadeAnimation:!mobileRendering,markerZoomAnimation:!mobileRendering,
  inertia:!mobileRendering,zoomControl:false,center:[23.78,90.4],zoom:12});
let resizeTimer;
function refreshMapSize(){clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{
  if(document.hidden)return;
  map.invalidateSize({pan:false,animate:false,debounceMoveend:true});
  if(colorLayer)colorLayer.setStyle(style);
},120);}
const mapSizeObserver=new ResizeObserver(refreshMapSize);mapSizeObserver.observe($('map'));
window.addEventListener('pageshow',refreshMapSize);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshMapSize();});
L.control.zoom({position:'bottomright'}).addTo(map);L.control.scale({position:'bottomright',imperial:false}).addTo(map);
map.attributionControl.addAttribution('Road data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>');
map.createPane('selection');map.getPane('selection').style.zIndex=450;map.getPane('selection').style.pointerEvents='none';
const tiles={light:L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',{maxZoom:16,attribution:'Tiles © Esri — Esri, HERE, Garmin, OpenStreetMap contributors'}),
  street:L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}),
  satellite:L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles © Esri — Esri, Maxar, Earthstar Geographics, and the GIS User Community'}),
  dark:L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',{maxZoom:16,attribution:'Tiles © Esri — Esri, HERE, Garmin, OpenStreetMap contributors'})};
tiles.light.addTo(map);
let careRequest=0,routingWorker=null,routeJob=0;const routePromises=new Map();
let colorLayer=null,colorKey='',selection=L.layerGroup().addTo(map),careLayer=L.layerGroup().addTo(map),facilityLayer=L.layerGroup(),toastTimer,switchToken=0;
const metrics=()=>[...common,...(state.scale==='grid'?grid:ward)], current=()=>metrics().find(m=>m.key===state.metric)||common[0];
const features=()=>state.datasets[state.scale]?.features||[];
const visible=()=>features().filter(f=>visibleFeature(f.properties,state.classes,state.top,features().length));
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3500);}
function hideMobile(){ $('sidebar').classList.remove('mobile-open');$('mobileBtn').setAttribute('aria-expanded','false'); }
function populateMetrics(){const selected=state.metric;let html='';for(const group of ['Index & domains','Exposure','Sensitivity','Adaptive capacity']){html+=`<optgroup label="${group}">`+metrics().filter(m=>m.group===group).map(m=>`<option value="${esc(m.key)}">${esc(m.label)}</option>`).join('')+'</optgroup>';}$('metric').innerHTML=html;$('metric').value=metrics().some(m=>m.key===selected)?selected:'HVI';state.metric=$('metric').value;}
function updateScaleUI(){for(const s of ['grid','ward']){$(s+'Btn').classList.toggle('active',s===state.scale);$(s+'Btn').setAttribute('aria-pressed',String(s===state.scale));}
  $('scaleHint').textContent=state.scale==='grid'?`Clipped hexagons · ${number(features().length,0)} cells`:`${features().length} ward units · separately normalized`;
  $('areaSearch').placeholder=state.scale==='grid'?'Grid ID (e.g. 75)':'Ward name (e.g. DCC North W-01)';
  $('areas').innerHTML=state.scale==='ward'?features().map(f=>`<option value="${esc(f.properties.name)}"></option>`).join(''):'';
  $('classFilters').innerHTML=CLASSES.map((c,i)=>`<label class="class-filter"><input type="checkbox" data-class="${c}" ${state.classes.has(c)?'checked':''}><span class="swatch" style="background:${HVI_COLORS[i]}"></span><span>${c}</span><span class="count">${number(state.meta.scales[state.scale].classes[c],0)}</span></label>`).join('');
  $('classFilters').querySelectorAll('input').forEach(el=>el.addEventListener('change',()=>{el.checked?state.classes.add(el.dataset.class):state.classes.delete(el.dataset.class);draw();}));
}
function style(f){const p=f.properties,m=current(),index=state.metric==='HVI'?CLASSES.indexOf(p.HVI_Class):binIndex(p[m.key],state.bins),colors=state.metric==='HVI'?HVI_COLORS:PALETTES[m.palette];
  return {fillColor:index<0?'#aab8c0':colors[index],fillOpacity:state.opacity,weight:state.scale==='ward'?1.2:.35,color:state.base==='dark'?'#24394a':'#fff',opacity:.65};}
function featureTooltip(f){const p=f.properties,m=current();return `${esc(p.name)} · ${esc(m.label)}: ${formatMetric(p[m.key],m)}${m.unit==='0–1'?'':' '+esc(m.unit)}`;}
function draw(){if(!state.ready)return;const m=current();state.bins=makeBins(features().map(f=>f.properties[m.key]));
  const shown=visible(),key=JSON.stringify([state.scale,[...state.classes].sort(),state.top]);
  if(colorLayer&&key===colorKey){colorLayer.setStyle(style);colorLayer.eachLayer(layer=>layer.setTooltipContent(featureTooltip(layer.feature)));}
  else{if(colorLayer)map.removeLayer(colorLayer);colorKey=key;
  colorLayer=L.geoJSON({type:'FeatureCollection',features:shown},{style,onEachFeature(f,layer){
    layer.bindTooltip(featureTooltip(f),{sticky:true});
    layer.on('mouseover',()=>layer.setStyle({weight:state.scale==='ward'?2.5:1.1,color:'#18324a',fillOpacity:Math.min(1,state.opacity+.12)}));
    layer.on('mouseout',()=>colorLayer.resetStyle(layer));
    layer.on('click',e=>{L.DomEvent.stopPropagation(e);if($('careMode').checked)showCare([e.latlng.lng,e.latlng.lat]);else inspect(f);});
  }});}
  if($('layerToggle').checked)colorLayer.addTo(map);
  $('visibleCount').textContent=number(shown.length,0);$('meanScore').textContent=shown.length?number(shown.reduce((sum,f)=>sum+f.properties.HVI,0)/shown.length,3):'—';
  $('metricNote').textContent=m.note;$('downloadCsv').disabled=!shown.length;renderLegend();
  if(state.selected&&!shown.some(f=>f.properties.unit_id===state.selected.properties.unit_id)){clearSelection();}
}
function renderLegend(){const m=current(),colors=state.metric==='HVI'?HVI_COLORS:PALETTES[m.palette];let labels;
  if(state.metric==='HVI')labels=['Very Low · ≤ 0.20','Low · > 0.20–0.40','Moderate · > 0.40–0.60','High · > 0.60–0.80','Very High · > 0.80'];
  else{const b=state.bins.map(v=>formatMetric(v,m));labels=[`≤ ${b[0]}`,`> ${b[0]} – ${b[1]}`,`> ${b[1]} – ${b[2]}`,`> ${b[2]} – ${b[3]}`,`> ${b[3]}`];}
  $('legend').innerHTML=`<h3>${esc(m.label)}</h3><p>${state.metric==='HVI'?'Fixed HVI classes · relative within scale':`Within-scale quintiles · ${esc(m.unit)}<br>Tied values may create uneven groups.`}</p>`+labels.map((text,i)=>`<div class="legend-item"><span class="swatch" style="background:${colors[i]}"></span>${esc(text)}</div>`).join('');
  $('legend').hidden=!$('layerToggle').checked;
}
function clearSelection(){state.selected=null;selection.clearLayers();$('inspector').hidden=true;}
function inspect(feature){careRequest++;state.origin=null;careLayer.clearLayers();state.selected=feature;selection.clearLayers();const p=feature.properties;
  L.geoJSON(feature,{pane:'selection',interactive:false,style:{fill:false,color:'#11263c',weight:3}}).addTo(selection);
  $('details').innerHTML=`<span class="eyebrow">${state.scale==='grid'?'GRID CELL':'WARD PROFILE'}</span><h2>${esc(p.name)}</h2><div class="badge"><span class="swatch" style="background:${HVI_COLORS[CLASSES.indexOf(p.HVI_Class)]||'#aab8c0'}"></span>${esc(p.HVI_Class)} vulnerability</div><div class="score">${number(p.HVI,3)} <small>/ 1 HVI</small></div><p class="subtle">Rank ${number(p.Rank,0)} of ${number(features().length,0)} · ${number(p.Area_m2/1e6,4)} km²${p.Corporation?'<br>'+esc(p.Corporation):''}</p>`+
  [['Exposure_s','Exposure','#e98544'],['Sensitivity_s','Sensitivity','#a073b6'],['Adaptive_s','Adaptive capacity','#138b8b']].map(([key,label,color])=>`<div class="domain"><div class="domain-label"><span>${label}</span><b>${number(p[key],3)}</b></div><div class="bar"><span style="width:${Math.max(0,Math.min(100,p[key]*100))}%;background:${color}"></span></div></div>`).join('')+
  `<p class="subtle">Higher adaptive capacity means greater protection. Domain scores are normalized to 0–1.</p><button id="areaCare" class="outline-btn full">+ Five nearest facilities from this area</button><hr class="detail-divider"><span class="section-label">All 13 source indicators</span>`+
  (state.scale==='grid'?grid:ward).map(m=>`<div class="indicator-row"><span>${esc(m.label)}${p.imputed.includes(m.key)?' *':''}</span><b>${formatMetric(p[m.key],m)} ${esc(m.unit)}</b></div>`).join('')+
  (p.imputed.length?`<p class="imputed">* Mean-imputed indicators: ${p.imputed.map(k=>esc(metrics().find(m=>m.key===k)?.label||k)).join(', ')}.</p>`:'')+
  (state.scale==='grid'&&p.Area_m2<54125*.25?'<p class="imputed">Small clipped boundary fragment: less than 25% of a nominal full hexagon.</p>':'')+
  '<p class="subtle">Indicator values reflect the source datasets. Source years and coverage vary.</p><button id="downloadArea" class="outline-btn full">↓ Download this area (GeoJSON)</button>';
  $('areaCare').onclick=()=>{setTab('care');showCare(p.center,'Area representative point: '+p.name);};
  $('downloadArea').onclick=()=>download(`dhaka-${state.scale}-${p.unit_id}.geojson`,JSON.stringify({type:'FeatureCollection',features:[feature]}),'application/geo+json');
  $('inspector').hidden=false;hideMobile();$('inspector').scrollTop=0;
}
function facilityPopup(f){return `<b>${esc(f.properties.name)}</b><br>${esc(f.properties.type)}<br><small>Survey of Bangladesh, OSM &amp; Google Maps · status unverified</small>`;}
function renderFacilities(){facilityLayer.clearLayers();const selectedType=$('facilityType').value;state.facilities.filter(f=>selectedType==='all'||f.properties.type===selectedType).forEach(f=>{const [lng,lat]=f.geometry.coordinates;L.circleMarker([lat,lng],{radius:4,color:'#fff',weight:1.3,fillColor:'#138b8b',fillOpacity:.95}).bindPopup(facilityPopup(f)).addTo(facilityLayer);});
  if($('facilityToggle').checked)facilityLayer.addTo(map);else map.removeLayer(facilityLayer);
}
function roadRoutes(point,facilities){
  if(!routingWorker){routingWorker=new Worker('routing-worker.js');routingWorker.onmessage=({data})=>{const job=routePromises.get(data.id);if(!job)return;routePromises.delete(data.id);data.error?job.reject(Error(data.error)):job.resolve(data);};routingWorker.onerror=()=>{for(const job of routePromises.values())job.reject(Error('Road routing could not start. Use straight-line mode or retry.'));routePromises.clear();routingWorker.terminate();routingWorker=null;};}
  return new Promise((resolve,reject)=>{const id=++routeJob;routePromises.set(id,{resolve,reject});routingWorker.postMessage({id,point,facilities});});
}
async function showCare(point,label='Selected map location'){
  if(!state.ready)return;const request=++careRequest;clearSelection();state.origin={point,label};careLayer.clearLayers();hideMobile();
  const origin=[point[1],point[0]],road=$('distanceMode').value==='road';let nearest,summary='';
  if(road){$('inspector').hidden=false;$('details').innerHTML='<span class="eyebrow teal">NEARBY CARE</span><h2>Finding road routes…</h2><p class="subtle">The road map loads on first use. Please wait.</p>';
    try{const eligible=state.facilities.filter(f=>$('facilityType').value==='all'||f.properties.type===$('facilityType').value),result=await roadRoutes(point,eligible);if(request!==careRequest)return;
      const lookup=new Map(eligible.map(f=>[f.properties.id,f]));nearest=result.results.map(r=>({...r,feature:lookup.get(r.id)}));summary=`${result.reachable} of ${result.eligible} eligible facilities reachable on the mapped network.`;
    }catch(error){if(request!==careRequest)return;$('details').innerHTML=`<span class="eyebrow teal">NEARBY CARE</span><h2>No road route available</h2><p class="subtle">${esc(error.message)}</p><button id="useStraight" class="outline-btn full">Use straight-line distances</button>`;$('useStraight').onclick=()=>{$('distanceMode').value='straight';showCare(point,label);};return;}
  }else nearest=nearestFacilities(point,state.facilities,$('facilityType').value);
  const colors=['#138b8b','#4a80c4','#9d62b3','#d16b86','#d88d35'];
  L.marker(origin,{interactive:false,icon:L.divIcon({className:'',html:'<div class="origin-dot"></div>',iconSize:[17,17],iconAnchor:[8,8]})}).addTo(careLayer);
  if($('radiusToggle').checked)[1000,3000].forEach(r=>L.circle(origin,{radius:r,color:'#138b8b',weight:1,dashArray:'5 7',fillOpacity:.025,interactive:false}).bindTooltip(`${r/1000} km straight-line radius`).addTo(careLayer));
  nearest.forEach((r,i)=>{const f=r.feature,[lng,lat]=f.geometry.coordinates;
    if(road){const path=r.path.map(p=>[p[1],p[0]]);L.polyline(path,{color:colors[i],weight:4,opacity:.9,interactive:false}).addTo(careLayer);
      L.polyline([origin,path[0]],{color:colors[i],weight:2,dashArray:'3 6',interactive:false}).addTo(careLayer);L.polyline([path[path.length-1],[lat,lng]],{color:colors[i],weight:2,dashArray:'3 6',interactive:false}).addTo(careLayer);
    }else L.polyline([origin,[lat,lng]],{color:colors[i],weight:2,dashArray:'5 6',interactive:false}).addTo(careLayer);
    L.marker([lat,lng],{icon:L.divIcon({className:'',html:`<div class="facility-dot" style="background:${colors[i]}">${i+1}</div>`,iconSize:[23,23],iconAnchor:[11,11]})}).bindPopup(facilityPopup(f)).addTo(careLayer);
  });
  const distanceText=d=>d<1000?number(d,0)+' m':number(d/1000,2)+' km';
  $('details').innerHTML=`<span class="eyebrow teal">NEARBY CARE</span><h2>Five nearest facilities</h2><p class="subtle">${esc(label)}<br>${number(point[1],5)}° N, ${number(point[0],5)}° E</p><div class="distance-note">${road?'Ranked by estimated total distance: mapped road path plus dotted access links. Routes follow available one-way tags; traffic, closures and turn restrictions are not included.':'Ranked by straight-line distance to recorded locations. Road routes and travel times are not included.'}</div>`+
    nearest.map((r,i)=>{const f=r.feature;return `<div class="care-item"><div class="care-number" style="background:${colors[i]}">${i+1}</div><div><a href="https://www.google.com/maps/search/?api=1&query=${f.geometry.coordinates[1]},${f.geometry.coordinates[0]}" target="_blank" rel="noopener">${esc(f.properties.name)} ↗</a><p>${esc(f.properties.type)}</p><strong>${distanceText(r.distance)} ${road?'total':'straight-line'}</strong>${road?`<p>Road: ${distanceText(r.road_m)} · Access links: ${distanceText(r.origin_access_m+r.facility_access_m)}<br>Straight-line: ${distanceText(nearestFacilities(point,[f])[0].distance)}</p>`:''}</div></div>`;}).join('')+
    (!nearest.length?'<p class="subtle">No reachable facilities match this selection. Try another location or straight-line mode.</p>':'')+`<p class="subtle">${esc(summary)}<br>Healthcare sources: Survey of Bangladesh, OpenStreetMap and Google Maps. Current availability unverified.</p><button id="downloadCare" class="outline-btn full">↓ Download nearest facilities</button>`;
  $('downloadCare').onclick=()=>download('dhaka-nearby-care.csv',csvString(nearest.map((r,i)=>({rank:i+1,name:r.feature.properties.name,type:r.feature.properties.type,distance_mode:road?'road-network estimate':'straight-line',total_distance_m:Math.round(r.distance),road_distance_m:road?Math.round(r.road_m):'',access_links_m:road?Math.round(r.origin_access_m+r.facility_access_m):'',longitude:r.feature.geometry.coordinates[0],latitude:r.feature.geometry.coordinates[1],origin_longitude:point[0],origin_latitude:point[1],source:r.feature.properties.source}))),'text/csv');
  $('inspector').hidden=false;$('inspector').scrollTop=0;hideMobile();
  const mobile=window.matchMedia('(max-width:999px)').matches,points=[origin,...nearest.flatMap(r=>road?r.path.map(p=>[p[1],p[0]]):[[r.feature.geometry.coordinates[1],r.feature.geometry.coordinates[0]]])];
  map.stop();map.fitBounds(L.latLngBounds(points),{animate:false,maxZoom:15,paddingTopLeft:[30,70],paddingBottomRight:mobile?[30,Math.round(map.getSize().y*.49)+20]:[330,60]});
}
function setTab(tab){document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-selected',String(b.dataset.tab===tab));});$('exploreTab').hidden=tab!=='explore';$('careTab').hidden=tab!=='care';$('careMode').checked=tab==='care';$('mapHint').textContent=tab==='care'?'Tap anywhere to find nearby care':'Click an area to explore its story';map.getContainer().style.cursor=tab==='care'?'crosshair':'';}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
async function loadJSON(path){const response=await fetch(path);if(!response.ok)throw new Error(`${path}: HTTP ${response.status}`);return response.json();}
async function switchScale(scale){if(!state.ready||scale===state.scale)return;const token=++switchToken;$('gridBtn').disabled=$('wardBtn').disabled=true;$('status').hidden=false;
  $('metric').disabled=true;$('searchForm').querySelectorAll('input,button').forEach(el=>el.disabled=true);
  try{if(!state.datasets[scale])state.datasets[scale]=await loadJSON('data/'+(scale==='grid'?'hvi.geojson':'wards.geojson'));if(token!==switchToken)return;state.scale=scale;clearSelection();populateMetrics();updateScaleUI();draw();$('searchFeedback').textContent='';$('areaSearch').value='';if(state.origin)showCare(state.origin.point,state.origin.label);}
  catch(e){toast('Could not load this scale. Please try again.');console.error(e);}
  finally{$('status').hidden=true;$('gridBtn').disabled=$('wardBtn').disabled=false;$('metric').disabled=false;$('searchForm').querySelectorAll('input,button').forEach(el=>el.disabled=false);}
}
function cityExtent(){const bounds=L.geoJSON(state.datasets.grid).getBounds();map.stop();map.fitBounds(bounds,{animate:false,padding:[30,30]});}
function shareURL(){const u=new URL(location.href);u.search='';const center=map.getCenter();u.searchParams.set('scale',state.scale);u.searchParams.set('metric',state.metric);u.searchParams.set('lat',center.lat.toFixed(5));u.searchParams.set('lng',center.lng.toFixed(5));u.searchParams.set('z',map.getZoom());u.searchParams.set('classes',[...state.classes].join(','));if(state.top)u.searchParams.set('top','1');u.searchParams.set('base',state.base);u.searchParams.set('opacity',Math.round(state.opacity*100));u.searchParams.set('layer',$('layerToggle').checked?'1':'0');u.searchParams.set('facilities',$('facilityToggle').checked?'1':'0');u.searchParams.set('type',$('facilityType').value);u.searchParams.set('distance',$('distanceMode').value);u.searchParams.set('rings',$('radiusToggle').checked?'1':'0');if(state.origin){u.searchParams.set('care',state.origin.point.join(','));}else if(state.selected)u.searchParams.set('area',state.selected.properties.unit_id);return u.toString();}
function setBase(base){if(!tiles[base])return;map.removeLayer(tiles[state.base]);state.base=base;tiles[base].addTo(map);document.querySelectorAll('[data-base]').forEach(b=>{b.classList.toggle('active',b.dataset.base===base);b.setAttribute('aria-pressed',String(b.dataset.base===base));});draw();}
async function restoreURL(){const q=new URLSearchParams(location.search);if(q.get('scale')==='ward')await switchScale('ward');if(metrics().some(m=>m.key===q.get('metric')))state.metric=q.get('metric');$('metric').value=state.metric;
  if(q.has('classes'))state.classes=new Set(q.get('classes').split(',').filter(c=>CLASSES.includes(c)));state.top=q.get('top')==='1';$('topDecile').checked=state.top;
  if(q.has('opacity')&&Number.isFinite(+q.get('opacity'))){state.opacity=Math.max(0,Math.min(100,+q.get('opacity')))/100;$('opacity').value=state.opacity*100;$('opacityValue').textContent=Math.round(state.opacity*100)+'%';}
  if(q.get('layer')==='0')$('layerToggle').checked=false;if(q.get('facilities')==='1')$('facilityToggle').checked=true;if(['straight','road'].includes(q.get('distance')))$('distanceMode').value=q.get('distance');if(q.get('rings')==='0')$('radiusToggle').checked=false;
  if([...$('facilityType').options].some(o=>o.value===q.get('type')))$('facilityType').value=q.get('type');if(tiles[q.get('base')])setBase(q.get('base'));updateScaleUI();draw();renderFacilities();
  const lat=+q.get('lat'),lng=+q.get('lng'),z=+q.get('z');if(q.has('lat')&&q.has('lng')&&Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=22&&lat<=25&&lng>=89&&lng<=92)map.setView([lat,lng],Math.max(8,Math.min(19,z||12)));
  if(q.has('care')){const point=q.get('care').split(',').map(Number);if(point.length===2&&point.every(Number.isFinite)&&point[0]>=89&&point[0]<=92&&point[1]>=22&&point[1]<=25){setTab('care');showCare(point);}}
  else if(q.has('area')){const f=features().find(f=>f.properties.unit_id===q.get('area'));if(f&&visible().includes(f))inspect(f);}
}
async function init(){try{const [data,meta,care]=await Promise.all([loadJSON('data/hvi.geojson'),loadJSON('data/metadata.json'),loadJSON('data/healthcare.geojson')]);state.datasets.grid=data;state.meta=meta;state.facilities=care.features;state.ready=true;
  $('facilityCount').textContent=number(care.features.length,0);const types=[...new Set(care.features.map(f=>f.properties.type))].sort();$('facilityType').innerHTML='<option value="all">All recorded types</option>'+types.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');populateMetrics();updateScaleUI();draw();cityExtent();await restoreURL();$('status').hidden=true;}
  catch(e){$('status').hidden=true;$('error').hidden=false;$('errorText').textContent='Check your connection and reload. '+e.message;console.error(e);}}
$('metric').onchange=()=>{state.metric=$('metric').value;draw();};$('gridBtn').onclick=()=>switchScale('grid');$('wardBtn').onclick=()=>switchScale('ward');
$('topDecile').onchange=()=>{state.top=$('topDecile').checked;draw();};$('allClasses').onclick=()=>{state.classes=new Set(CLASSES);updateScaleUI();draw();};
$('opacity').oninput=()=>{state.opacity=+$('opacity').value/100;$('opacityValue').textContent=$('opacity').value+'%';if(colorLayer)colorLayer.setStyle(style);};
$('layerToggle').onchange=()=>{if(colorLayer)$('layerToggle').checked?colorLayer.addTo(map):map.removeLayer(colorLayer);renderLegend();};
document.querySelectorAll('[data-base]').forEach(b=>b.onclick=()=>setBase(b.dataset.base));document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
$('careMode').onchange=()=>{map.getContainer().style.cursor=$('careMode').checked?'crosshair':'';};map.on('click',e=>{if($('careMode').checked)showCare([e.latlng.lng,e.latlng.lat]);});
$('facilityToggle').onchange=renderFacilities;$('facilityType').onchange=()=>{renderFacilities();if(state.origin)showCare(state.origin.point,state.origin.label);};$('radiusToggle').onchange=()=>{if(state.origin)showCare(state.origin.point,state.origin.label);};
$('distanceMode').onchange=()=>{if(state.origin)showCare(state.origin.point,state.origin.label);};
$('clearCare').onclick=()=>{careRequest++;state.origin=null;careLayer.clearLayers();$('inspector').hidden=true;};$('closeInspector').onclick=()=>{careRequest++;clearSelection();state.origin=null;careLayer.clearLayers();};
$('searchForm').onsubmit=e=>{e.preventDefault();const query=$('areaSearch').value.trim().toLowerCase().replace(/^grid\s+/,'');const f=features().find(f=>f.properties.unit_id.toLowerCase()===query||f.properties.name.toLowerCase()===query);if(!f){$('searchFeedback').textContent='Area not found. Enter an exact grid ID or choose a ward.';return;}
  if(!visible().includes(f)){state.classes=new Set(CLASSES);state.top=false;$('topDecile').checked=false;updateScaleUI();draw();$('searchFeedback').textContent='Filters reset to show the selected area.';}else $('searchFeedback').textContent='';
  $('layerToggle').checked=true;colorLayer.addTo(map);renderLegend();map.stop();map.fitBounds(L.geoJSON(f).getBounds(),{animate:false,maxZoom:16,padding:[40,40]});inspect(f);};
$('downloadCsv').onclick=()=>download(`dhaka-${state.scale}-october-2026.csv`,csvString(visible().map(f=>f.properties)),'text/csv');$('resetView').onclick=()=>{if(state.ready)cityExtent();};
$('shareBtn').onclick=async()=>{if(!state.ready)return;const url=shareURL();try{await navigator.clipboard.writeText(url);history.replaceState(null,'',url);toast('Link copied: layers, filters and selection included.');}catch{history.replaceState(null,'',url);toast('View saved in the address bar. Copy its URL to share.');}};
$('mobileBtn').onclick=()=>{const open=$('sidebar').classList.toggle('mobile-open');$('mobileBtn').setAttribute('aria-expanded',String(open));};
$('aboutBtn').onclick=()=>$('about').showModal();$('closeAbout').onclick=()=>$('about').close();$('retryBtn').onclick=()=>location.reload();
init();
