const esbuild = require("esbuild")
const fs = require("fs")
const path = require("path")

const production = process.argv.includes("--production")
const watch = process.argv.includes("--watch")

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: "esbuild-problem-matcher",

	setup(build) {
		build.onStart(() => {
			console.log("[watch] build started")
		})
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`)
				console.error(`    ${location.file}:${location.line}:${location.column}:`)
			})
			console.log("[watch] build finished")
		})
	},
}

const createTUIWrapperPlugin = {
	name: "create-tui-wrapper",
	setup(build) {
		// Mock react-devtools-core which is optional for Ink
		build.onResolve({ filter: /^react-devtools-core$/ }, () => {
			return { path: path.join(__dirname, "src/tui/stubs/react-devtools-core.ts") }
		})
		
		// Mock vscode module for TUI build
		build.onResolve({ filter: /^vscode$/ }, () => {
			return { path: path.join(__dirname, "src/tui/stubs/vscode.ts") }
		})
		
		build.onEnd(() => {
			// Create package.json for ESM support
			const packageJsonPath = path.join(__dirname, "dist", "tui", "package.json")
			fs.writeFileSync(packageJsonPath, JSON.stringify({ type: "module" }, null, 2))

			// Create wrapper script with shebang
			const wrapperPath = path.join(__dirname, "dist", "tui", "cli-wrapper.mjs")
			const wrapperContent = `#!/usr/bin/env node
import './cli.js';
`
			fs.writeFileSync(wrapperPath, wrapperContent)
			fs.chmodSync(wrapperPath, 0o755)
		})
	},
}

const copyWasmFiles = {
	name: "copy-wasm-files",
	setup(build) {
		build.onEnd(() => {
			// tree sitter
			const sourceDir = path.join(__dirname, "node_modules", "web-tree-sitter")
			const targetDir = path.join(__dirname, "dist")

			// Copy tree-sitter.wasm
			fs.copyFileSync(path.join(sourceDir, "tree-sitter.wasm"), path.join(targetDir, "tree-sitter.wasm"))

			// Copy language-specific WASM files
			const languageWasmDir = path.join(__dirname, "node_modules", "tree-sitter-wasms", "out")
			const languages = [
				"typescript",
				"tsx",
				"python",
				"rust",
				"javascript",
				"go",
				"cpp",
				"c",
				"c_sharp",
				"ruby",
				"java",
				"php",
				"swift",
			]

			languages.forEach((lang) => {
				const filename = `tree-sitter-${lang}.wasm`
				fs.copyFileSync(path.join(languageWasmDir, filename), path.join(targetDir, filename))
			})
		})
	},
}

const extensionConfig = {
	bundle: true,
	minify: production,
	sourcemap: !production,
	logLevel: "silent",
	plugins: [
		copyWasmFiles,
		/* add to the end of plugins array */
		esbuildProblemMatcherPlugin,
	],
	entryPoints: ["src/extension.ts"],
	format: "cjs",
	sourcesContent: false,
	platform: "node",
	outfile: "dist/extension.js",
	external: ["vscode"],
}

const tuiConfig = {
	bundle: true,
	minify: production,
	sourcemap: !production,
	logLevel: "silent",
	plugins: [
		createTUIWrapperPlugin,
		/* add to the end of plugins array */
		esbuildProblemMatcherPlugin,
	],
	entryPoints: ["src/tui/cli.ts"],
	format: "esm",
	sourcesContent: false,
	platform: "node",
	outfile: "dist/tui/cli.js",
	external: [],
	mainFields: ["module", "main"],
	conditions: ["node", "import"],
	packages: "external",
}

async function main() {
	const extensionCtx = await esbuild.context(extensionConfig)
	const tuiCtx = await esbuild.context(tuiConfig)
	
	if (watch) {
		await extensionCtx.watch()
		await tuiCtx.watch()
	} else {
		await extensionCtx.rebuild()
		await tuiCtx.rebuild()
		await extensionCtx.dispose()
		await tuiCtx.dispose()
	}
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})
