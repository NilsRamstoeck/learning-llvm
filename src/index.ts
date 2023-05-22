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
  | T
  ;
  value: string;
};

declare interface ASTNode {
  type: string;
}

declare type Type = void;

declare class Program implements ASTNode {
  type: 'Program';
  body: Statement[];
}

declare class Identifier implements ASTNode {
  type: 'Identifier';
  valueType?: string;
  name: string;
}

declare class BlockStatement implements ASTNode {
  type: "BlockStatement";
  body: Statement[];
}

declare interface Statement extends ASTNode {
}

declare interface Declaration extends Statement {
}

declare class FunctionDeclaration implements Declaration {
  type: "FunctionDeclaration";
  id: Identifier;
  params: Identifier[];
}

declare class FunctionDefinition extends FunctionDeclaration {
  body: BlockStatement;
}

declare class ConstantDeclaration implements Declaration {
  type: "ConstantDeclaration";
  id: Identifier;
}

declare class ConstantDefinition extends ConstantDeclaration {
  value: Expression;
}

declare interface Expression extends Statement {
}

declare class CallExpression implements Expression {
  type: 'CallExpression';
  callee: Identifier;
  arguments: Expression[];
}

declare interface Literal extends Expression {
}

declare class NumericLiteral implements Literal {
  type: 'NumericLiteral';
  value: number;
}

declare class StringLiteral implements Literal {
  type: 'StringLiteral';
  value: string;
}