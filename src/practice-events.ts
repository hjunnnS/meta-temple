export type PracticeKind='bow'|'meditation'|'108';
export interface PracticeEvent{kind:PracticeKind;status:'started'|'completed'|'cancelled';id:string;place?:string;count?:number}
export function practiceEvent(detail:PracticeEvent){window.dispatchEvent(new CustomEvent<PracticeEvent>('sasa:practice-event',{detail}));}
