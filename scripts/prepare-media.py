from pathlib import Path
import subprocess
import json
root=Path(__file__).resolve().parents[1]
target=root/'public'/'tutorials'
target.mkdir(parents=True,exist_ok=True)
items=[('integration','Настройка сервиса.mp4',60,True),('small-delivery','Настройка метода доставки для мелкогабаритного товара.mp4',5,False),('large-delivery','Настройка метода доставки для КГТ.mp4',8,False),('products','Модуль товаров.mp4',40,True)]
manifest=[]
for slug,name,poster,crop in items:
    src=root/'video'/'load'/name
    out=target/(slug+'.mp4')
    if not out.exists():
        vf='crop=iw:ih-80:0:80,scale=1440:-2' if crop else 'scale=1440:-2'
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(src),'-vf',vf,'-c:v','libx264','-preset','fast','-crf','22','-c:a','aac','-b:a','128k','-movflags','+faststart',str(out)],check=True)
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(poster),'-i',str(out),'-frames:v','1','-q:v','80',str(target/(slug+'.webp'))],check=True)
    manifest.append({'id':slug,'source':'video/load/'+name,'treatment':'Убрана верхняя панель с данными аккаунта' if crop else 'Оптимизация для веб','audio':'Сохранён'})
    print('Подготовлено: '+slug,flush=True)
(target/'provenance.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
