import { defineConfig } from 'vite';
import { reviewApi } from './server/review-api.mjs';
export default defineConfig(({mode})=>({plugins:mode==='review'?[{
 name:'local-temple-review',
 configureServer(server){server.middlewares.use(reviewApi());},
 configurePreviewServer(server){server.middlewares.use(reviewApi());}
}]:[],build:{rolldownOptions:{input:{faceStudy:'face-study.html',main:'index.html',hanji:'hanji.html',daylight:'daylight.html',colors:'hanji-colors.html',sunlight:'hanji-sunlight.html'}}}}));
