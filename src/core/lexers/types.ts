export interface Lexer {
  language: string;
  extract: (source: string, filePath: string) => Record<string, string>;
}
