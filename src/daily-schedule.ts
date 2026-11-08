// Durations and offsets are in seconds. KST has a fixed UTC+09:00 offset.
export const services=[
 {hour:5,title:'새벽 예불',minutes:12,phases:[[0,'moktak'],[120,'chant'],[600,'palms']]},
 {hour:10,title:'사시 기도',minutes:18,phases:[[0,'wish'],[360,'palms'],[660,'bow']]},
 {hour:18,title:'저녁 예불',minutes:12,phases:[[0,'bell'],[120,'moktak'],[240,'chant'],[630,'palms']]},
 {hour:20,title:'오늘의 법문',minutes:10,phases:[[0,'chant']]}
] as const;
const day=86400000;
export function scheduleAt(now:number){
 const midnight=Math.floor((now+9*3600000)/day)*day-9*3600000;
 const entries=services.map(service=>({...service,start:midnight+service.hour*3600000}));
 const next=entries.find(entry=>entry.start>now)??{...entries[0],start:entries[0].start+day};
 const current=entries.find(entry=>now>=entry.start&&now<entry.start+entry.minutes*60000);
 if(!current)return {current:null,next};
 const elapsed=(now-current.start)/1000;
 const [offset,clip]=[...current.phases].reverse().find(([offset])=>elapsed>=offset)!;
 return {current:{...current,clip,seconds:elapsed-offset},next};
}
