// Publish presentation changes without restarting or changing the lead service.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {root,Client,access,exec,write}=require('./remote.cjs');
const target='/var/www/OZON-CDEK';
async function upload(sftp,local,remote,hashes=null,prefix=''){
 await new Promise((resolve,reject)=>sftp.mkdir(remote,error=>error&&error.code!==4?reject(error):resolve()));
 for(const item of fs.readdirSync(local,{withFileTypes:true}).sort((a,b)=>Number(a.name==='index.html')-Number(b.name==='index.html'))){
  const from=path.join(local,item.name),to=remote+'/'+item.name,relative=prefix+item.name;
  if(item.isDirectory())await upload(sftp,from,to,hashes,relative+'/');
  else{if(hashes&&hashes[relative]===crypto.createHash('sha256').update(fs.readFileSync(from)).digest('hex'))continue;await new Promise((resolve,reject)=>sftp.fastPut(from,to,error=>error?reject(error):resolve()));}
 }
}
const inventory="import os,hashlib,json; root='/var/www/OZON-CDEK/site'; print(json.dumps({os.path.relpath(os.path.join(d,n),root):hashlib.sha256(open(os.path.join(d,n),'rb').read()).hexdigest() for d,_,names in os.walk(root) for n in names}))";
const conn=new Client();conn.on('ready',async()=>{try{
 const hashes=JSON.parse(await exec(conn,"python3 -c '"+inventory.replaceAll("'","'\\''")+"'"));
 const sftp=await new Promise((resolve,reject)=>conn.sftp((error,value)=>error?reject(error):resolve(value)));
 await upload(sftp,path.join(root,'dist'),target+'/site',hashes);console.log('Публичная версия обновлена.');
 for(const dir of ['src','scripts'])await upload(sftp,path.join(root,dir),target+'/'+dir);
 for(const file of ['package.json','package-lock.json','index.html','vite.config.mjs','DESIGN.md','README.md'])await write(sftp,target+'/'+file,fs.readFileSync(path.join(root,file)));
 await exec(conn,`mkdir -p ${target}/public && cp -a ${target}/site/fonts ${target}/site/images ${target}/site/tutorials ${target}/public/ && cp ${target}/site/manifest.webmanifest ${target}/site/robots.txt ${target}/site/sitemap.xml ${target}/public/`);
 console.log('Исходники и материалы синхронизированы. Конфигурация Telegram не изменялась.');
}catch(error){console.error(error.message);process.exitCode=1;}finally{conn.end();}}).on('error',error=>{console.error(error.name);process.exitCode=1;}).connect(access());
