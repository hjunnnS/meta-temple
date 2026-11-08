import test from 'node:test';
import assert from 'node:assert/strict';
import {scheduleAt,services} from '../src/daily-schedule.ts';
const at=(time:string)=>Date.parse('2026-11-08T'+time+'+09:00');
test('daily services open and end at the KST boundaries and wrap overnight',()=>{
 for(const service of services){
  const start=at(String(service.hour).padStart(2,'0')+':00:00');
  assert.equal(scheduleAt(start-1).current,null);
  assert.equal(scheduleAt(start).current?.title,service.title);
  assert.equal(scheduleAt(start+service.minutes*60000).current,null);
 }
 assert.equal(scheduleAt(at('23:59:59')).next.start,at('05:00:00')+86400000);
});
test('late visitors hear the corresponding offset within the same phase',()=>{
 const active=scheduleAt(at('18:07:11')).current!;
 assert.equal(active.clip,'chant');assert.equal(active.seconds,191);
 assert.equal(scheduleAt(at('18:04:00')).current?.seconds,0);
});
