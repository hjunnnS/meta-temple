import test from 'node:test';
import assert from 'node:assert/strict';
import {bowPractice} from '../server/service/bows.mjs';

test('a practice counts completed bows in order and can retry the last count',()=>{
 let now=0;
 const service=bowPractice(()=>now);
 const [,run]=service('member','start',{});
 assert.equal(service('other','bow',{id:run.id,count:1})[0],409);
 assert.equal(service('member','bow',{id:run.id,count:108})[0],409);
 for(let count=1;count<=108;count++){
  assert.equal(service('member','bow',{id:run.id,count})[0],409);
  now+=1800;
  for(let attempt=0;attempt<2;attempt++)
   assert.deepEqual(service('member','bow',{id:run.id,count}),[200,{count}]);
 }
 assert.equal(service('member','bow',{id:run.id,count:109})[0],400);
 service('member','cancel',{id:run.id});
 assert.equal(service('member','bow',{id:run.id,count:108})[0],409);
});
