#!/usr/bin/env node

/**
 * Cline TUI - Command Line Interface
 * A standalone text-based user interface for Cline that works without VS Code
 */

import { Command } from 'commander';
import { ClineTUI } from './ClineTUI';
import { ConfigManager } from './config/ConfigManager';
import path from 'path';
import os from 'os';

const program = new Command();

program
	.name('cline')
	.description('Cline - AI coding assistant with autonomous capabilities')
	.version('2.0.16')
	.option('-c, --config <path>', 'Path to configuration file')
	.option('-p, --project <path>', 'Project directory to work in', process.cwd())
	.option('--api-provider <provider>', 'API provider (anthropic, openai, gemini, ollama, etc.)')
	.option('--api-key <key>', 'API key for the provider')
	.option('--model <model>', 'Model ID to use')
	.option('--no-interactive', 'Run in non-interactive mode')
	.action(async (options) => {
		try {
			// Initialize configuration
			const configManager = new ConfigManager(options.config);
			await configManager.load();

			// Override config with CLI options
			if (options.apiProvider) {
				configManager.set('apiProvider', options.apiProvider);
			}
			if (options.apiKey) {
				configManager.set('apiKey', options.apiKey);
			}
			if (options.model) {
				configManager.set('apiModelId', options.model);
			}

			// Get working directory
			const cwd = path.resolve(options.project);

			// Start the TUI
			const tui = new ClineTUI(configManager, cwd, options.interactive);
			await tui.start();
		} catch (error) {
			console.error('Error starting Cline TUI:', error);
			process.exit(1);
		}
	});

program
	.command('config')
	.description('Manage Cline configuration')
	.option('-s, --set <key=value>', 'Set a configuration value')
	.option('-g, --get <key>', 'Get a configuration value')
	.option('-l, --list', 'List all configuration values')
	.option('-r, --reset', 'Reset configuration to defaults')
	.action(async (options) => {
		const configManager = new ConfigManager();
		await configManager.load();

		if (options.set) {
			const [key, value] = options.set.split('=');
			configManager.set(key, value);
			await configManager.save();
			console.log(`Configuration updated: ${key} = ${value}`);
		} else if (options.get) {
			const value = configManager.get(options.get);
			console.log(value);
		} else if (options.list) {
			const config = configManager.getAll();
			console.log(JSON.stringify(config, null, 2));
		} else if (options.reset) {
			await configManager.reset();
			console.log('Configuration reset to defaults');
		} else {
			console.log('Please specify an action: --set, --get, --list, or --reset');
		}
	});

program
	.command('init')
	.description('Initialize Cline configuration in the current directory')
	.action(async () => {
		const configManager = new ConfigManager();
		await configManager.initialize();
		console.log('Cline configuration initialized');
	});

(async () => {
    await program.parseAsync(process.argv);
})();
