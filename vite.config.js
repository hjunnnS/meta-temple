import { defineConfig,loadEnv } from 'vite';
import { reviewApi } from './server/review-api.mjs';
export default defineConfig(({mode})=>({server:{fs:{deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/.m3-local/**']}},plugins:mode==='review'?[{
 name:'local-temple-review',
 configureServer(server){server.middlewares.use(reviewApi());},
 configurePreviewServer(server){server.middlewares.use(reviewApi());}
}]:mode==='service'?[{
 name:'local-service',
 configureServer:attachService,configurePreviewServer:attachService
}]:[],build:{rolldownOptions:{input:{auth:'auth.html',practicePreview:'practice-preview.html',faceStudy:'face-study.html',main:'index.html',shared:'shared.html',staff:'staff.html',hanji:'hanji.html',daylight:'daylight.html',colors:'hanji-colors.html',sunlight:'hanji-sunlight.html'}}}}));

async function attachService(server){const {serviceApi}=await import('./server/service/api.mjs');server.middlewares.use(await serviceApi({...loadEnv("service",process.cwd(),"SASA_AUTH_"),...process.env}));
  const {maintainOrders}=await import('./server/service/lifecycle.mjs');
  const {maintainPrivacy,refreshAlerts}=await import('./server/service/operations.mjs');
  let running=false;const timer=setInterval(async()=>{if(running)return;running=true;try{await refreshAlerts();await maintainOrders();await maintainPrivacy();}catch{console.error('시험 주문 상태 확인 실패');}finally{running=false;}},5000);
  const {dailyBackup}=await import('./server/service/backup.mjs');
  const backup=()=>dailyBackup().catch(()=>console.error('시험 백업 실패 · 운영 절차 확인'));
  void backup();const backupTimer=setInterval(backup,60000);
  server.httpServer?.once('close',()=>{clearInterval(timer);clearInterval(backupTimer);});}
