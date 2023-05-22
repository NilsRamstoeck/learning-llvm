import { Tokenizer } from './Tokenizer.js';

export class Parser {
  private _tokenizer!: Tokenizer;
  _token!: Nullable<Token>;

  parse(string: string) {

    this._tokenizer = new Tokenizer(string);
    this._token = this._tokenizer.getNextToken();
    return this.Program();

  }

  /**
   * Main entry point
   * 
   * Program
   *   : NumericLiteral
   *   | StringLiteral
   *   ;
   */
  private Program(): Program {
    const body: Statement[] = [];
    do {
      body.push(this.Statement());
    } while (this._token);

    return {
      type: 'Program',
      body
    };
  }

  // /**
  //  * BlockStatement
  //  */
  // BlockStatement(): BlockStatement {
  //   const body: BlockStatement['body'] = [];
  //   do {
  //     body.push(this.Statement());
  //   } while (this._token);

  //   return {
  //     type: 'BlockStatement',
  //     body
  //   };
  // }

  /**
   * Statement
   *   : VariableDeclaration
   *   | FunctionDeclaration
   *   ;
   */
  Statement(){
    if (!this._token) {
      throw new SyntaxError(
        `Unexpected end of input, expected Statement`
      );
    }
    
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

    throw new SyntaxError(`Expected Literal, got ${this._token.type}(${this._token.value})`);
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
    return {
      type: 'NumericLiteral',
      value: Number(token.value)
    };
  }

  _eat<T extends Token['type']>(tokenType: T): Token {
    const token = this._token;
    if (token == null) {
      throw new SyntaxError(
        `Unexpected end of input, expected: "${tokenType}"`
      );
    }

    if (tokenType != token.type) {
      throw new SyntaxError(
        `Unexpected token:\n\tgot:"${token.type}(${token.value})"\n\texpected: "${tokenType}"`
      );
    }

    this._token = this._tokenizer.getNextToken();
    return token;
  }
}
