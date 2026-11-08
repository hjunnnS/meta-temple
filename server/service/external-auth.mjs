import {createHash} from 'node:crypto';
import {initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';

const providers={email:'password',google:'google.com',apple:'apple.com'};
export function authConfig(env){
 const client={projectId:env.SASA_AUTH_PROJECT_ID,apiKey:env.SASA_AUTH_API_KEY,
  authDomain:env.SASA_AUTH_DOMAIN,appId:env.SASA_AUTH_APP_ID};
 if(Object.values(client).every(value=>!value))return null;
 if(Object.values(client).some(value=>!value))throw Error('Incomplete Firebase web configuration');
 const methods=(env.SASA_AUTH_METHODS??'email').split(',').map(value=>value.trim());
 if(methods.some(method=>!Object.hasOwn(providers,method)))throw Error('Invalid SASA_AUTH_METHODS');
 return {client,methods};
}
export function firebaseVerifier(config){
 const app=initializeApp({projectId:config.client.projectId},'sasa-'+config.client.projectId);
 return token=>getAuth(app).verifyIdToken(token);
}
export async function verifiedIdentity(config,token,verify){
 if(typeof token!=='string'||!token||token.length>16384)return null;
 let claims;
 try{claims=await verify(token);}catch{return null;}
 if(!claims.uid||!claims.email_verified||!config.methods.some(method=>providers[method]===claims.firebase?.sign_in_provider))return null;
 const age=Date.now()/1000-claims.auth_time;
 if(!Number.isFinite(age)||age>300||age< -60)return null;
 return createHash('sha256').update('firebase|'+config.client.projectId+'|'+claims.uid).digest('hex');
}
