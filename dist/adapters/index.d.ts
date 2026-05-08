import { FrameworkAdapter } from './types.js';
export * from './types.js';
export declare const adapters: FrameworkAdapter[];
export declare function getAdapter(framework: string, i18n: string): FrameworkAdapter;
