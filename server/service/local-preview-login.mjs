// Explicitly enabled only by the Mac's standalone candidate launcher.
export function localPreviewEmail(env,external){
 return !external&&env.SASA_LOCAL_TEST_LOGIN==='1'?'test@bwm.kr':undefined;
}
