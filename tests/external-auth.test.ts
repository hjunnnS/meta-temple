import test from 'node:test';
import assert from 'node:assert/strict';
import {authConfig,verifiedIdentity} from '../server/service/external-auth.mjs';
const config=authConfig({SASA_AUTH_PROJECT_ID:'demo',SASA_AUTH_API_KEY:'test',SASA_AUTH_DOMAIN:'demo.firebaseapp.com',SASA_AUTH_APP_ID:'test',SASA_AUTH_METHODS:'email,google,apple'});
test('Firebase setup is optional and partial configuration fails',()=>{
 assert.equal(authConfig({}),null);
 assert.throws(()=>authConfig({SASA_AUTH_PROJECT_ID:'demo'}));
});
test('verified Firebase UID identifies the same account across enabled sign-in methods',async()=>{
 const ids=[];
 for(const provider of ['password','google.com','apple.com','anonymous']){
  const claims={uid:'local-test',email_verified:true,auth_time:Math.floor(Date.now()/1000),firebase:{sign_in_provider:provider}};
  ids.push(await verifiedIdentity(config,'test',async()=>claims));
 }
 assert.match(ids[0],/^[a-f0-9]{64}$/);assert.deepEqual(ids,[ids[0],ids[0],ids[0],null]);
 assert.equal(await verifiedIdentity(config,'test',async()=>{throw Error('unverified');}),null);
});
