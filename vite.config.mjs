import {defineConfig} from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
// CopyFile fails intermittently for MP4 on this Windows volume; byte copying keeps builds reliable.
function copyPublic(source,destination){
 fs.mkdirSync(destination,{recursive:true});
 for(const entry of fs.readdirSync(source,{withFileTypes:true})){
  const from=path.join(source,entry.name),to=path.join(destination,entry.name);
  if(entry.isDirectory())copyPublic(from,to);
  else if(entry.isFile()){
   const temporary=`${to}.copying`;
   const bytes=fs.readFileSync(from),descriptor=fs.openSync(temporary,'w');
   try{let offset=0;while(offset<bytes.length){let written=false;for(let attempt=0;attempt<8&&!written;attempt++){try{offset+=fs.writeSync(descriptor,bytes,offset,Math.min(16384,bytes.length-offset),offset);written=true;}catch(error){if(attempt===7)throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,25);}}}}
   catch(error){throw new Error(`Public asset write failed: ${to}`,{cause:error});}
   finally{fs.closeSync(descriptor);}
   fs.renameSync(temporary,to);
  }
 }
}
export default defineConfig({
 build:{copyPublicDir:false},
 plugins:[{name:'reliable-public-assets',writeBundle(options){copyPublic(path.join(root,'public'),path.resolve(root,options.dir||'dist'));}}],
});
