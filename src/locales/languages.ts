export const languages=[
 ['ko','🇰🇷','한국어'],['ja','🇯🇵','日本語'],['en','🇺🇸','English'],['zh-Hans','🇨🇳','简体中文'],
 ['pt-PT','🇵🇹','Português (Portugal)'],['es','🇪🇸','Español'],['fr','🇫🇷','Français'],['it','🇮🇹','Italiano'],
 ['pt-BR','🇧🇷','Português (Brasil)'],['ms','🇲🇾','Bahasa Melayu'],['de','🇩🇪','Deutsch'],['vi','🇻🇳','Tiếng Việt'],
 ['ru','🇷🇺','Русский'],['tr','🇹🇷','Türkçe'],
] as const;
export function flagUrl(flag:string){
 const code=Array.from(flag,char=>String.fromCharCode(char.codePointAt(0)!-0x1f1e6+97)).join('');
 return '/flags/'+code+'.svg';
}
export type Locale=typeof languages[number][0];
