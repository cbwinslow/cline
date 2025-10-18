import Conf from 'conf';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { ApiConfiguration } from '../../shared/api';

export interface ClineConfig extends ApiConfiguration {
	customInstructions?: string;
	alwaysAllowReadOnly?: boolean;
	// MCP servers configuration
	mcpServers?: {
		[serverName: string]: {
			command: string;
			args?: string[];
			env?: Record<string, string>;
		};
	};
	// Memory system configuration
	memories?: {
		enabled: boolean;
		maxMemories?: number;
		storageDir?: string;
	};
	// Rules configuration
	rules?: {
		enabled: boolean;
		rulesDir?: string;
	};
	// History configuration
	historyDir?: string;
	maxHistorySize?: number;
}

/**
 * Manages Cline configuration for TUI mode
 */
export class ConfigManager {
	private config: Conf<ClineConfig>;
	private configPath?: string;

	constructor(configPath?: string) {
		this.configPath = configPath;
		this.config = new Conf<ClineConfig>({
			projectName: 'cline',
			cwd: configPath ? path.dirname(configPath) : undefined,
			defaults: this.getDefaults(),
		});
	}

	private getDefaults(): ClineConfig {
		return {
			apiProvider: 'anthropic',
			customInstructions: '',
			alwaysAllowReadOnly: false,
			mcpServers: {},
			memories: {
				enabled: true,
				maxMemories: 100,
				storageDir: path.join(os.homedir(), '.cline', 'memories'),
			},
			rules: {
				enabled: true,
				rulesDir: path.join(os.homedir(), '.cline', 'rules'),
			},
			historyDir: path.join(os.homedir(), '.cline', 'history'),
			maxHistorySize: 50,
		};
	}

	async load(): Promise<void> {
		// Config is automatically loaded by Conf
		// Ensure necessary directories exist
		const memories = this.config.get('memories');
		const rules = this.config.get('rules');
		const historyDir = this.config.get('historyDir');

		if (memories?.storageDir) {
			await fs.mkdir(memories.storageDir, { recursive: true });
		}
		if (rules?.rulesDir) {
			await fs.mkdir(rules.rulesDir, { recursive: true });
		}
		if (historyDir) {
			await fs.mkdir(historyDir, { recursive: true });
		}
	}

	async save(): Promise<void> {
		// Conf automatically saves changes
	}

	get<K extends keyof ClineConfig>(key: K): ClineConfig[K] {
		return this.config.get(key);
	}

	set<K extends keyof ClineConfig>(key: K, value: ClineConfig[K]): void {
		this.config.set(key, value);
	}

	getAll(): ClineConfig {
		return this.config.store;
	}

	async reset(): Promise<void> {
		this.config.clear();
	}

	async initialize(): Promise<void> {
		const projectConfigPath = path.join(process.cwd(), '.clinerc.json');
		const defaultConfig = this.getDefaults();
		
		await fs.writeFile(
			projectConfigPath,
			JSON.stringify(defaultConfig, null, 2),
			'utf-8'
		);
	}
}
