// A private session never joins the public channel. Leases recover after a crashed tab.
export function privatePresence(clock=Date.now){
 const sessions=new Map();
 function current(key){const value=sessions.get(key);if(value&&clock()-value.at>=20000){sessions.delete(key);return undefined;}return value;}
 return {enter(key,room){for(const id of sessions.keys())current(id);sessions.set(key,{room,at:clock()});},blocked(key){return !!current(key);},
 heartbeat(key,room){const value=current(key);if(!value||value.room!==room)return false;value.at=clock();return true;},
 leave(key){sessions.delete(key);}};
}
