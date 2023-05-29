import { UnexpectedTokenError } from './errors/TSNativeError.js';
import { Tokenizer } from './Tokenizer.js';

export class Parser {
  private _tokenizer!: Tokenizer;
  _token!: Nullable<ReturnType<typeof this._tokenizer.getNextToken>>;

  parse(string: string) {

    this._tokenizer = new Tokenizer(string);
    this._token = this._tokenizer.getNextToken();
    UnexpectedTokenError.source = string;

    try {
      return this.Program();
    } catch (e: any) {
      console.log((e as Error));
      // console.log((e as Error).message);
    }

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
      body,
      start: 0,
      stop: body[body.length - 1].stop
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

    const startToken = this._eat('{');

    while (this._token?.type != '}') {
      body.push(this.Statement());
    }

    const stopToken = this._eat('}');

    return {
      type: 'BlockStatement',
      body,
      start: startToken.start,
      stop: stopToken.stop
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

    let statement: Nullable<Statement> = null;

    const token = this._token;

    console.log({ token });

    switch (this._token.type) {
      case "DECLARE": statement = this.Declaration(); break;
      case "FUNCTION": statement = this.FunctionDefinition(); break;

      case "NUMBER":
      case "STRING": statement = this.Literal(); break;

      case "CONST": statement = this.ConstantDefinition(); break;

      case "`":
      case "IDENTIFIER": statement = this.Expression(); break;
    }

    console.log({token, statement});
    

    if (!statement)
      throw new UnexpectedTokenError('Statement', token);

    const { stop } = this._eat(';');
    statement.stop = stop ?? statement.stop;
    return statement;
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
    if (!this._token) {
      throw new SyntaxError(
        `Unexpected end of input, expected Declaration`
      );
    }
    this._eat('DECLARE');

    switch (this._token.type) {
      case 'FUNCTION': return this.FunctionDeclaration();
    }

    throw new UnexpectedTokenError('Declaration', this._token);
  }

  /**
   * FunctionDeclaration
   *   : Identifier
   *   | Paramters
   *   | Type
   *   ;
   */
  FunctionDeclaration(): FunctionDeclaration {
    if (!this._token) {
      throw new SyntaxError(
        `Unexpected end of input, expected Function Declaration`
      );
    }

    const { start } = this._eat('FUNCTION');
    const id = this.Identifier();
    const params = this.Parameters();
    const { stop } = this.Type();

    return {
      type: "FunctionDeclaration",
      id,
      params,
      start,
      stop
    };

  }

  FunctionDefinition(): FunctionDefinition {
    if (!this._token) {
      throw new SyntaxError(
        `Unexpected end of input, expected Function Definition`
      );
    }

    const { start } = this._eat('FUNCTION');
    const id = this.Identifier();
    const params = this.Parameters();
    const type: Nullable<Type> = this._token.type == ':' ? this.Type() : null;

    const body = this.BlockStatement();

    return {
      type: 'FunctionDefinition',
      id,
      params,
      body,
      start,
      stop: body.stop
    };

  }

  /**
   * ConstantDefinition
   *  : CONST
   *  | IDENTIFIER
   *  | TYPE
   */
  ConstantDefinition(): ConstantDefinition {
    const { start } = this._eat('CONST');

    const id = this.Identifier();
    if (this._token?.type == ':') this.Type;
    this._eat('=');
    const value = this.Expression();

    return {
      type: 'ConstantDefinition',
      id,
      value,
      start,
      stop: value.stop
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
      start: token.start,
      stop: token.stop
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
    return this.Identifier();
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

    if (!this._token) {
      throw new SyntaxError(
        `Unexpected end of input, expected Function Parameters`
      );
    }

    do {
      if (this._token.type == ')') break;
      params.push(this.Identifier());
      if (this._token?.type == ':') params[params.length - 1].valueType = this.Type();
    } while (this._optional(','));

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

    do {
      args.push(this.Expression());
    } while (this._optional(','));

    this._eat(')');

    return args;
  };

  /**
   * Expression:
   *   : Literal
   *
   */
  Expression(): Expression {
    if (!this._token) {
      throw new SyntaxError(
        `Unexpected end of input, expected Expression`
      );
    }

    switch (this._token.type) {
      case 'IDENTIFIER':
        switch (this._tokenizer.getNextToken(true)?.type) {
          case '(': return this.CallExpression();
          default: return this.Identifier();
        };
      case 'NUMBER': return this.NumericLiteral();
      case 'STRING': return this.StringLiteral();
    }

    throw new UnexpectedTokenError('Expression', this._token);
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
    return {
      type: 'CallExpression',
      callee,
      arguments: args,
      start: callee.start,
      stop: args[args.length - 1].stop
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

    throw new UnexpectedTokenError('Literal', this._token);
  }

  /**
     * StringLiteral
     *   : STRING
     *   ;
     */
  StringLiteral(): StringLiteral {
    const token = this._eat('STRING');
    return {
      type: 'StringLiteral',
      value: token.value.slice(1, -1),
      start: token.start,
      stop: token.stop
    };
  }


  /**
     * NumericLiteral
     *   : NUMBER
     *   ;
     */
  NumericLiteral(): NumericLiteral {
    const token = this._eat('NUMBER');
    return {
      type: 'NumericLiteral',
      value: Number(token.value),
      start: token.start,
      stop: token.stop
    };
  }

  _optional<T extends NonNullable<typeof this._token>['type']>(tokenType: T) {
    const token = this._token;
    const consume = token?.type == tokenType;
    if (consume) this._eat(tokenType);
    // console.log({ token, ntoke: this._token, eaten:tokenType });

    return consume;
  }

  _eat<T extends NonNullable<typeof this._token>['type']>(tokenType: T) {
    const token = this._token;
    // console.log(token);

    if (token == null) {
      throw new SyntaxError(
        `Unexpected end of input, expected: "${tokenType}"`
      );
    }

    if (tokenType != token.type) {
      throw new UnexpectedTokenError(tokenType, token);
    }

    this._token = this._tokenizer.getNextToken();
    return token;
  }
}