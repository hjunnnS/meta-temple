import {createServer} from 'node:http';
import {mkdir,access} from 'node:fs/promises';
import {join} from 'node:path';
import sirv from 'sirv';
import {serviceApi} from './service/api.mjs';
import {pool,localRoot} from './service/database.mjs';
import {port} from './service/runtime-config.mjs';
import {startMaintenance} from './service/maintenance.mjs';

const httpPort=port(process.env.SASA_HTTP_PORT??4342);
const hosts=['127.0.0.1:'+httpPort,'localhost:'+httpPort];
const build=join(localRoot,'web');
await access(join(build,'index.html'));
const files=sirv(build,{etag:true,extensions:['html']});
await mkdir(join(localRoot,'mail'),{recursive:true,mode:0o700});
const api=await serviceApi(process.env,hosts);
const server=createServer(async(req,res)=>{
 function end(code,body=''){res.writeHead(code,{'Cache-Control':'no-store'});res.end(body);}
 if(!hosts.includes(req.headers.host))return end(403);
 try{
  if(req.url==='/health/live')return end(200,'ok');
  if(req.url==='/health/ready'){await pool.query('SELECT 1');return end(200,'ready');}
  await api(req,res,()=>{
   if(req.method!=='GET'&&req.method!=='HEAD')return end(405);
   files(req,res,()=>end(404));
  });
 }catch{if(!res.headersSent)end(503);else res.destroy();}
});
server.listen(httpPort,'127.0.0.1',()=>{
 const stop=startMaintenance();
 console.log('Private temple candidate: http://127.0.0.1:'+httpPort);
 function shutdown(){stop();server.close(()=>void pool.end());}
 process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
});
