export type TokenMap = Record<string, string>;
export declare const baseTokens: TokenMap;
export declare function toCustomPropertyDeclarations(tokens: TokenMap): string;
export declare function createShadowThemeCss(tokens: TokenMap): string;
export declare function createRootTokenCss(tokens?: TokenMap): string;
