export function loginFeedback(error:unknown){
 const code=typeof error==='object'&&error!==null&&'code' in error?error.code:'';
 switch(code){
  case 'auth/popup-closed-by-user':
  case 'auth/cancelled-popup-request':return '로그인을 취소했습니다. 다시 시도할 수 있습니다.';
  case 'auth/popup-blocked':return '로그인 창을 열 수 없습니다. 팝업을 허용해 주세요.';
  case 'auth/expired-action-code':
  case 'auth/invalid-action-code':return '링크가 만료되었거나 이미 사용됐습니다. 새 링크를 받아 주세요.';
  case 'auth/invalid-email':return '이메일 주소를 확인해 주세요.';
  case 'auth/network-request-failed':return '연결 상태를 확인해 주세요.';
  default:return error instanceof TypeError?'연결 상태를 확인해 주세요.':'다시 시도해 주세요.';
 }
}
