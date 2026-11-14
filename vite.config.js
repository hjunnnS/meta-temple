import { defineConfig,loadEnv } from 'vite';
import { reviewApi } from './server/review-api.mjs';
export default defineConfig(({mode})=>({server:{fs:{deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/.m3-local/**']}},plugins:mode==='review'?[{
 name:'local-temple-review',
 configureServer(server){server.middlewares.use(reviewApi());},
 configurePreviewServer(server){server.middlewares.use(reviewApi());}
}]:mode==='service'?[{
 name:'local-service',
 configureServer:attachService,configurePreviewServer:attachService
}]:[],build:{rolldownOptions:{input:{characterStudy:'character-study.html',auth:'auth.html',practicePreview:'practice-preview.html',faceStudy:'face-study.html',main:'index.html',shared:'shared.html',staff:'staff.html',hanji:'hanji.html',daylight:'daylight.html',colors:'hanji-colors.html',sunlight:'hanji-sunlight.html'}}}}));

async function attachService(server){const {serviceApi}=await import('./server/service/api.mjs');server.middlewares.use(await serviceApi({...loadEnv("service",process.cwd(),"SASA_AUTH_"),...process.env}));
  const {startMaintenance}=await import('./server/service/maintenance.mjs');
  const stop=startMaintenance();server.httpServer?.once('close',stop);}
