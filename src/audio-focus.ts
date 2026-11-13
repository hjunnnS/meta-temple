export type AudioRole='narration'|'practice'|'ceremony';
const owners=new Map<object,AudioRole>();const listeners=new Set<()=>void>();
export function setAudioFocus(owner:object,role:AudioRole,on:boolean){if(on)owners.set(owner,role);else owners.delete(owner);for(const update of listeners)update();}
export function audioFocusLevel(role:'ambience'|'practice'|'ceremony'){const roles=[...owners.values()];if(roles.includes('narration'))return role==='ambience'?.12:role==='practice'?.35:.18;if(role==='ambience'&&roles.length)return .25;if(role==='ceremony'&&roles.includes('practice'))return .25;return 1;}
export function watchAudioFocus(update:()=>void){listeners.add(update);return()=>listeners.delete(update);}
