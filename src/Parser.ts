import { Tokenizer } from './Tokenizer.js';

export class Parser {
  private _tokenizer!: Tokenizer;
  _token!: Nullable<ReturnType<typeof this._tokenizer.getNextToken>>;

  parse(string: string) {

    this._tokenizer = new Tokenizer(string);
    this._token = this._tokenizer.getNextToken();
    return this.Program();

  }

  /**
   * Main entry point
   * 
   * Program
   *   : Statement
   *   ;
   */
  private Program(): Program {
    const body: Statement[] = [];

    while (this._token) {
      body.push(this.Statement());
    }

    return {
      type: 'Program',
      body
    };
  }

  /**
   * BlockStatement
   *   : {
   *   | Statement
   *   | }
   *   ;
   */
  BlockStatement(): BlockStatement {
    const body: BlockStatement['body'] = [];

    this._eat('{');

    while (!this._optional('}')) {
      body.push(this.Statement());
    }

    return {
      type: 'BlockStatement',
      body
    };
  }

  /**
   * Statement
   *   : VariableDeclaration
   *   | FunctionDeclaration
   *   ;
   */
  Statement(): Statement {
    if (!this._token) {
      throw new SyntaxError(
        `Unexpected end of input, expected Statement`
      );
    }

    switch (this._token.type) {
      case "DECLARE": return this.Declaration();
      // case "FUNCTION": return this.Function();
      case "NUMBER": return this.NumericLiteral();
      case "STRING": return this.StringLiteral();
      case "CONST": return this.ConstantDefinition();
      case "IDENTIFIER": return this.Expression();
    }

    throw new SyntaxError(`Unexpected Token:\n\tExpected Statement, got ${printToken(this._token)}`);
  }

  /**
   * Declaration
   *   : FunctionDeclaration
   *   | ClassDeclaration
   *   | InterfaceDeclaration
   *   | TypeDeclaration
   *   | VariableDeclaration
   *   ;
   */
  Declaration(): Declaration {
    this._eat('DECLARE');

    if (!this._token) {
      throw new SyntaxError(
        `Unexpected end of input, expected Declaration`
      );
    }

    switch (this._token.type) {
      case 'FUNCTION': return this.FunctionDeclaration();
    }

    throw new SyntaxError(`Unexpected Token:\n\tExpected Declaration, got ${printToken(this._token)}`);
  }

  /**
   * FunctionDeclaration
   *   : Identifier
   *   | Paramters
   *   | Type
   *   ;
   */
  FunctionDeclaration(): FunctionDeclaration {
    this._eat('FUNCTION');
    if (!this._token) {
      throw new SyntaxError(
        `Unexpected end of input, expected Function Declaration`
      );
    }

    const id = this.Identifier();
    const params = this.Parameters();
    this.Type();
    this._optional(';');

    return { type: "FunctionDeclaration", id, params };

  }

  /**
   * ConstantDefinition
   *  : CONST
   *  | IDENTIFIER
   *  | TYPE
   */
  ConstantDefinition(): ConstantDefinition {
    this._eat('CONST');

    const id = this.Identifier();
    if (this._token?.type == ':') this.Type;
    this._eat('=');
    const value = this.Expression();

    return {
      type: 'ConstantDeclaration',
      id,
      value
    };
  }

  /**
   * Identifier
   *   : INDENTIFIER
   *   ;
   */
  Identifier(): Identifier {
    const token = this._eat('IDENTIFIER');

    return {
      type: 'Identifier',
      name: token.value,
    };
  }

  /**
   * Type
   *   : :
   *   | IDENTIFIER
   *   | <
   *   | TYPE
   *   | >
   *   | |
   *   | &
   */
  Type(): Type {
    this._eat(':');
    this.Identifier();
  }

  /**
   * Parameters
   *   : (
   *   | IDENTIFIER
   *   | Type?
   *   | ,
   *   | )
   *   ;
   */
  Parameters(): Identifier[] {
    this._eat('(');
    const params: Identifier[] = [];

    while (this._token?.type == 'IDENTIFIER') {
      params.push(this.Identifier());
      //@ts-ignore this.Identifier changes this._token
      if (this._token?.type == ':') this.Type();
      if (!this._optional(',')) break;
    }

    this._eat(')');

    return params;
  }

  /**
   * Arguments
   *  : (
   *  | Expression
   *  | )
   *  ;
   */
  Arguments(): Expression[] {
    this._eat('(');
    const args: Expression[] = [];
    while (this._token?.type == 'IDENTIFIER') {
      args.push(this.Identifier());
      //@ts-ignore this.Identifier changes this._token
      if (!this._optional(',')) break;
    }
    this._eat(')');
    return args;
  };

  /**
   * Expression:
   *   : Literal
   *
   */
  Expression() {
    if (!this._token) {
      throw new SyntaxError(
        `Unexpected end of input, expected Expression`
      );
    }

    switch (this._token.type) {
      case 'IDENTIFIER': return this.CallExpression();
      case 'NUMBER': return this.NumericLiteral();
      case 'STRING': return this.StringLiteral();
    }

    throw new SyntaxError(`Unexpected Token:\n\tExpected Expression, got ${printToken(this._token)}`);
  }

  /**
   * CallExpression
   *   : IDENTIFIER
   *   | MemberExpression
   *   | (
   *   | Arguments
   *   | )
   *   | ;
   *   ;
   */
  CallExpression(): CallExpression {
    const callee = this.Identifier();
    const args = this.Arguments();
    this._optional(';');
    return {
      type: 'CallExpression',
      callee,
      arguments: args
    };
  }

  /**
   * Literal
   *   : NumericLiteral
   *   | StringLiteral
   *   ;
   */
  Literal() {
    if (!this._token) {
      throw new SyntaxError(
        `Unexpected end of input, expected Literal`
      );
    }

    switch (this._token.type) {
      case 'NUMBER': return this.NumericLiteral();
      case 'STRING': return this.StringLiteral();
    }

    throw new SyntaxError(`Unexpected Token:\n\tExpected Literal, got ${printToken(this._token)}`);
  }

  /**
     * StringLiteral
     *   : STRING
     *   ;
     */
  StringLiteral(): StringLiteral {
    const token = this._eat('STRING');
    this._optional(';');
    return {
      type: 'StringLiteral',
      value: token.value.slice(1, -1)
    };
  }


  /**
     * NumericLiteral
     *   : NUMBER
     *   ;
     */
  NumericLiteral(): NumericLiteral {
    const token = this._eat('NUMBER');
    this._optional(';');
    return {
      type: 'NumericLiteral',
      value: Number(token.value)
    };
  }

  _optional<T extends NonNullable<typeof this._token>['type']>(tokenType: T) {
    const token = this._token;
    const consume = token?.type == tokenType;
    if (consume) this._token = this._tokenizer.getNextToken();
    return consume;
  }

  _eat<T extends NonNullable<typeof this._token>['type']>(tokenType: T) {
    const token = this._token;
    if (token == null) {
      throw new SyntaxError(
        `Unexpected end of input, expected: "${tokenType}"`
      );
    }

    if (tokenType != token.type) {
      throw new SyntaxError(
        `Unexpected token:\n\tgot:"${printToken(token)}"\n\texpected: "${tokenType}"`
      );
    }

    this._token = this._tokenizer.getNextToken();
    return token;
  }
}

function printToken(token: Token<any>): string {
  return token.value ? `${token.type}(${token.value})` : `${token.type}`;
}