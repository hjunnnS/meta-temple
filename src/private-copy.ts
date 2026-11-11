import {t} from './locales';
// Application copy only; names and wishes are never translated.
export function roomPosition(id:string){const [side,row,col]=id.split('-');return t('{side} 선반 {row}층 {col}번').replace('{side}',t(side==='left'?'왼쪽':'오른쪽')).replace('{row}',row).replace('{col}',col);}
export function practiceCopy(mode:string,count:number,time:string,stopping:boolean){
 if(mode==='bow')return t(stopping?'현재 절을 마무리하고 일어납니다.':'합장하고 불단 앞에 절을 올립니다.');
 if(mode==='lowering')return t('방석에 앉고 있습니다.');
 if(mode==='meditating')return t('명상 중 · {time}').replace('{time}',time);
 if(mode==='rising')return t('천천히 일어나고 있습니다.');
 return count?t('절 {count}회 완료 · 자유롭게 머무르세요.').replace('{count}',String(count)):t('절하거나 방석에 앉아 잠시 마음을 쉬어 보세요.');
}
