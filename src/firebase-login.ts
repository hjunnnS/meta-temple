import {initializeApp,type FirebaseOptions} from 'firebase/app';
import {initializeAuth,inMemoryPersistence,browserPopupRedirectResolver,GoogleAuthProvider,OAuthProvider,
 signInWithPopup,sendSignInLinkToEmail,isSignInWithEmailLink,signInWithEmailLink,signOut,type UserCredential} from 'firebase/auth';

export function firebaseLogin(options:FirebaseOptions){
 const auth=initializeAuth(initializeApp(options,'sasa'),{persistence:inMemoryPersistence,popupRedirectResolver:browserPopupRedirectResolver});
 const storageKey='sasa-email-link:'+options.projectId;
 let pendingEmail:UserCredential|undefined;
 async function finish(result:UserCredential){
   const idToken=await result.user.getIdToken();
   const response=await fetch('/api/service/auth/finish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken})});
   if(!response.ok)throw Error('Session could not be established');
   await signOut(auth).catch(()=>{});
 }
 return {
  async social(method:string){
   const provider=method==='google'?new GoogleAuthProvider():new OAuthProvider('apple.com');
   if(method==='apple')provider.addScope('email');
   await finish(await signInWithPopup(auth,provider));
  },
  async send(email:string){
   await sendSignInLinkToEmail(auth,email,{url:location.origin+'/auth.html',handleCodeInApp:true});
   localStorage.setItem(storageKey,email);
  },
  isLink:(url:string)=>isSignInWithEmailLink(auth,url),
  savedEmail:()=>localStorage.getItem(storageKey)??'',
  async complete(email:string,url:string){
   pendingEmail??=await signInWithEmailLink(auth,email,url);
   await finish(pendingEmail);pendingEmail=undefined;
   localStorage.removeItem(storageKey);
  }
 };
}
