#!/usr/bin/env node

// Wrapper to import and run the ES module CLI
import('./cli.js')
	.then(module => {
		// The module will run its code on import
	})
	.catch(error => {
		console.error('Error loading Cline TUI:', error);
		process.exit(1);
	});
