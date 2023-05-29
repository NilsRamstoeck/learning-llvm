declare type Nullable<T> = T | null;

declare type Token<T extends string = never> = {
  type: never //For formatting
  | 'NUMBER'
  | 'STRING'
  | 'IDENTIFIER'
  | '='
  | ';'
  | '('
  | ')'
  | '{'
  | '}'
  | '['
  | ']'
  | ','
  | ':'
  | '`'
  | T
  ;
  value: string;
  start: number;
  stop: number;
};

declare interface ASTNode {
  type: string;
  start: number;
  stop: number;
}

declare type Type = ASTNode;

declare class Program implements ASTNode {
  start: number;
  stop: number;
  type: 'Program';
  body: Statement[];
}

declare class Identifier implements ASTNode {
  start: number;
  stop: number;
  type: 'Identifier';
  valueType?: any;
  name: string;
}

declare class BlockStatement implements ASTNode {
  start: number;
  stop: number;
  type: "BlockStatement";
  body: Statement[];
}

declare interface Statement extends ASTNode {
}

declare interface Declaration extends Statement {
}

declare class FunctionDeclaration implements Declaration {
  start: number;
  stop: number;
  type: "FunctionDeclaration";
  id: Identifier;
  params: Identifier[];
}

declare class FunctionDefinition implements Statement {
  start: number;
  stop: number;
  type: "FunctionDefinition";
  body: BlockStatement;
  id: Identifier;
  params: Identifier[];
}

declare class ConstantDeclaration implements Declaration {
  start: number;
  stop: number;
  type: "ConstantDeclaration";
  id: Identifier;
}

declare class ConstantDefinition implements Statement {
  start: number;
  stop: number;
  type: "ConstantDefinition";
  id: Identifier;
  value: Expression;
}

declare interface Expression extends Statement {
}

declare class CallExpression implements Expression {
  start: number;
  stop: number;
  type: 'CallExpression';
  callee: Identifier;
  arguments: Expression[];
}

declare interface Literal extends Expression {
}

declare class NumericLiteral implements Literal {
  start: number;
  stop: number;
  type: 'NumericLiteral';
  value: number;
}

declare class StringLiteral implements Literal {
  start: number;
  stop: number;
  type: 'StringLiteral';
  value: string;
}