export const inscriptionLimits={name:12,text:100} as const;

export function inscriptionError(value:unknown,field:keyof typeof inscriptionLimits){
 if(typeof value!=='string'||/[\u0000-\u001f\u007f]/u.test(value))return '한 줄로 입력해 주세요.';
 if([...value].length>inscriptionLimits[field])return '최대 {limit}자까지 입력할 수 있습니다.';
 return null;
}
