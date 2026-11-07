export const offerings={
 lantern:{label:'연등',place:'연등광장',view:'lanternReception'},
 plaque:{label:'소원패',place:'소원패 정원',view:'wishGarden'},
 votive:{label:'인등',place:'인등전',view:'votiveShelves'},
 memorial:{label:'추모등',place:'지장전',view:'memorialLamps'},
 candle:{label:'봉헌초',place:'석탑 촛불함',view:'candleCourt'}
} as const;
export type Offering=keyof typeof offerings;
export interface Application {text:string;expires:number}
export const storagePrefix='sasa:preview:application:';
export function readApplication(id:string):Application|null{
 try{
  const record=JSON.parse(localStorage.getItem(storagePrefix+id)??'null');
  return record && typeof record.text==='string' && Number.isFinite(record.expires) && record.expires>Date.now()?record:null;
 }catch{return null;}
}
