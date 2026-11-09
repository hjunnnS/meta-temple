import assert from 'node:assert/strict';
import test from 'node:test';
import {databaseSettings,port} from '../server/service/runtime-config.mjs';

test('candidate and backup share the selected local database settings',()=>{
 const config=databaseSettings({SASA_STATE_DIR:'/tmp/sasa-test',SASA_DB_HOST:'127.0.0.1',SASA_DB_NAME:'temple_candidate',SASA_DB_PORT:'54840',SASA_DB_USER:'reviewer'});
 assert.deepEqual(config.connection,{host:'127.0.0.1',database:'temple_candidate',port:54840,user:'reviewer'});
 assert.equal(databaseSettings({}).connection.database,'temple_test');
 assert.throws(()=>databaseSettings({SASA_DB_HOST:'remote.example'}));
 for(const value of ['0','65536','', '4341oops'])assert.throws(()=>port(value));
});
