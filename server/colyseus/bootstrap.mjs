import {registerHooks} from 'node:module';
// Reuse the club's Colyseus 0.16 / patched nanoid interoperability adapter.
registerHooks({resolve(specifier,context,next){
 if(specifier==='nanoid'&&context.parentURL?.includes('/@colyseus/core/'))return {url:new URL('./nanoid.mjs',import.meta.url).href,shortCircuit:true};
 return next(specifier,context);
}});
await import('./server.mjs');
