const fs=require('node:fs'),path=require('node:path'),{Client}=require('ssh2');
const root=path.resolve(__dirname,'..');
function access(){const raw=fs.readFileSync(path.join(root,'info/VPS.txt'),'utf8'),field=n=>raw.match(new RegExp(n+':\\s*(.*)'))?.[1]?.trim();return{host:field('Адрес'),username:field('Логин'),password:field('Пароль'),readyTimeout:20000};}
function exec(conn,cmd){return new Promise((resolve,reject)=>conn.exec(cmd,(e,s)=>{if(e)return reject(e);let out='';s.on('data',d=>out+=d);s.stderr.on('data',d=>out+=d);s.on('close',code=>code===0?resolve(out):reject(Error(out)));}));}
function write(sftp,file,content,mode=0o644){return new Promise((resolve,reject)=>{const s=sftp.createWriteStream(file,{mode});s.on('close',resolve);s.on('error',reject);s.end(content);});}
module.exports={root,access,exec,write,Client};
if(require.main===module){const conn=new Client();conn.on('ready',async()=>{try{console.log(await exec(conn,'cat /etc/nginx/sites-enabled/outmax-editor'));}catch(e){console.error(e.message);}finally{conn.end();}}).on('error',e=>{console.error(e.message);process.exitCode=1;}).connect(access());}
