import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../routing-core.js';
const {createEngine}=globalThis.HVIRouting;
const graph=(direction=1)=>({max_snap_m:500,nodes:[[0,0],[10,0],[10,10],[0,10],[100,100],[110,100]],edges:[[0,1,10,direction],[1,2,10,1],[2,3,10,1],[3,0,10,1],[4,5,10,0]]});
test('one-way routing takes the full detour in reverse and the direct sub-edge forward',()=>{
  const e=createEngine(graph());const origin={edge:0,t:.8,offset:2};
  const reverse=e.routes(origin,[{id:'reverse',snap:{edge:0,t:.2,offset:3}}])[0];
  assert.equal(reverse.road_m,34);assert.equal(reverse.distance,39);assert.ok(reverse.path.some(p=>p[1]===10));
  const forward=e.routes({edge:0,t:.2,offset:0},[{id:'forward',snap:{edge:0,t:.8,offset:0}}])[0];
  assert.ok(Math.abs(forward.road_m-6)<1e-10);assert.equal(forward.path.length,2);
});
test('two-way roads allow reverse movement and zero length at a coincident snapped point',()=>{
  const e=createEngine(graph(0));assert.ok(Math.abs(e.routes({edge:0,t:.8,offset:0},[{id:'x',snap:{edge:0,t:.2,offset:0}}])[0].road_m-6)<1e-10);
  assert.equal(e.routes({edge:0,t:.5,offset:0},[{id:'x',snap:{edge:0,t:.5,offset:0}}])[0].road_m,0);
});
test('disconnected roads never produce a made-up connection',()=>{
  const e=createEngine(graph());assert.equal(e.routes({edge:0,t:.5,offset:0},[{id:'island',snap:{edge:4,t:.5,offset:0}}]).length,0);
  assert.equal(e.snap([10000,10000]),null);assert.equal(e.snap([5,2]).offset,2);
});
test('real graph has valid metric edges, unique projected nodes and all facility snaps',()=>{
  const g=JSON.parse(fs.readFileSync(new URL('../data/road-network.json',import.meta.url)));assert.equal(g.crs,'EPSG:32646');assert.equal(g.stats.source_roads,24397);assert.equal(Object.keys(g.facilities).length,402);
  const unique=new Set(g.nodes.map(p=>p[0]+','+p[1]));assert.equal(unique.size,g.nodes.length);
  for(const [a,b,w,d] of g.edges){assert.ok(g.nodes[a]&&g.nodes[b]&&w>0);assert.ok([-1,0,1].includes(d));assert.ok(Math.abs(Math.hypot(g.nodes[a][0]-g.nodes[b][0],g.nodes[a][1]-g.nodes[b][1])-w)<.001);}
  for(const s of Object.values(g.facilities)){assert.ok(s.t>=0&&s.t<=1&&s.offset<=500&&g.edges[s.edge]);}
});
