import type{Motion}from'./review-presence';
/** Preserve changed motion at 10Hz, but do not resend identical poses at that rate. */
export class PresenceCadence{
 private signature='';private sentAt=-Infinity;
 shouldSend(now:number,pose:Motion){const rounded={...pose,position:pose.position.map(n=>Math.round(n*1000)/1000),yaw:Math.round(pose.yaw*1000)/1000};const next=JSON.stringify(rounded);if(next===this.signature&&now-this.sentAt<2000)return false;this.signature=next;this.sentAt=now;return true;}
 delay(pose:Motion){return ['walk','worship','bell'].includes(pose.animation)||(pose.drinkLift??0)>0?100:500;}
}
