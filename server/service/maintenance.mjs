import {maintainOrders} from './lifecycle.mjs';
import {maintainPrivacy,refreshAlerts} from './operations.mjs';
import {dailyBackup} from './backup.mjs';

export function startMaintenance(){
 let working=false,backingUp=false;
 const jobs=setInterval(async()=>{
  if(working)return;
  working=true;
  try{await refreshAlerts();await maintainOrders();await maintainPrivacy();}
  catch{console.error('시험 주문 상태 확인 실패');}
  finally{working=false;}
 },5000);
 async function backup(){
  if(backingUp)return;
  backingUp=true;
  try{await dailyBackup();}catch{console.error('시험 백업 실패 · 운영 절차 확인');}
  finally{backingUp=false;}
 }
 void backup();
 const backups=setInterval(backup,60000);
 return ()=>{clearInterval(jobs);clearInterval(backups);};
}
