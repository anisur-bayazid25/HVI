"""Export completed October HVI outputs; never refit or modify the analysis."""
import argparse, csv, hashlib, json, math, sqlite3
from pathlib import Path
import shapefile
from pyproj import CRS, Transformer
from shapely import from_wkb
from shapely.geometry import mapping, shape
from shapely.ops import transform

def read_csv(path):
    with path.open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))

def number(v):
    try:
        n = float(v)
        return round(n, 8) if math.isfinite(n) else None
    except (ValueError, TypeError):
        return v

def clean_coords(v):
    if isinstance(v, (tuple, list)):
        return [clean_coords(x) for x in v]
    return round(v, 6) if isinstance(v, float) else v

def write(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':'), allow_nan=False), encoding='utf-8')

def export(root, out):
    results = root / 'October 2026/results_combined_70PA'
    sources = []
    meta = {'version': '2.0.0', 'results_date': '2026-10-05', 'release_date': '2026-10-06',
            'method': 'Primary_70_PA', 'scales': {},
            'healthcare_source': 'Survey of Bangladesh: supplied updated facility layer; survey currency and operational status unverified',
            'distance_method': 'Great-circle straight-line distance (Haversine), not road distance or travel time'}
    def source(p):
        sources.append({'path': p.relative_to(root).as_posix(), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()})
        return p
    out.mkdir(parents=True, exist_ok=True)
    for scale, key in [('grid', 'Grid_ID'), ('ward', 'Ward_Name')]:
        base = results / scale
        table = source(base / '04_HVI_Results' / f'HVI_Final_{scale}.csv')
        rows = read_csv(table)
        inputs = source(base / '01_Input_Audit' / ('Analysis_Input_Aligned_Imputed.csv' if scale == 'grid' else 'Indicators_Aligned.csv'))
        raw = {r[key]: r for r in read_csv(inputs)}
        scores = {r[key]: r for r in rows}
        assert len(scores) == len(rows) and set(raw) == set(scores)
        gpkg = source(base / '07_Maps' / f'{scale}_HVI_All_Methods.gpkg')
        con = sqlite3.connect(gpkg)
        con.row_factory = sqlite3.Row
        tr = Transformer.from_crs(32646, 4326, always_xy=True).transform
        missing = {}
        if scale == 'grid':
            p = source(base / '01_Input_Audit/Imputed_Cells.csv')
            for r in read_csv(p):
                missing.setdefault(r[key], []).append(r['Indicator'])
        else:
            audit = read_csv(source(base / '01_Input_Audit/Missingness_And_Imputation.csv'))
            assert all(int(r['Missing_Count']) == 0 for r in audit), 'Ward imputation flags require an updated per-unit missingness audit.'
        features = []
        for r in con.execute('select * from Primary_70_PA'):
            ident = str(int(r[key])) if scale == 'grid' else r[key]
            assert ident in scores, f'Unknown spatial key {ident}'
            blob = r['geom']
            envelope = (blob[3] >> 1) & 7
            geom = from_wkb(blob[8 + {0:0, 1:32, 2:48, 3:48, 4:64}[envelope]:])
            assert geom.is_valid and not geom.is_empty
            props = {k: number(v) for k, v in scores[ident].items()}
            for k, v in raw[ident].items():
                if k != key: props[k] = number(v)
            props['unit_id'] = ident
            props['name'] = f'Grid {ident}' if scale == 'grid' else ident
            props['imputed'] = missing.get(ident, [])
            props['center'] = clean_coords(mapping(transform(tr, geom.representative_point()))['coordinates'])
            assert abs(props['HVI'] - r['HVI']) < 1e-7
            expected = ['Very Low','Low','Moderate','High','Very High'][sum(props['HVI'] > x for x in [.2,.4,.6,.8])]
            assert expected == props['HVI_Class']
            g = mapping(transform(tr, geom))
            features.append({'type':'Feature', 'properties':props,
                             'geometry':{'type':g['type'], 'coordinates':clean_coords(g['coordinates'])}})
        assert len(features) == len(rows)
        write(out / ('hvi.geojson' if scale == 'grid' else 'wards.geojson'), {'type':'FeatureCollection','features':features})
        weights = read_csv(source(base / '03_Weights/Domain_Weights.csv'))
        meta['scales'][scale] = {'count':len(rows), 'classes':{c:sum(r['HVI_Class']==c for r in rows) for c in ['Very Low','Low','Moderate','High','Very High']},
            'weights':{r['Domain']:float(r['Weight']) for r in weights if r['Scenario']=='Primary_70_PA'}}
    shp = source(root / 'Final Data/Dhaka_Health_Facilities_SoB_updated.shp')
    for suffix in ['.dbf','.shx','.prj','.cpg']: source(shp.with_suffix(suffix))
    crs = CRS.from_wkt(shp.with_suffix('.prj').read_text())
    tr = Transformer.from_crs(crs, 4326, always_xy=True).transform
    facilities = []; seen = set()
    for r in shapefile.Reader(str(shp), encoding='utf-8').iterShapeRecords():
        p = r.record.as_dict(); geom = transform(tr, shape(r.shape.__geo_interface__))
        point = geom if geom.geom_type == 'Point' else geom.representative_point()
        name = p.get('F_Name','').strip() or 'Unnamed facility'
        token = (name.casefold(), round(point.x,6), round(point.y,6))
        if token in seen: continue
        seen.add(token)
        assert 89 < point.x < 92 and 22 < point.y < 25
        facilities.append({'type':'Feature','properties':{'id':f'sob-{len(facilities)+1}', 'name':name,
            'type':p.get('F_Type','').strip() or 'Unspecified facility', 'source':'Survey of Bangladesh'},
            'geometry':{'type':'Point','coordinates':clean_coords([point.x,point.y])}})
    write(out / 'healthcare.geojson', {'type':'FeatureCollection','features':facilities})
    meta['healthcare_count'] = len(facilities); meta['sources'] = sources
    write(out / 'metadata.json', meta)
    print(json.dumps({'scales':meta['scales'], 'healthcare_count':len(facilities)}, indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--workspace', type=Path, required=True)
    parser.add_argument('--out', type=Path, default=Path(__file__).resolve().parents[1] / 'data')
    args = parser.parse_args(); export(args.workspace, args.out)
