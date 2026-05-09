import { z } from 'zod';

export const ConfigSchema = z.object({
  framework: z.enum(['react', 'next', 'vue', 'svelte', 'vanilla']).default('next'),
  i18nLib: z.enum(['react-i18next', 'next-intl', 'vue-i18n', 'react-intl']).default('next-intl'),
  locale: z.string().default('fr'),
  outDir: z.string().default('./messages'),
  include: z.array(z.string()).default(['src/**/*.{js,ts,jsx,tsx}']),
  exclude: z.array(z.string()).default(['**/node_modules/**', '**/dist/**', '**/.next/**']),
  
  namespacing: z.object({
    enabled: z.boolean().default(true),
    basePath: z.string().optional(),
    separator: z.string().default('.'),
  }).default({}),

  keyGeneration: z.object({
    strategy: z.enum(['slug', 'hash']).default('slug'),
    maxLength: z.number().default(50),
    prefix: z.string().optional(),
  }).default({}),

  extraction: z.object({
    attributes: z.array(z.string()).default([
      'placeholder', 'alt', 'title', 'label', 
      'aria-label', 'aria-placeholder', 'aria-description'
    ]),
    customComponents: z.record(z.array(z.string())).default({}),
  }).default({}),

  security: z.object({
    backup: z.boolean().default(true),
    backupDir: z.string().optional(),
  }).default({}),
});

export type Config = z.infer<typeof ConfigSchema>;
