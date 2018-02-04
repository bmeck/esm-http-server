import {foo} from './test.mjs';
const _ = 'bar';
export {_ as foo};
console.log('we did it', foo);
