export const CLASSES=['Very Low','Low','Moderate','High','Very High'];
export const HVI_COLORS=['#27866d','#91c7a4','#f5d96a','#ed9952','#ca4760'];
export const PALETTES={heat:['#fff0b3','#ffd16c','#fba35b','#e96946','#b72b47'],blue:['#dce9fa','#afccef','#79a6d8','#477db5','#254f82'],teal:['#e0f4ec','#b0decb','#6dbfa8','#309c8c','#14766f'],purple:['#ede5f7','#d0b7e6','#b18ad1','#8c5cad','#603980']};
export function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function classify(score){if(!Number.isFinite(score))return 'Unclassified';return CLASSES[[.2,.4,.6,.8].filter(x=>score>x).length];}
export function haversine(a,b){const rad=Math.PI/180,dlat=(b[1]-a[1])*rad,dlon=(b[0]-a[0])*rad;const x=Math.sin(dlat/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin(dlon/2)**2;return 6371008.8*2*Math.atan2(Math.sqrt(Math.min(1,x)),Math.sqrt(Math.max(0,1-x)));}
export function nearestFacilities(point,features,type='all',limit=5){return features.filter(f=>type==='all'||f.properties.type===type).map(f=>({feature:f,distance:haversine(point,f.geometry.coordinates)})).sort((a,b)=>a.distance-b.distance||a.feature.properties.id.localeCompare(b.feature.properties.id)).slice(0,limit);}
export function quantile(values,q){const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b);if(!sorted.length)return null;const at=(sorted.length-1)*q,lo=Math.floor(at);return sorted[lo]+(sorted[Math.ceil(at)]-sorted[lo])*(at-lo);}
export function makeBins(values){return [.2,.4,.6,.8].map(q=>quantile(values,q));}
export function binIndex(value,bins){return Number.isFinite(value)?bins.filter(b=>value>b).length:-1;}
export function visibleFeature(p,classes,topDecile,count){return classes.has(p.HVI_Class)&&(!topDecile||p.Rank<=Math.ceil(count*.1));}
export function csvString(rows){if(!rows.length)return '';const keys=Object.keys(rows[0]);const cell=v=>'"'+String(Array.isArray(v)?v.join('; '):v??'').replace(/"/g,'""')+'"';return [keys.map(cell).join(','),...rows.map(r=>keys.map(k=>cell(r[k])).join(','))].join('\r\n');}
