// Публикация статической сборки в ветку gh-pages и включение GitHub Pages.
const {execFileSync,spawnSync}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
// Повторяет только сетевые запросы с ограниченным ожиданием.
async function request(url,options){
 for(let attempt=0;attempt<3;attempt++){
  try{return await fetch(url,{...options,signal:AbortSignal.timeout(20000)});}
  catch(error){if(attempt===2)throw new Error(`GitHub API недоступен: ${error.message}. Ветка опубликована; включите gh-pages в Settings → Pages или повторите команду позже.`);await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));}
 }
}
// Выполняет команды без оболочки и останавливается при ошибке.
function git(args,cwd=root){return execFileSync('git',args,{cwd,encoding:'utf8'}).trim();}
// Берёт доступ из Git Credential Manager, не печатая токен в консоль.
function credential(){
 const result=spawnSync('git',['credential','fill'],{cwd:root,input:'protocol=https\nhost=github.com\n\n',encoding:'utf8'});
 if(result.status!==0)return null;
 return result.stdout.match(/^password=(.+)$/m)?.[1];
}
// Проверяет конфигурацию Pages через официальный API GitHub.
async function enablePages(token){
 if(!token){console.log('Ветка gh-pages опубликована. В Settings → Pages выберите gh-pages / root.');return;}
 const endpoint='https://api.github.com/repos/divangames/ozon-cdek/pages';
 const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
 const response=await request(endpoint,{headers});
 if(!response.ok&&response.status!==404)throw new Error(`Проверка Pages: HTTP ${response.status}`);
 const method=response.status===404?'POST':'PUT';
 const result=await request(endpoint,{method,headers,body:JSON.stringify({build_type:'legacy',source:{branch:'gh-pages',path:'/'}})});
 if(!result.ok)throw new Error(`Ветка опубликована, но настройка Pages требует внимания: HTTP ${result.status}. Settings → Pages → gh-pages / root.`);
 console.log('GitHub Pages: https://divangames.github.io/ozon-cdek/');
}
// Копирует только dist во временный репозиторий: исходники и доступы не публикуются.
async function deploy(){
 if(!fs.existsSync(path.join(root,'dist/index.html')))throw new Error('Сначала выполните npm run build.');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ozon-cdek-pages-'));
 try{
  fs.cpSync(path.join(root,'dist'),temp,{recursive:true});fs.writeFileSync(path.join(temp,'.nojekyll'),'');
  git(['init','-b','gh-pages'],temp);
  git(['config','user.name',git(['config','user.name'])||'OZON CDEK'],temp);
  git(['config','user.email',git(['config','user.email'])||'deploy@localhost'],temp);
  git(['remote','add','origin',git(['remote','get-url','origin'])],temp);
  const existing=git(['ls-remote','origin','refs/heads/gh-pages']);
  if(existing){git(['fetch','origin','gh-pages'],temp);git(['reset','--soft','FETCH_HEAD'],temp);}
  git(['add','--all'],temp);git(['commit','--allow-empty','-m','Deploy OZON × CDEK website'],temp);git(['push','origin','HEAD:gh-pages'],temp);
  await enablePages(credential());
 }finally{
  const temporaryRoot=path.resolve(os.tmpdir()),resolved=path.resolve(temp);
  if(path.dirname(resolved)!==temporaryRoot||!path.basename(resolved).startsWith('ozon-cdek-pages-'))throw new Error('Небезопасный путь очистки временной публикации.');
  fs.rmSync(resolved,{recursive:true,force:true});
 }
}
module.exports={enablePages,credential};
if(require.main===module)deploy().catch(error=>{console.error(error.message);process.exitCode=1});
