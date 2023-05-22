import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Parser } from '../src/Parser.js';

const program = readFileSync(resolve('./test/test.tsn')).toString('utf8');

const ast = (new Parser).parse(program);

console.log(JSON.stringify(ast, null, 2));
