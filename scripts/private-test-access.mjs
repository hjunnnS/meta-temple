import assert from 'node:assert/strict';
export async function ensurePrivateTestAccess(context,origin){
 const headers={Origin:origin};
 let response=await context.request.get(origin+'/api/service/private-room/access');assert.equal(response.status(),200);const snapshot=await response.json();
 if(snapshot.hasAccess)return;
 response=await context.request.post(origin+'/api/service/private-room/access',{headers,data:{action:'checkout',offerId:snapshot.offer.id,revision:snapshot.offer.revision}});assert.equal(response.status(),200);const {order}=await response.json();
 response=await context.request.post(origin+'/api/service/private-room/access',{headers,data:{action:'test-pay',orderId:order.id}});assert.equal(response.status(),200);assert.equal((await response.json()).hasAccess,true);
}
