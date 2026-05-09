import { cosmiconfig } from 'cosmiconfig';
import { ConfigSchema, Config } from './schema.js';

export async function loadConfig(configPath?: string): Promise<Config> {
  const explorer = cosmiconfig('autokeys');
  const result = configPath ? await explorer.load(configPath) : await explorer.search();
  
  const userConfig = result ? result.config : {};
  return ConfigSchema.parse(userConfig);
}
