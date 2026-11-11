import {fixedSlots,layoutDraft,type ProductKind} from './contracts.ts';
import {compatibleDisplay,validDisplayPlacements,type DisplayPlacement} from './private-display-layout.ts';
import {inscriptionError} from './inscription.ts';
// Browser-local simulation only: no real identity, money, or shared ownership.
const KEY='sasa:sites:trial:v1';
type Offer={id:string;kind:ProductKind;days:number;priceKrw:number;revision:number};
type Item={galleryOnly?:boolean;orderId:string;installationId:string;slotId:string;kind:ProductKind;name:string;text:string;tag:boolean;public:boolean;status:string;amountKrw:number;startsAt:string;endsAt:string;inquired:boolean};
type Hold={id:string;slotId:string;offerId:string;expiresAt:string;name:string;text:string;tag:boolean;public:boolean;paymentLock:boolean};
type State={version:1;active:boolean;items:Item[];hold:Hold|null;orders:Record<string,{id:string;status:string;hold:Hold;amount_krw:number}>;placements:DisplayPlacement[];revision:number};
type StorageLike=Pick<Storage,'getItem'|'setItem'>;
export function createTrialApi(storage:StorageLike,clock=Date.now){
 const slots=fixedSlots();
 const offers:Offer[]=(['lantern','wish-plaque','votive','memorial','candle'] as ProductKind[]).flatMap(kind=>[7,30].map(days=>({id:`trial-${kind}-${days}`,kind,days,priceKrw:days===7?3000:10000,revision:1})));
 const fresh=():State=>({version:1,active:false,items:[],hold:null,orders:{},placements:[],revision:0});let state=fresh();
 try{const saved=JSON.parse(storage.getItem(KEY)??'null');if(saved?.version===1&&Array.isArray(saved.items)&&Array.isArray(saved.placements)&&typeof saved.orders==='object')state=saved;}catch{}
 const iso=(value:number)=>new Date(value).toISOString();const save=()=>storage.setItem(KEY,JSON.stringify(state));
 const installed=()=>state.items.filter(i=>i.status==='installed'&&Date.parse(i.endsAt)>clock());
 function expire(){let changed=false;for(const i of state.items)if(i.status==='installed'&&Date.parse(i.endsAt)<=clock()){i.status='expired';changed=true;}if(state.hold&&!state.hold.paymentLock&&Date.parse(state.hold.expiresAt)<=clock()){state.hold=null;changed=true;}if(changed)save();}
 function seed(){if(state.items.length)return;for(const kind of ['lantern','wish-plaque','votive','memorial','candle'] as ProductKind[]){const s=slots.find(s=>s.accepts===kind)!;state.items.push({galleryOnly:true,orderId:crypto.randomUUID(),installationId:crypto.randomUUID(),slotId:s.id,kind,name:kind==='lantern'?'체험 방문자':'',text:'마음이 평안하기를 바랍니다. · 체험용 샘플',tag:kind==='lantern',public:true,status:'installed',amountKrw:0,startsAt:iso(clock()),endsAt:iso(clock()+30*86400000),inquired:false});}}
 const runs=new Map<string,number>();let channel=1;
 const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 const fail=(error:string,status=400)=>json({error},status);
 return async function request(path:string,method='GET',body:Record<string,any>={}){
  expire();const route=path.split('?')[0];
  if(route==='time')return json({time:clock()});
  if(route==='auth/methods')return json({external:false,methods:[],trial:true});
  if(route==='auth/local-preview'){state.active=true;seed();save();return json({ok:true});}
  if(route==='logout'){state.active=false;save();return json({ok:true});}
  if(route==='offers')return json({offers});
  if(route==='quote'){const offer=offers.find(o=>o.id===body.offerId);return offer?json({offer}):fail('not_available',404);}
  const zone=route.match(/^temples\/sample:sasa\/zones\/(Z\d+)\/slots$/)?.[1];
  if(zone)return json({schemaVersion:1,layoutVersion:layoutDraft.version,templeId:'sample:sasa',zoneId:zone,coordinateSystem:{units:'metre',up:'+Y',north:'+Z',rotation:'radian'},slots:slots.filter(s=>s.zoneId===zone).map(s=>{const i=installed().find(i=>!i.galleryOnly&&i.slotId===s.id),held=state.hold?.slotId===s.id;return{slotId:s.id,position:s.position,rotationY:s.rotationY,accepts:s.accepts,status:i?'occupied':held?'reserved':'free',installationId:i?.installationId??null,owned:!!i&&state.active,name:i&&(state.active||i.public)?i.name:'',text:i&&(state.active||i.public)?i.text:''};})});
  if(route.startsWith('channel/')){if(route.endsWith('join'))channel=Number(body.channel)||1;return json({schemaVersion:1,layoutVersion:layoutDraft.version,channelId:String(channel),self:'browser-trial',count:1,participants:[]});}
  if(route==='staff/roles')return json({roles:[]});
  if(!state.active)return fail('login_required',401);
  if(route==='me')return json({email:'체험 방문자',trial:true,deletionPending:false});
  if(route==='me/offerings')return json({items:state.items.map(i=>({...i,shareable:false}))});
  if(route==='me/delete'){state=fresh();runs.clear();save();return json({waiting:false});}
  if(route==='trade/enter'){
   const offer=offers.find(o=>o.id===body.offerId),slot=slots.find(s=>s.id===body.slotId);
   if(!offer||!slot||slot.accepts!==offer.kind)return fail('unavailable',409);
   if(state.hold)return fail('already_reserved',409);
   if(installed().some(i=>!i.galleryOnly&&i.slotId===slot.id))return fail('unavailable',409);
   if(body.revision!==offer.revision)return fail('offer_changed',409);
   const name=String(body.name??'').trim(),text=String(body.text??'').trim();
   if(inscriptionError(name,'name')||inscriptionError(text,'text')||(body.tag&&(!name||!body.public)))return fail('invalid_inscription');
   state.hold={id:crypto.randomUUID(),slotId:slot.id,offerId:offer.id,expiresAt:iso(clock()+300000),name,text,tag:!!body.tag,public:!!body.public,paymentLock:false};save();return json({waiting:false});
  }
  if(route==='trade/hold')return json({hold:state.hold,serverTime:clock()});
  if(route==='trade/cancel'){if(state.hold?.paymentLock)return fail('payment_locked',409);state.hold=null;save();return json({ok:true});}
  if(route==='trade/checkout'){
   const h=state.hold;if(!h||h.id!==body.holdId)return fail('expired_hold',409);
   const old=Object.values(state.orders).find(o=>o.hold.id===h.id);if(old)return json(old);
   const offer=offers.find(o=>o.id===h.offerId)!;const order={id:crypto.randomUUID(),status:'pending',hold:{...h},amount_krw:offer.priceKrw};state.orders[order.id]=order;h.paymentLock=true;save();return json(order);
  }
  if(['trade/test-pay','trade/test-cancel','trade/reconcile'].includes(route)){
   const order=state.orders[String(body.orderId)];if(!order)return fail('not_found',404);
   if(route==='trade/test-cancel'&&order.status==='pending'){order.status='cancelled';state.hold=null;}
   if(route==='trade/test-pay'&&order.status==='pending'){
    const h=order.hold,offer=offers.find(o=>o.id===h.offerId)!;
    if(installed().some(i=>!i.galleryOnly&&i.slotId===h.slotId))return fail('unavailable',409);
    state.items.push({orderId:order.id,installationId:crypto.randomUUID(),slotId:h.slotId,kind:offer.kind,name:h.name,text:h.text,tag:h.tag,public:h.public,status:'installed',amountKrw:order.amount_krw,startsAt:iso(clock()),endsAt:iso(clock()+offer.days*86400000),inquired:false});order.status='installed';state.hold=null;
   }save();return json({id:order.id,status:order.status});
  }
  if(route==='hide'){const item=state.items.find(i=>i.installationId===body.id);if(!item)return fail('not_found',404);item.public=false;save();return json({ok:true});}
  if(route==='private-room/access')return json({hasAccess:true,orders:[]});
  if(['private-room/enter','private-room/heartbeat','private-room/leave'].includes(route))return json({roomId:'browser-trial-room',ok:true});
  if(route==='private-room/display'){
   if(method==='POST'){
    if(body.revision!==state.revision)return fail('layout_changed',409);
    if(!validDisplayPlacements(body.placements)||!compatibleDisplay(body.placements,installed()))return fail('item_unavailable',409);
    state.placements=body.placements;state.revision++;save();
   }return json({roomId:'browser-trial-room',revision:state.revision,items:installed(),placements:state.placements.filter(p=>installed().some(i=>i.orderId===p.orderId))});
  }
  if(route==='practice/start'){const id=crypto.randomUUID();runs.set(id,0);return json({id,count:0});}
  if(route==='practice/cancel'){runs.delete(String(body.id));return json({ok:true});}
  if(route==='practice/bow'){const id=String(body.id),count=runs.get(id);if(count===undefined)return fail('practice_expired',409);if(body.count!==count&&body.count!==count+1)return fail('invalid_count',409);const next=Math.min(108,Number(body.count));runs.set(id,next);return json({id,count:next,completed:next===108});}
  return fail('not_available_in_trial',501);
 };
}
