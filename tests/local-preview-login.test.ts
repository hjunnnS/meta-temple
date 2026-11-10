import assert from 'node:assert/strict';
import test from 'node:test';
import {localPreviewEmail} from '../server/service/local-preview-login.mjs';
test('temporary account is available only with explicit local flag and without external authentication',()=>{
 assert.equal(localPreviewEmail({},null),undefined);
 assert.equal(localPreviewEmail({SASA_LOCAL_TEST_LOGIN:'0'},null),undefined);
 assert.equal(localPreviewEmail({SASA_LOCAL_TEST_LOGIN:'true'},null),undefined);
 assert.equal(localPreviewEmail({SASA_LOCAL_TEST_LOGIN:'1'},null),'test@bwm.kr');
 assert.equal(localPreviewEmail({SASA_LOCAL_TEST_LOGIN:'1'},{provider:'firebase'}),undefined);
});
