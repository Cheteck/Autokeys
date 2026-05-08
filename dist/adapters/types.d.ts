export interface FrameworkAdapter {
    framework: string;
    i18n: string;
    getImport(): string;
    getHook(): string;
}
