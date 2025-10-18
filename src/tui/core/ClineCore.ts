import { EventEmitter } from 'events';
import { Anthropic } from '@anthropic-ai/sdk';
import { ApiHandler, buildApiHandler } from '../../api';
import { ApiConfiguration } from '../../shared/api';
import { ClineMessage } from '../../shared/ExtensionMessage';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { TerminalManager } from '../../integrations/terminal/TerminalManager';
import { UrlContentFetcher } from '../../services/browser/UrlContentFetcher';
import { listFiles } from '../../services/glob/list-files';
import { regexSearchFiles } from '../../services/ripgrep';
import { parseSourceCodeForDefinitionsTopLevel } from '../../services/tree-sitter';
import { extractTextFromFile } from '../../integrations/misc/extract-text';
import { fileExistsAtPath } from '../../utils/fs';
import { MCPManager } from './MCPManager';
import { MemoryManager } from './MemoryManager';
import { RulesManager } from './RulesManager';

/**
 * Core Cline functionality decoupled from VS Code
 * This class provides all the main features of Cline in a standalone way
 */
export class ClineCore extends EventEmitter {
	private api: ApiHandler;
	private config: ApiConfiguration;
	private cwd: string;
	private terminalManager?: TerminalManager;
	private urlContentFetcher?: UrlContentFetcher;
	private mcpManager?: MCPManager;
	private memoryManager?: MemoryManager;
	private rulesManager?: RulesManager;
	
	private taskId?: string;
	private messages: ClineMessage[] = [];
	private apiConversationHistory: Anthropic.MessageParam[] = [];
	
	private isRunning: boolean = false;
	private aborted: boolean = false;

	constructor(config: ApiConfiguration, cwd: string) {
		super();
		this.config = config;
		this.cwd = cwd;
		this.api = buildApiHandler(config);
		
		// Initialize managers
		this.initializeManagers();
	}

	private async initializeManagers(): Promise<void> {
		// MCP Server Manager
		this.mcpManager = new MCPManager();
		await this.mcpManager.initialize((this.config as any).mcpServers || {});

		// Memory Manager
		if ((this.config as any).memories?.enabled) {
			this.memoryManager = new MemoryManager(
				(this.config as any).memories.storageDir || path.join(os.homedir(), '.cline', 'memories')
			);
			await this.memoryManager.load();
		}

		// Rules Manager
		if ((this.config as any).rules?.enabled) {
			this.rulesManager = new RulesManager(
				(this.config as any).rules.rulesDir || path.join(os.homedir(), '.cline', 'rules')
			);
			await this.rulesManager.load();
		}

		// Terminal Manager (simplified for TUI)
		this.terminalManager = new TerminalManager();

		// URL Content Fetcher (needs adaptation for non-VS Code context)
		// For now, we'll create a minimal context
		const context = {
			extensionUri: { fsPath: path.join(os.homedir(), '.cline') },
			globalStorageUri: { fsPath: path.join(os.homedir(), '.cline', 'storage') },
			subscriptions: [],
		};
		this.urlContentFetcher = new UrlContentFetcher(context as any);
	}

	/**
	 * Start a new task
	 */
	async startTask(task: string, images?: string[]): Promise<void> {
		if (this.isRunning) {
			throw new Error('A task is already running');
		}

		this.taskId = Date.now().toString();
		this.isRunning = true;
		this.aborted = false;

		this.emit('taskStarted', { taskId: this.taskId, task, images });

		try {
			// Add task message
			this.addMessage({
				ts: Date.now(),
				type: 'say',
				say: 'task',
				text: task,
				images,
			});

			// Process the task
			await this.processTask(task, images);
		} catch (error) {
			this.emit('error', error);
			throw error;
		} finally {
			this.isRunning = false;
			this.emit('taskCompleted', { taskId: this.taskId });
		}
	}

	private async processTask(task: string, images?: string[]): Promise<void> {
		// This is a simplified version - full implementation would include
		// all the logic from the original Cline.ts
		
		// Get custom instructions and rules
		let systemPrompt = this.buildSystemPrompt();
		
		// Add memories if available
		if (this.memoryManager) {
			const relevantMemories = await this.memoryManager.getRelevantMemories(task);
			if (relevantMemories.length > 0) {
				systemPrompt += '\n\n## Relevant Memories:\n' + relevantMemories.join('\n');
			}
		}

		// Build user message
		const userMessage: Anthropic.MessageParam = {
			role: 'user',
			content: [
				{
					type: 'text',
					text: task,
				},
			],
		};

		// Add images if provided
		if (images && images.length > 0) {
			for (const image of images) {
				// Handle base64 images
				const imageData = image.startsWith('data:') 
					? image.split(',')[1]
					: await fs.readFile(image, 'base64');
				
				(userMessage.content as any[]).push({
					type: 'image',
					source: {
						type: 'base64',
						media_type: 'image/png',
						data: imageData,
					},
				});
			}
		}

		this.apiConversationHistory.push(userMessage);

		// Emit message added event
		this.emit('messageAdded', userMessage);

		// TODO: Implement full conversation loop with tool calling
		// This would include:
		// - Streaming API responses
		// - Tool execution (file operations, terminal commands, etc.)
		// - User approval flow
		// - Error handling and retries
	}

	private buildSystemPrompt(): string {
		let prompt = 'You are Cline, an AI coding assistant with autonomous capabilities.';
		
		// Add custom instructions
		if (this.config.customInstructions) {
			prompt += '\n\n' + this.config.customInstructions;
		}

		// Add rules
		if (this.rulesManager) {
			const rules = this.rulesManager.getAllRules();
			if (rules.length > 0) {
				prompt += '\n\n## Rules:\n' + rules.join('\n');
			}
		}

		return prompt;
	}

	/**
	 * Send a message in the current task
	 */
	async sendMessage(text: string, images?: string[]): Promise<void> {
		if (!this.isRunning || !this.taskId) {
			throw new Error('No task is currently running');
		}

		this.addMessage({
			ts: Date.now(),
			type: 'say',
			say: 'user_feedback',
			text,
			images,
		});

		// TODO: Continue conversation with this new message
	}

	/**
	 * Execute a tool (file operation, terminal command, etc.)
	 */
	async executeTool(tool: string, params: any): Promise<string> {
		this.emit('toolExecuting', { tool, params });

		try {
			switch (tool) {
				case 'read_file':
					return await this.readFile(params.path);
				case 'write_file':
					return await this.writeFile(params.path, params.content);
				case 'list_files':
					return await this.listFiles(params.path, params.recursive);
				case 'search_files':
					return await this.searchFiles(params.regex, params.filePattern);
				case 'execute_command':
					return await this.executeCommand(params.command);
				case 'list_code_definitions':
					return await this.listCodeDefinitions(params.path);
				case 'browser_action':
					return await this.browserAction(params.action, params.url);
				default:
					throw new Error(`Unknown tool: ${tool}`);
			}
		} catch (error) {
			this.emit('toolError', { tool, params, error });
			throw error;
		} finally {
			this.emit('toolExecuted', { tool, params });
		}
	}

	private async readFile(filePath: string): Promise<string> {
		const fullPath = path.resolve(this.cwd, filePath);
		
		// Check if binary file
		const content = await extractTextFromFile(fullPath);
		return content;
	}

	private async writeFile(filePath: string, content: string): Promise<string> {
		const fullPath = path.resolve(this.cwd, filePath);
		
		// Ensure directory exists
		await fs.mkdir(path.dirname(fullPath), { recursive: true });
		
		await fs.writeFile(fullPath, content, 'utf-8');
		return `File written successfully: ${filePath}`;
	}

	private async listFiles(dirPath: string, recursive: boolean): Promise<string> {
		const fullPath = path.resolve(this.cwd, dirPath);
		const files = await listFiles(fullPath, recursive);
		return files.join('\n');
	}

	private async searchFiles(regex: string, filePattern?: string): Promise<string> {
		const results = await regexSearchFiles(this.cwd, regex, filePattern);
		return results;
	}

	private async executeCommand(command: string): Promise<string> {
		// Terminal command execution would go here
		// For now, return a placeholder
		return `Command execution: ${command}\n(Terminal integration pending)`;
	}

	private async listCodeDefinitions(filePath: string): Promise<string> {
		const fullPath = path.resolve(this.cwd, filePath);
		const definitions = await parseSourceCodeForDefinitionsTopLevel(fullPath);
		return JSON.stringify(definitions, null, 2);
	}

	private async browserAction(action: string, url?: string): Promise<string> {
		if (!this.urlContentFetcher) {
			throw new Error('URL content fetcher not initialized');
		}

		// Browser action implementation would go here
		return `Browser action: ${action} ${url || ''}`;
	}

	private addMessage(message: ClineMessage): void {
		this.messages.push(message);
		this.emit('message', message);
	}

	/**
	 * Get all messages for the current task
	 */
	getMessages(): ClineMessage[] {
		return [...this.messages];
	}

	/**
	 * Abort the current task
	 */
	async abort(): Promise<void> {
		this.aborted = true;
		this.isRunning = false;
		this.emit('taskAborted', { taskId: this.taskId });
	}

	/**
	 * Stop the core and clean up resources
	 */
	async stop(): Promise<void> {
		await this.abort();
		
		if (this.memoryManager) {
			await this.memoryManager.save();
		}
		
		if (this.mcpManager) {
			await this.mcpManager.shutdown();
		}
	}

	/**
	 * Get MCP server manager
	 */
	getMCPManager(): MCPManager | undefined {
		return this.mcpManager;
	}

	/**
	 * Get memory manager
	 */
	getMemoryManager(): MemoryManager | undefined {
		return this.memoryManager;
	}

	/**
	 * Get rules manager
	 */
	getRulesManager(): RulesManager | undefined {
		return this.rulesManager;
	}
}
