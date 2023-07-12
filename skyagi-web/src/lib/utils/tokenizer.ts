import GPT3TokenizerImport from 'gpt3-tokenizer';

const GPT3Tokenizer: typeof GPT3TokenizerImport =
    typeof GPT3TokenizerImport === 'function'
        ? GPT3TokenizerImport
        : (GPT3TokenizerImport as any).default;

const tokenizer = new GPT3Tokenizer({ type: 'gpt3' });

export function getTokens(input: string): number {
    const tokens = tokenizer.encode(input);
    return tokens.text.length;
}
