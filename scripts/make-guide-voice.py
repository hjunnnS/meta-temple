"""Local M5 prototype narration using the already-used macOS Korean Reed voice."""
from pathlib import Path
import json,subprocess as sp,tempfile,hashlib
plan=json.loads(sp.check_output(['node','--experimental-strip-types','--input-type=module','-e',
 "import{guideCourses,enabledGuideCourses}from'./src/guide-courses.ts';import{guideContent}from'./src/guide-content.ts';let m=new Map();for(let c of guideCourses.filter(c=>enabledGuideCourses.includes(c.id)))for(let s of ['prepare','travel','prayer','practice','offering','finish']){let p=guideContent(s,c.id);m.set(p.audio,p.text);if(s==='prayer')m.set('recite-'+c.id,c.prayer);}console.log(JSON.stringify([...m]));"],text=True))
target=Path('public/guide');target.mkdir(exist_ok=True)
manifest=Path('public/textures/sources.json');rows=json.loads(manifest.read_text())
with tempfile.TemporaryDirectory(prefix='sasa-guide-')as tmp:
 for key,text in plan:
  output=target/(key+'.mp3')
  voice=str(Path(tmp)/(key+'.aiff'))
  sp.run(['say','-v','Reed (한국어(한국))','-r','125','-o',voice,text],check=True)
  sp.run(['ffmpeg','-v','error','-y','-i',voice,'-af','highpass=f=65,lowpass=f=7800,equalizer=f=190:t=q:w=0.85:g=1.5,loudnorm=I=-18:TP=-2:LRA=7','-ar','24000','-ac','1','-c:a','libmp3lame','-q:a','4',str(output)],check=True)
  duration=float(sp.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(output)],text=True));assert duration>=1,output
  data=output.read_bytes();assert len(data)>1000,output
  record={'file':str(output),'source':'scripts/make-guide-voice.py','credit':'SASA local prototype narration, macOS Reed','rights':'Locally synthesized prototype speech; temporary audio; replacement recordings can be supplied by the service owner','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
  rows=[r for r in rows if r['file']!=str(output)];rows.append(record)
manifest.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print('Generated',len(plan),'prototype guide voice clips')
