import {isAbsolute,resolve} from 'node:path';
import {userInfo} from 'node:os';

export function port(value){
 if(!/^\d+$/.test(String(value))||Number(value)<1||Number(value)>65535)throw Error('Invalid port');
 return Number(value);
}

export function databaseSettings(env=process.env){
 const state=resolve(env.SASA_STATE_DIR??resolve('.m3-local',env.SASA_LOCAL_INTEGRATION==='1'?'qa':'.'));
 const host=env.SASA_DB_HOST??resolve(state,'socket');
 if(!isAbsolute(host)&&!['localhost','127.0.0.1','::1'].includes(host))throw Error('Candidate database must be local');
 const database=env.SASA_DB_NAME??'temple_test';
 if(!/^[a-z_][a-z0-9_]{0,62}$/.test(database))throw Error('Invalid candidate database name');
 return {state,connection:{host,port:port(env.SASA_DB_PORT??54839),database,user:env.SASA_DB_USER??userInfo().username}};
}
