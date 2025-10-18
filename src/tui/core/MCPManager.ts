import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';

export interface MCPServerConfig {
	command: string;
	args?: string[];
	env?: Record<string, string>;
}

export interface MCPServer {
	name: string;
	process?: ChildProcess;
	config: MCPServerConfig;
	status: 'stopped' | 'starting' | 'running' | 'error';
}

/**
 * Manages MCP (Model Context Protocol) servers
 * MCP servers provide additional capabilities to Cline
 */
export class MCPManager extends EventEmitter {
	private servers: Map<string, MCPServer> = new Map();

	async initialize(serversConfig: Record<string, MCPServerConfig>): Promise<void> {
		for (const [name, config] of Object.entries(serversConfig)) {
			this.servers.set(name, {
				name,
				config,
				status: 'stopped',
			});
		}
	}

	/**
	 * Start an MCP server
	 */
	async startServer(name: string): Promise<void> {
		const server = this.servers.get(name);
		if (!server) {
			throw new Error(`MCP server '${name}' not found`);
		}

		if (server.status === 'running') {
			return;
		}

		server.status = 'starting';
		this.emit('serverStarting', { name });

		try {
			const process = spawn(server.config.command, server.config.args || [], {
				env: { ...process.env, ...server.config.env },
				stdio: ['pipe', 'pipe', 'pipe'],
			});

			server.process = process;
			server.status = 'running';

			process.on('error', (error) => {
				server.status = 'error';
				this.emit('serverError', { name, error });
			});

			process.on('exit', (code) => {
				server.status = 'stopped';
				this.emit('serverStopped', { name, code });
			});

			this.emit('serverStarted', { name });
		} catch (error) {
			server.status = 'error';
			this.emit('serverError', { name, error });
			throw error;
		}
	}

	/**
	 * Stop an MCP server
	 */
	async stopServer(name: string): Promise<void> {
		const server = this.servers.get(name);
		if (!server || !server.process) {
			return;
		}

		server.process.kill();
		server.status = 'stopped';
		this.emit('serverStopped', { name });
	}

	/**
	 * Start all configured MCP servers
	 */
	async startAll(): Promise<void> {
		for (const name of this.servers.keys()) {
			await this.startServer(name);
		}
	}

	/**
	 * Stop all MCP servers
	 */
	async stopAll(): Promise<void> {
		for (const name of this.servers.keys()) {
			await this.stopServer(name);
		}
	}

	/**
	 * Get status of all servers
	 */
	getServersStatus(): Record<string, string> {
		const status: Record<string, string> = {};
		for (const [name, server] of this.servers) {
			status[name] = server.status;
		}
		return status;
	}

	/**
	 * Send a request to an MCP server
	 */
	async sendRequest(serverName: string, method: string, params: any): Promise<any> {
		const server = this.servers.get(serverName);
		if (!server || server.status !== 'running' || !server.process) {
			throw new Error(`MCP server '${serverName}' is not running`);
		}

		// TODO: Implement MCP protocol request/response handling
		// This would involve:
		// 1. Formatting the request according to MCP spec
		// 2. Sending via stdin
		// 3. Reading response from stdout
		// 4. Parsing and returning the result

		return { success: true, message: 'MCP request handling not yet implemented' };
	}

	/**
	 * Shutdown all servers and clean up
	 */
	async shutdown(): Promise<void> {
		await this.stopAll();
		this.servers.clear();
	}
}
