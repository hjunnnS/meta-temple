import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
const root=JSON.parse(readFileSync(new URL('../.local/colyseus-runtime.json',import.meta.url),'utf8')).root,label='com.hjunnns.sasa.colyseus',command=process.argv[2]??'status';
if(command==='start'){
 const current=spawnSync('/bin/launchctl',['list',label],{stdio:'ignore'});if(current.status===0){console.log('이미 실행 중입니다. status로 주소를 확인하세요.');process.exit(0);}
 const log=join(root,'.local/supervisor.log');const result=spawnSync('/bin/launchctl',['submit','-l',label,'-o',log,'-e',log,'--','/usr/bin/caffeinate','-i',process.execPath,join(root,'mac-supervisor.mjs')],{stdio:'inherit'});process.exit(result.status??1);
}else if(command==='stop'){process.exit(spawnSync('/bin/launchctl',['remove',label],{stdio:'inherit'}).status??1);}
else if(command==='status'){console.log(readFileSync(join(root,'.local/status.json'),'utf8'));}
else throw Error('start, stop, status 중 하나를 사용하세요.');
