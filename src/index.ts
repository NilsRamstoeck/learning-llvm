declare type Nullable<T> = T | null;

declare type Token = {
  type: never //For formatting
  | 'NUMBER'
  | 'STRING'
  | 'KEYWORD'
  | ';'
  ;
  value: string;
};

declare interface ASTNode {
  type: string;
}


declare class Program implements ASTNode {
  type: 'Program';
  body: Statement[];
}

declare class BlockStatement implements ASTNode {
  type: "BlockStatement"
  body: Statement[]
}

declare interface Statement extends ASTNode{
}

declare interface Expression extends Statement {
  value: any
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