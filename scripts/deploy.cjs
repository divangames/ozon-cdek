// Only this application's folder and its explicit preview route are changed.
const fs=require('node:fs'),path=require('node:path');
const {root,access,exec,write,Client}=require('./remote.cjs');
const target='/var/www/OZON-CDEK',configuration='/etc/nginx/sites-enabled/outmax-editor';
const service=`[Unit]\nDescription=OZON CDEK contact form\nAfter=network-online.target\nWants=network-online.target\n\n[Service]\nUser=www-data\nGroup=www-data\nWorkingDirectory=${target}/server\nEnvironmentFile=${target}/.private/telegram.env\nEnvironment=LEADS_DB=${target}/data/leads.sqlite3\nEnvironment=LEADS_PORT=4193\nExecStart=/usr/bin/python3 ${target}/server/leads.py\nRestart=on-failure\nRestartSec=3\nUMask=0077\nNoNewPrivileges=true\nPrivateTmp=true\nProtectSystem=strict\nProtectHome=true\nReadWritePaths=${target}/data\n\n[Install]\nWantedBy=multi-user.target\n`;
async function upload(sftp,local,remote){
 await new Promise((resolve,reject)=>sftp.mkdir(remote,e=>e&&e.code!==4?reject(e):resolve()));
 for(const item of fs.readdirSync(local,{withFileTypes:true}).sort((a,b)=>Number(a.name==='index.html')-Number(b.name==='index.html'))){if(item.name==='__pycache__')continue;const from=path.join(local,item.name),to=remote+'/'+item.name;if(item.isDirectory())await upload(sftp,from,to);else await new Promise((resolve,reject)=>sftp.fastPut(from,to,e=>e?reject(e):resolve()));}
}
function read(sftp,file){return new Promise((resolve,reject)=>{let body='';const s=sftp.createReadStream(file,{encoding:'utf8'});s.on('data',d=>body+=d);s.on('end',()=>resolve(body));s.on('error',reject);});}
if(!fs.existsSync(path.join(root,'dist/index.html')))throw Error('Сначала npm run build');
const config=access(),conn=new Client();
conn.on('ready',async()=>{let oldConfig,sftp;try{
 await exec(conn,`install -d -m 755 ${target} ${target}/site ${target}/server && install -d -m 700 ${target}/.private && install -d -m 700 -o www-data -g www-data ${target}/data`);
 sftp=await new Promise((resolve,reject)=>conn.sftp((e,s)=>e?reject(e):resolve(s)));
 await upload(sftp,path.join(root,'dist'),target+'/site');console.log('Сайт и медиа загружены');
 for(const dir of ['src','scripts','server','deploy'])await upload(sftp,path.join(root,dir),target+'/'+dir);
 for(const file of ['package.json','package-lock.json','index.html','vite.config.mjs','README.md','PRODUCT.md','DESIGN.md','.gitignore'])if(fs.existsSync(path.join(root,file)))await write(sftp,target+'/'+file,fs.readFileSync(path.join(root,file)));
 const credentials=Object.fromEntries(fs.readFileSync(path.join(root,'info/Telegram.txt'),'utf8').split(/\r?\n/).filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim()];}));
 if(!/^\d{6,}:[A-Za-z0-9_-]{20,}$/.test(credentials.TELEGRAM_BOT_TOKEN||'')||!/^[-\d]+$/.test(credentials.TELEGRAM_CHAT_ID||''))throw Error('Проверьте info/Telegram.txt');
 await write(sftp,target+'/.private/telegram.env',`TELEGRAM_BOT_TOKEN=${credentials.TELEGRAM_BOT_TOKEN}\nTELEGRAM_CHAT_ID=${credentials.TELEGRAM_CHAT_ID}\nLEADS_ORIGIN=https://${config.host},https://divangames.github.io\n`,0o600);
 await write(sftp,'/etc/systemd/system/ozon-cdek-leads.service',service);
 await write(sftp,'/etc/nginx/snippets/ozon-cdek-preview.conf',fs.readFileSync(path.join(root,'deploy/preview.conf')));
 oldConfig=await read(sftp,configuration);
 const include='    include /etc/nginx/snippets/ozon-cdek-preview.conf;';
 if(!oldConfig.includes(include)){
  const anchor='    include /etc/nginx/snippets/valhem-online.conf;';if(!oldConfig.includes(anchor))throw Error('Конфигурация VPS изменилась; публикация остановлена');
  await write(sftp,target+'/.private/nginx-before-'+Date.now()+'.conf',oldConfig,0o600);await write(sftp,configuration,oldConfig.replace(anchor,anchor+'\n'+include));
 }
 try{await exec(conn,'nginx -t');}catch(error){await write(sftp,configuration,oldConfig);throw error;}
 await exec(conn,'systemctl daemon-reload && systemctl enable ozon-cdek-leads >/dev/null && systemctl restart ozon-cdek-leads && systemctl reload nginx');
 console.log(await exec(conn,'systemctl is-active ozon-cdek-leads; curl --retry 5 --retry-connrefused --retry-delay 1 -fsS http://127.0.0.1:4193/health'));
 console.log('Опубликовано: https://'+config.host+'/OZON-CDEK/');
}catch(error){console.error(error.message.replace(/\d{6,}:[A-Za-z0-9_-]+/g,'[TOKEN]'));process.exitCode=1;}finally{conn.end();}}).on('error',error=>{console.error(error.message);process.exitCode=1;}).connect(config);
