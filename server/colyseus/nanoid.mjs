import * as generator from 'nanoid';
const nanoid=generator.nanoid??generator.default;
if(typeof nanoid!=='function')throw Error('Unsupported identifier generator');
export default nanoid;
