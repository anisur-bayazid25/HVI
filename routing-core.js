/* Directed routing in projected metres; shared by the worker and regression tests. */
(() => {
  class Heap {
    constructor(){this.items=[];}
    push(value){const a=this.items;a.push(value);let i=a.length-1;while(i){const p=(i-1)>>1;if(a[p][0]<=value[0])break;a[i]=a[p];i=p;}a[i]=value;}
    pop(){const a=this.items,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1][0]<a[c][0])c++;if(a[c][0]>=last[0])break;a[i]=a[c];i=c;}a[i]=last;}return first;}
  }
  function createEngine(graph){
    const {nodes,edges}=graph,adj=Array.from({length:nodes.length},()=>[]),buckets=new Map(),size=250;
    edges.forEach(([a,b,length,dir],index)=>{if(dir!==-1)adj[a].push([b,length]);if(dir!==1)adj[b].push([a,length]);
      for(let x=Math.floor(Math.min(nodes[a][0],nodes[b][0])/size);x<=Math.floor(Math.max(nodes[a][0],nodes[b][0])/size);x++)
        for(let y=Math.floor(Math.min(nodes[a][1],nodes[b][1])/size);y<=Math.floor(Math.max(nodes[a][1],nodes[b][1])/size);y++){const key=x+','+y;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(index);}});
    function snap(point){let best=null;const candidates=new Set(),bx=Math.floor(point[0]/size),by=Math.floor(point[1]/size),radius=Math.ceil((graph.max_snap_m||500)/size)+1;
      for(let x=bx-radius;x<=bx+radius;x++)for(let y=by-radius;y<=by+radius;y++)for(const e of buckets.get(x+','+y)||[])candidates.add(e);
      for(const i of candidates){const [a,b]=edges[i],u=nodes[a],v=nodes[b],dx=v[0]-u[0],dy=v[1]-u[1],t=Math.max(0,Math.min(1,((point[0]-u[0])*dx+(point[1]-u[1])*dy)/(dx*dx+dy*dy))),offset=Math.hypot(point[0]-u[0]-t*dx,point[1]-u[1]-t*dy);if(!best||offset<best.offset)best={edge:i,t,offset};}
      return best&&best.offset<=(graph.max_snap_m||500)?best:null;
    }
    function snapXY(s){const [a,b]=edges[s.edge];return [nodes[a][0]+s.t*(nodes[b][0]-nodes[a][0]),nodes[a][1]+s.t*(nodes[b][1]-nodes[a][1])];}
    function routes(origin,targets){const distances=new Float64Array(nodes.length).fill(Infinity),parents=new Int32Array(nodes.length).fill(-1),heap=new Heap();const [a,b,length,dir]=edges[origin.edge];
      function seed(n,d){if(d<distances[n]){distances[n]=d;heap.push([d,n]);}}
      if(dir!==1||origin.t===0)seed(a,length*origin.t);if(dir!==-1||origin.t===1)seed(b,length*(1-origin.t));
      while(heap.items.length){const [distance,u]=heap.pop();if(distance!==distances[u])continue;for(const [v,w] of adj[u]){const candidate=distance+w;if(candidate<distances[v]){distances[v]=candidate;parents[v]=u;heap.push([candidate,v]);}}}
      const found=[];
      for(const target of targets){const s=target.snap;if(!s)continue;const [u,v,w,direction]=edges[s.edge];let road=Infinity,via=-1,direct=false;
        if(direction!==-1||s.t===0){const cost=distances[u]+s.t*w;if(cost<road){road=cost;via=u;}}
        if(direction!==1||s.t===1){const cost=distances[v]+(1-s.t)*w;if(cost<road){road=cost;via=v;}}
        if(s.edge===origin.edge&&((dir!==1&&s.t<=origin.t)||(dir!==-1&&s.t>=origin.t))){const cost=Math.abs(s.t-origin.t)*length;if(cost<=road){road=cost;direct=true;}}
        if(!Number.isFinite(road))continue;
        const path=[];if(!direct){let n=via;while(n!==-1){path.push(nodes[n].slice(0,2));n=parents[n];}path.reverse();}path.unshift(snapXY(origin));path.push(snapXY(s));
        found.push({id:target.id,road_m:road,origin_access_m:origin.offset,facility_access_m:s.offset,distance:road+origin.offset+s.offset,path});
      }
      return found.sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id));
    }
    return {snap,routes,snapXY};
  }
  globalThis.HVIRouting={createEngine};
})();
