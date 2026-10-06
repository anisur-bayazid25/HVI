import test from 'node:test';
import {readdirSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

test('published text assets use valid UTF-8',()=>{
  const root=fileURLToPath(new URL('../',import.meta.url));
  const files=readdirSync(root).filter(n=>/\.(md|html|js|css)$/.test(n))
    .concat(readdirSync(join(root,'docs')).filter(n=>n.endsWith('.md')).map(n=>'docs/'+n));
  for(const file of files){
    try{new TextDecoder('utf-8',{fatal:true}).decode(readFileSync(join(root,file)));}
    catch(error){throw new Error(`${file}: ${error.message}`);}
  }
});
