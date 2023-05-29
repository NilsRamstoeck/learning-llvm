import { Parser } from 'acorn';
import { readFileSync, writeFileSync, existsSync, rmSync } from 'fs';
import { resolve } from 'path';
import tsPlugin from 'acorn-typescript';

const TSNativeParser = Parser.extend(tsPlugin());
const program = readFileSync(resolve('./test/test.tsn')).toString('utf8');


const ast = TSNativeParser.parse(program, {
  sourceType: 'module',
  ecmaVersion: 'latest',
  locations: true
});

if (ast.type == '') process.exit(1);

console.log(ast);

// if (existsSync(resolve('./dist/ast.json'))) rmSync(resolve('./dist/ast.json'));
writeFileSync(resolve('./dist/ast.json'), JSON.stringify(ast, null, 2));



