"""Build a directed road graph from shared source vertices, preserving grade-separated crossings."""
import argparse, hashlib, json, math
from pathlib import Path
import shapefile
from pyproj import CRS, Transformer
from shapely.geometry import LineString, Point
from shapely.strtree import STRtree

def export(root, out):
    source=root/'Final Data/All_roads_OSM_UTM46N.shp'
    crs=CRS.from_wkt(source.with_suffix('.prj').read_text())
    to_geo=Transformer.from_crs(crs,4326,always_xy=True)
    to_xy=Transformer.from_crs(4326,crs,always_xy=True)
    nodes=[]; ids={}; edges=[]; seen=set(); road_count=0
    def node(p):
        xy=(round(p[0],2),round(p[1],2))
        if xy not in ids:
            ids[xy]=len(nodes); lng,lat=to_geo.transform(*xy)
            nodes.append([*xy,round(lng,6),round(lat,6)])
        return ids[xy]
    for item in shapefile.Reader(str(source),encoding='utf-8').iterShapeRecords():
        props=item.record.as_dict(); tag=props['oneway'].strip().lower()
        # Reversible roads have no reliable static direction; omit this one record.
        if tag=='reversible': continue
        direction=1 if tag in ('yes','1','true') else -1 if tag=='-1' else 0
        road_count+=1
        parts=list(item.shape.parts)+[len(item.shape.points)]
        for start,end in zip(parts,parts[1:]):
            for a,b in zip(item.shape.points[start:end],item.shape.points[start+1:end]):
                u,v=node(a),node(b)
                if u==v: continue
                key=(u,v,direction)
                if key in seen: continue
                seen.add(key); length=math.dist(nodes[u][:2],nodes[v][:2])
                edges.append([u,v,round(length,3),direction])
    lines=[LineString([nodes[e[0]][:2],nodes[e[1]][:2]]) for e in edges]
    tree=STRtree(lines); snaps={}; unsnapped=0
    facilities=json.loads((out/'healthcare.geojson').read_text(encoding='utf-8'))['features']
    for f in facilities:
        p=Point(to_xy.transform(*f['geometry']['coordinates'])); edge=int(tree.nearest(p)); line=lines[edge]
        t=line.project(p,normalized=True); q=line.interpolate(t,normalized=True); offset=p.distance(q)
        if offset>500: unsnapped+=1;continue
        snaps[f['properties']['id']]={'edge':edge,'t':round(t,9),'offset':round(offset,3)}
    graph={'crs':'EPSG:32646','nodes':nodes,'edges':edges,'facilities':snaps,'max_snap_m':500,
           'source':'OpenStreetMap compiled road layer','source_year':'Not documented',
           'stats':{'source_roads':road_count,'nodes':len(nodes),'edges':len(edges),'snapped_facilities':len(snaps),'unsnapped_facilities':unsnapped}}
    (out/'road-network.json').write_text(json.dumps(graph,separators=(',',':')),encoding='utf-8')
    audit={'source_sha256':{source.with_suffix(s).name:hashlib.sha256(source.with_suffix(s).read_bytes()).hexdigest() for s in ['.shp','.dbf','.shx','.prj','.cpg']},'stats':graph['stats']}
    (out/'road-audit.json').write_text(json.dumps(audit,separators=(',',':')),encoding='utf-8')
    print(json.dumps(graph['stats']))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--workspace',type=Path,required=True);p.add_argument('--out',type=Path,default=Path(__file__).resolve().parents[1]/'data');a=p.parse_args();export(a.workspace,a.out)
