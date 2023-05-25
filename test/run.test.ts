import { readFileSync, writeFileSync, existsSync, rmSync } from 'fs';
import { resolve } from 'path';
import { Parser } from '../src/Parser.js';

const program = readFileSync(resolve('./test/test.tsn')).toString('utf8');

const ast = (new Parser).parse(program);

console.log(JSON.stringify(ast, null, 2));

// if (existsSync(resolve('./dist/ast.json'))) rmSync(resolve('./dist/ast.json'));
writeFileSync(resolve('./dist/ast.json'), JSON.stringify(ast, null, 2));
