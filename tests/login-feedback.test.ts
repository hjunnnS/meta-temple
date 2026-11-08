import assert from 'node:assert/strict';
import test from 'node:test';
import {loginFeedback} from '../src/login-feedback.ts';

test('login recovery distinguishes cancellation, blocked popup, expired link and network failure',()=>{
 assert.equal(loginFeedback({code:'auth/popup-closed-by-user'}),'로그인을 취소했습니다. 다시 시도할 수 있습니다.');
 assert.equal(loginFeedback({code:'auth/popup-blocked'}),'로그인 창을 열 수 없습니다. 팝업을 허용해 주세요.');
 assert.equal(loginFeedback({code:'auth/expired-action-code'}),loginFeedback({code:'auth/invalid-action-code'}));
 assert.equal(loginFeedback(new TypeError('fetch failed')),'연결 상태를 확인해 주세요.');
 assert.notEqual(loginFeedback(new TypeError()),loginFeedback({code:'auth/expired-action-code'}));
});
