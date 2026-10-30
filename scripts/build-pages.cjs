const {execFileSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const env={...process.env,VITE_LEADS_URL:process.env.VITE_LEADS_URL||'https://213.139.209.107/OZON-CDEK/api/leads'};
execFileSync(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build','--base=./'],{cwd:root,env,stdio:'inherit'});
execFileSync(process.execPath,[path.join(root,'scripts/prerender.cjs')],{cwd:root,env,stdio:'inherit'});
