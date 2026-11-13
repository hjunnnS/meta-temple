import type {GuideCourseId}from'./guide-courses.ts';
export const guideStages=['prepare','travel','prayer','practice','offering','finish']as const;
export type GuideStage=typeof guideStages[number];
export type GuideResult='pending'|'completed'|'skipped';
export class GuideSession{
 course:GuideCourseId|null=null;
 stage:GuideStage='prepare';
 prayer:GuideResult='pending';practice:GuideResult='pending';offering:GuideResult='pending';
 revision=0;
 start(course:GuideCourseId){this.course=course;this.stage='prepare';this.prayer=this.practice=this.offering='pending';this.revision++;}
 exit(){this.course=null;this.revision++;}
 get active(){return this.course!==null;}
 advance(arrived:boolean){
  if(!this.active||this.stage==='finish')return false;
  if(this.stage==='travel'&&!arrived||this.stage==='prayer'&&this.prayer==='pending'||this.stage==='practice'&&this.practice==='pending'||this.stage==='offering'&&this.offering==='pending')return false;
  if(this.stage==='practice'){this.offering='skipped';this.stage='finish';}else this.stage=guideStages[guideStages.indexOf(this.stage)+1];this.revision++;return true;
 }
 previous(){if(!this.active||this.stage==='prepare')return false;this.stage=this.stage==='finish'?'practice':guideStages[guideStages.indexOf(this.stage)-1];this.revision++;return true;}
 result(stage:'prayer'|'practice'|'offering',result:GuideResult){if(this.active&&this.stage===stage){this[stage]=result;return true;}return false;}
 skip(){if(!this.active||!['prayer','practice','offering'].includes(this.stage))return false;this.result(this.stage as 'prayer'|'practice'|'offering','skipped');this.advance(true);return true;}
}
