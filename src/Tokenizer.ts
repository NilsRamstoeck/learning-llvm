const keywords = [
  'declare',
  'function',
  'return'
]

const TokenSpec: [RegExp, Nullable<Token['type']>][] = [
  //Whitespace
  [/^\s+/, null],

  //Comments
  [/^\/\/.*/, null],
  [/^\/\*[\s\S]*?\*\//, null],

  //keywords
  [new RegExp(`^${keywords.join('|')}`), 'KEYWORD'],

  //Semicolon
  [/^;+/, ';'],

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

  getNextToken(): Token | null {
    if (!this.hasMoreTokens()) return null;

    const token = this._string.slice(this._cursor);

    for (const [regexp, type] of TokenSpec) {
      const [value] = regexp.exec(token) ?? [null];
      if (value == null) continue; //cant match
      this._cursor += value.length;
      if (type == null) return this.getNextToken(); //ignore token
      return { type, value };
    }

    throw SyntaxError(`Unexpected Token: '${token[0]}'\n\t${/^.*$/.exec(token)}`);
  }

}
