#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { globSync } from 'glob';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import jscodeshift from 'jscodeshift';
import transformer from '../core/transformer.js';
import * as readline from 'node:readline/promises';

const program = new Command();

program
  .name('autokeys')
  .description('i18n automatic key extraction tool')
  .version('0.1.0');

program
  .command('transform')
  .description('Scan and transform source files')
  .argument('<path>', 'File or directory path')
  .option('--framework <type>', 'Framework (react|next)', 'next')
  .option('--i18n <library>', 'i18n library (next-intl|react-i18next)', 'next-intl')
  .option('--locale <lang>', 'Target locale', 'fr')
  .option('--outDir <dir>', 'JSON output directory', './messages')
  .option('--dry-run', 'Show changes without writing to disk', false)
  .option('--no-namespace', 'Disable key namespacing', false)
  .option('--interactive', 'Confirm or rename keys manually', false)
  .action(async (targetPath, options) => {
    if (options.dryRun) {
        console.log(chalk.yellow('🚧 DRY RUN MODE - No files will be modified\n'));
    } else {
        console.log(chalk.blue('🚀 AutoKeys starting transformation...'));
    }

    const resolvedPath = path.resolve(targetPath);
    const pattern = resolvedPath + '/**/*.{js,ts,jsx,tsx}';
    const files = globSync(pattern, {
        ignore: ['**/node_modules/**', '**/dist/**']
    });

    console.log(chalk.gray(`Found ${files.length} files to scan.`));

    const fullOutDir = path.resolve(options.outDir);
    const localePath = path.join(fullOutDir, `${options.locale}.json`);
    let existingMessages = {};
    try {
        const data = await fs.readFile(localePath, 'utf-8');
        existingMessages = JSON.parse(data);
    } catch {}

    const allKeys: Record<string, string> = {};
    const rl = options.interactive ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;

    for (const file of files) {
      try {
        const source = await fs.readFile(file, 'utf-8');
        
        // Pass a custom callback for interactive key confirmation if needed
        // For simplicity in this transformer architecture, we'll run a "pre-scan" or handle it in transformer
        // But for now, let's keep it simple: transformer does the work, we report.
        
        const result = transformer(
          { source, path: file },
          { jscodeshift: (jscodeshift as any).withParser('tsx'), stats: () => {} },
          { ...options, existingMessages }
        );

        if (source !== result.source) {
          let shouldWrite = !options.dryRun;
          
          if (options.interactive && rl) {
              console.log(chalk.cyan(`\nFile: ${file}`));
              for (const [k, v] of Object.entries(result.keys)) {
                  console.log(chalk.gray(`  → Suggesting key [${k}] for "${v}"`));
              }
              const answer = await rl.question(chalk.yellow('  Accept changes? (y/n/skip): '));
              if (answer.toLowerCase() !== 'y') shouldWrite = false;
          }

          if (shouldWrite) {
              await fs.writeFile(file, result.source);
              console.log(chalk.green(`✔ Processed ${file}`));
              Object.assign(allKeys, result.keys);
          } else if (options.dryRun) {
              console.log(chalk.yellow(`[Dry-Run] Would modify ${file}`));
              Object.assign(allKeys, result.keys);
          }
        }
      } catch (err: any) {
        console.error(chalk.red(`❌ Error in ${file}:`), err.message);
      }
    }

    if (rl) rl.close();

    if (Object.keys(allKeys).length > 0 && !options.dryRun) {
        await fs.mkdir(fullOutDir, { recursive: true });
        const merged = { ...existingMessages, ...allKeys };
        await fs.writeFile(localePath, JSON.stringify(merged, null, 2));
        console.log(chalk.blue(`🔑 Extracted ${Object.keys(allKeys).length} keys to ${localePath}`));
    }

    console.log(chalk.bold.green('\n✨ Done!'));
  });

program.parse();
