import type{PracticeKind}from'./practice-events.ts';
export function practiceOutcome(kind:PracticeKind,status:'completed'|'cancelled'){return status==='cancelled'?'수행을 잠시 멈췄어요. 다시 시작할 수 있어요.':kind==='bow'?'참배를 마쳤어요.':kind==='meditation'?'명상을 마쳤어요.':'108배를 마쳤어요.';}
