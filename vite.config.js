import { defineConfig } from 'vite';
import { reviewApi } from './server/review-api.mjs';
export default defineConfig(({mode})=>({server:{fs:{deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/.m3-local/**']}},plugins:mode==='review'?[{
 name:'local-temple-review',
 configureServer(server){server.middlewares.use(reviewApi());},
 configurePreviewServer(server){server.middlewares.use(reviewApi());}
}]:mode==='service'?[{
 name:'local-service',
 async configureServer(server){const {serviceApi}=await import('./server/service/api.mjs');server.middlewares.use(await serviceApi());
  const {maintainOrders}=await import('./server/service/lifecycle.mjs');
  let running=false;const timer=setInterval(async()=>{if(running)return;running=true;try{await maintainOrders();}catch{console.error('시험 주문 상태 확인 실패');}finally{running=false;}},5000);
  server.httpServer?.once('close',()=>clearInterval(timer));}
}]:[],build:{rolldownOptions:{input:{faceStudy:'face-study.html',main:'index.html',hanji:'hanji.html',daylight:'daylight.html',colors:'hanji-colors.html',sunlight:'hanji-sunlight.html'}}}}));
