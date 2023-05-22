const keywords = [
  'declare',
  'function',
  'return',
  'const'
] as const;

type TokenType = Token<Uppercase<typeof keywords[number]>>['type'];

const keyspec = keywords.map((keyword: typeof keywords[number]) => {
  return [new RegExp(`^${keyword}`), keyword.toUpperCase()] as [RegExp, Uppercase<typeof keyword>];
});


const TokenSpec: [RegExp, Nullable<TokenType>, any?][] = [
  //Whitespace
  [/^\s+/, null],

  //Comments
  [/^\/\/.*/, null],
  [/^\/\*[\s\S]*?\*\//, null],

  //keywords
  ...keywords.map((keyword: typeof keywords[number]) =>
    [new RegExp(`^${keyword}`), keyword.toUpperCase(), ''] as [RegExp, Uppercase<typeof keyword>, string]
  ),

  //Semicolon
  [/^;+/, ';', ''],

  //Colon
  [/^:+/, ':', ''],

  //Open Parentheses
  [/^\(+/, '(', ''],

  //Close Parentheses
  [/^\)+/, ')', ''],
  
  //Comma
  [/^,+/, ',', ''],

  //Equals
  [/^=+/, '=', ''],

  //Identifier
  [/^[a-zA-Z$#_][a-zA-Z0-9$#_]*/, 'IDENTIFIER'],

  //Numbers
  [/^\d+/, 'NUMBER'],

  //Strings
  [/^"[^"]*"/, 'STRING'],
  [/^'[^']*'/, 'STRING']
];

export class Tokenizer {

  private _string: string;
  private _cursor: number;

  constructor(string: string) {
    this._string = string;
    this._cursor = 0;
  }

  hasMoreTokens() {
    return this._cursor < this._string.length;
  }

  isEOF() {
    return this._cursor >= this._string.length;
  }

  getNextToken(): Token<Uppercase<typeof keywords[number]>> | null {
    if (!this.hasMoreTokens()) return null;

    const token = this._string.slice(this._cursor);

    for (const [regexp, type, defaultValue] of TokenSpec) {
      const [value] = regexp.exec(token) ?? [null];
      if (value == null) continue; //cant match
      this._cursor += value.length;
      if (type == null) return this.getNextToken(); //ignore token
      // console.log({ type, value: defaultValue ?? value });
      return { type, value: defaultValue ?? value };
    }

    throw SyntaxError(`Unexpected Token: '${token.split(' ')[0]}'\n\t${/^.*$/.exec(token)}`);
  }

}
