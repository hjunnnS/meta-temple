import{preview}from'vite';import{spawn}from'node:child_process';
const checks=process.argv.slice(2);if(!checks.length)checks.push('scripts/check-trial.mjs','scripts/check-trial-expanded.mjs','scripts/check-trial-locales.mjs');
let server;try{
 const url=process.env.TRIAL_URL??'http://127.0.0.1:4355';if(!process.env.TRIAL_URL)server=await preview({preview:{host:'127.0.0.1',port:4355,strictPort:true}});
 for(const file of checks){const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[file],{stdio:'inherit',env:{...process.env,TRIAL_URL:url}});child.on('error',reject);child.on('exit',code=>resolve(code??1));});if(code!==0)throw Error(file+' failed with '+code);}
}finally{if(server)await new Promise(r=>server.httpServer.close(r));}
