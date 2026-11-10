import assert from 'node:assert/strict';
import test from 'node:test';
import {privatePresence} from '../server/service/private-presence.mjs';
test('private presence blocks only its own session and requires its own room heartbeat',()=>{
 let now=0;const rooms=privatePresence(()=>now);
 rooms.enter('account-a-session','room-a');assert(rooms.blocked('account-a-session'));assert(!rooms.blocked('account-b-session'));
 assert(!rooms.heartbeat('account-b-session','room-a'));assert(!rooms.heartbeat('account-a-session','room-b'));
 now=19000;assert(rooms.heartbeat('account-a-session','room-a'));now=30000;assert(rooms.blocked('account-a-session'));
 rooms.leave('account-a-session');assert(!rooms.blocked('account-a-session'));
});
test('an abandoned private tab releases its public channel block after twenty seconds',()=>{
 let now=0;const rooms=privatePresence(()=>now);rooms.enter('session','room');now=20000;
 assert(!rooms.blocked('session'));assert(!rooms.heartbeat('session','room'));
});
