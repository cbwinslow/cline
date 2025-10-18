// Stub for vscode module (not available in TUI mode)
// This provides minimal interfaces for code that expects vscode

export const window = {
	createOutputChannel: () => ({
		appendLine: () => {},
		dispose: () => {},
	}),
};

export const workspace = {
	workspaceFolders: [],
	getConfiguration: () => ({
		get: () => undefined,
		update: () => Promise.resolve(),
	}),
};

export const Uri = {
	file: (path: string) => ({ fsPath: path }),
	joinPath: (...segments: any[]) => ({
		fsPath: segments.join('/'),
	}),
};

export const commands = {
	registerCommand: () => ({ dispose: () => {} }),
	executeCommand: () => Promise.resolve(),
};

export const EventEmitter = class {
	fire() {}
	event = () => ({ dispose: () => {} });
};

export const Disposable = class {
	static from(...items: any[]) {
		return { dispose: () => items.forEach(i => i?.dispose?.()) };
	}
};
