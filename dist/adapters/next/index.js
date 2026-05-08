export const nextAdapter = {
    framework: 'next',
    i18n: 'next-intl',
    getImport: () => "import { useTranslations } from 'next-intl';",
    getHook: () => "const t = useTranslations();"
};
