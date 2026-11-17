import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,appendFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('./',import.meta.url)),state=join(root,'.local');mkdirSync(state,{recursive:true,mode:0o700});
const port=18831,log=join(state,'service.log');let tunnel,server,stopping=false,origin='';
const record=text=>appendFileSync(log,new Date().toISOString()+' '+text+'\n',{mode:0o600});
const status=()=>writeFileSync(join(state,'status.json'),JSON.stringify({url:origin,port,pid:process.pid,stopped:stopping,updated:new Date().toISOString()},null,2),{mode:0o600});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function startServer(){
 server=spawn(process.execPath,[join(root,'bootstrap.mjs')],{cwd:root,env:{...process.env,PORT:String(port),HOST:'127.0.0.1',SASA_ALLOWED_ORIGINS:[origin,'https://sasa-temple-personal-trial.fond-bell-1966.chatgpt.site','http://127.0.0.1:4355','http://localhost:4355'].join(','),SASA_STATIC_DIR:join(root,'dist')},stdio:['ignore','pipe','pipe']});
 const child=server;for(const stream of[child.stdout,child.stderr])stream.on('data',d=>record(d.toString().trim()));
 child.on('error',e=>record(e.message));child.once('exit',async()=>{if(stopping||child!==server)return;record('Restarting Colyseus');await delay(2000);if(!stopping&&child===server)startServer();});
}
function stop(){if(stopping)return;stopping=true;status();tunnel?.kill('SIGTERM');server?.kill('SIGTERM');setTimeout(()=>process.exit(0),1000).unref();}
for(const signal of['SIGTERM','SIGINT'])process.once(signal,stop);
while(!stopping){
 origin='';tunnel=spawn(join(root,'cloudflared'),['tunnel','--no-autoupdate','--url','http://127.0.0.1:'+port,'--protocol','http2','--metrics','127.0.0.1:18832'],{stdio:['ignore','pipe','pipe']});
 const receive=d=>{const line=d.toString();record(line.trim());if(line.includes('Unauthorized: Tunnel not found')){record('Expired temporary tunnel; creating a new address');tunnel.kill('SIGTERM');return;}const match=line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);if(match&&!origin){origin=match[0];status();startServer();}};
 tunnel.stdout.on('data',receive);tunnel.stderr.on('data',receive);tunnel.on('error',e=>record(e.message));
 await new Promise(resolve=>{tunnel.once('exit',resolve);tunnel.once('error',resolve);});
 const old=server;server=undefined;old?.kill('SIGTERM');if(!stopping){record('Recreating temporary address; Sites endpoint needs republishing if it changes');await delay(4000);}
}
