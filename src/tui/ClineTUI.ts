import { render } from 'ink';
import React from 'react';
import { App } from './components/App';
import { ConfigManager } from './config/ConfigManager';
import { ClineCore } from './core/ClineCore';

/**
 * Main TUI class that orchestrates the entire text-based interface
 */
export class ClineTUI {
	private configManager: ConfigManager;
	private cwd: string;
	private interactive: boolean;
	private clineCore?: ClineCore;

	constructor(configManager: ConfigManager, cwd: string, interactive: boolean = true) {
		this.configManager = configManager;
		this.cwd = cwd;
		this.interactive = interactive;
	}

	async start(): Promise<void> {
		if (!this.interactive) {
			throw new Error('Non-interactive mode not yet implemented');
		}

		// Initialize the Cline core with configuration
		this.clineCore = new ClineCore(
			this.configManager.getAll(),
			this.cwd
		);

		// Render the Ink app
		const { waitUntilExit } = render(
			React.createElement(App, {
				configManager: this.configManager,
				clineCore: this.clineCore,
				cwd: this.cwd,
			})
		);

		// Wait for the app to exit
		await waitUntilExit();
	}

	async stop(): Promise<void> {
		if (this.clineCore) {
			await this.clineCore.stop();
		}
	}
}
