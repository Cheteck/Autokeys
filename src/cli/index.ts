#!/usr/bin/env node
import { Command } from 'commander';
import { blue, green, yellow, red, gray, bold } from 'colorette';
import { globSync } from 'glob';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import jscodeshift from 'jscodeshift';
import transformer from '../core/transformer.js';
import { loadConfig } from '../config/loader.js';
import { mergeMessages } from '../core/merger.js';
import { createBackup } from '../utils/backup.js';
import ora from 'ora';
import SingleBar from 'cli-progress';

const program = new Command();

program
  .name('autokeys')
  .description('Professional i18n automatic key extraction tool')
  .version('0.2.0');

program
  .command('transform')
  .description('Scan and transform source files with advanced AST logic')
  .argument('[path]', 'File or directory path', '.')
  .option('--config <path>', 'Path to autokeys config file')
  .option('--dry-run', 'Simulation mode', false)
  .option('--no-backup', 'Skip creation of .bak files', false)
  .option('--backup-dir <path>', 'Directory to store backups')
  .action(async (targetPath, options) => {
    const configSpinner = ora('Loading configuration...').start();
    const config = await loadConfig(options.config);
    configSpinner.succeed('Configuration loaded.');

    if (options.dryRun) {
        console.log(yellow('\n🚧 DRY RUN MODE - No files will be modified\n'));
    }

    const resolvedPath = path.resolve(targetPath);
    let isDirectory = false;
    try {
        const stats = await fs.stat(resolvedPath);
        isDirectory = stats.isDirectory();
    } catch {
        console.error(red(`Error: Path ${resolvedPath} not found.`));
        process.exit(1);
    }

    const files = globSync(isDirectory ? config.include[0] : resolvedPath, {
        cwd: isDirectory ? resolvedPath : process.cwd(),
        ignore: config.exclude,
        absolute: true
    });

    if (files.length === 0) {
        console.log(yellow('No files found matching the patterns.'));
        return;
    }

    console.log(blue(`🔍 Found ${files.length} files to process.`));

    const progress = new (SingleBar as any).SingleBar({
        format: 'Processing |' + blue('{bar}') + '| {percentage}% || {value}/{total} Files || {file}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    });
    
    progress.start(files.length, 0, { file: '' });

    const allExtractedKeys: Record<string, string> = {};
    const messagesPath = path.resolve(config.outDir, `${config.locale}.json`);
    let existingMessages = {};
    try {
        existingMessages = JSON.parse(await fs.readFile(messagesPath, 'utf-8'));
    } catch {}

    for (const file of files) {
      try {
        progress.update({ file: path.basename(file) });
        const source = await fs.readFile(file, 'utf-8');
        const result = transformer(
          { source, path: file },
          { jscodeshift: (jscodeshift as any).withParser('tsx'), stats: () => {} },
          { ...config, isDryRun: options.dryRun, existingMessages }
        );

        if (source !== result.source) {
          if (!options.dryRun) {
              if (config.security.backup && !options.noBackup) {
                  await createBackup(file, source, options.backupDir || config.security.backupDir);
              }
              await fs.writeFile(file, result.source);
          }
          Object.assign(allExtractedKeys, result.keys);
        }
      } catch (err: any) {
        // Log error later or in a report to not break progress bar
      }
      progress.increment();
    }

    progress.stop();

    if (Object.keys(allExtractedKeys).length > 0 && !options.dryRun) {
        const finalPath = await mergeMessages(config.outDir, config.locale, allExtractedKeys);
        console.log(green(`\n✨ Successfully extracted ${Object.keys(allExtractedKeys).length} new keys.`));
        console.log(gray(`📍 Messages saved to: ${finalPath}`));
    } else if (Object.keys(allExtractedKeys).length > 0 && options.dryRun) {
        console.log(yellow(`\n📝 Dry-run: Would have extracted ${Object.keys(allExtractedKeys).length} keys.`));
    }

    console.log(bold(green('\n🏁 Done!')));
  });

program.parse();
