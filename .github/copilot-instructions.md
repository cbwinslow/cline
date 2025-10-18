# Copilot Instructions for Cline

## Project Overview

Cline is an AI-powered autonomous coding assistant that works both as a VS Code extension and as a standalone TUI (Text User Interface). It can create/edit files, execute terminal commands, analyze codebases, and interact with multiple LLM providers.

## Architecture

### Core Components

1. **VS Code Extension** (`src/core/`, `src/extension.ts`)
   - Main entry point: `extension.ts`
   - Core agent logic: `src/core/Cline.ts`
   - Webview provider: `src/core/webview/ClineProvider.ts`
   - Uses VS Code APIs extensively

2. **TUI (Terminal User Interface)** (`src/tui/`)
   - Standalone CLI application using Ink (React for CLI)
   - Decoupled from VS Code dependencies
   - Entry point: `src/tui/cli.ts`
   - Core logic: `src/tui/core/ClineCore.ts`
   - UI components: `src/tui/components/`

3. **Shared Logic** (`src/shared/`)
   - API configurations and types
   - Message types and protocols
   - Utility functions used across extension and TUI

4. **API Providers** (`src/api/`)
   - Multi-provider support: Anthropic, OpenAI, Gemini, Ollama, Bedrock, etc.
   - API handlers and format transformers

5. **Services** (`src/services/`)
   - Browser automation (`browser/`)
   - Code parsing (`tree-sitter/`)
   - File operations (`glob/`, `ripgrep/`)

6. **Integrations** (`src/integrations/`)
   - Terminal management
   - Editor operations
   - Diagnostics

## Code Style & Conventions

### TypeScript Configuration
- **Target**: ES2022
- **Module**: ESNext with Bundler resolution
- **Strict mode**: Enabled
- **JSX**: React (for TUI components)

### Formatting (Prettier)
- **Indentation**: Tabs (not spaces)
- **Tab Width**: 4
- **Print Width**: 120 characters
- **Semicolons**: Off (no semicolons)
- **JSX Brackets**: Same line

### ESLint Rules
- Use `camelCase` or `PascalCase` for imports
- No semicolons
- Use curly braces for control statements
- Use strict equality (`===`)
- Avoid throwing literal values

### Naming Conventions
- **Classes**: PascalCase (e.g., `ClineProvider`, `MCPManager`)
- **Interfaces/Types**: PascalCase (e.g., `ApiConfiguration`, `ClineMessage`)
- **Functions/Methods**: camelCase (e.g., `buildApiHandler`, `startTask`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `SYSTEM_PROMPT`)
- **Private members**: Prefix with underscore or use TypeScript `private` keyword

### File Organization
- One main export per file (class, function, or type)
- Group related utilities in dedicated files
- Keep files focused and under 500 lines when possible
- Use barrel exports (`index.ts`) for directories with multiple exports

## Development Patterns

### Event-Driven Architecture
- Use EventEmitter pattern for decoupled components
- VS Code extension uses VS Code event APIs
- TUI uses Node.js EventEmitter for component communication

### Async/Await
- Prefer `async/await` over Promise chains
- Always handle errors with try/catch
- Use `Promise.all()` for parallel operations
- Use `pWaitFor` for polling/waiting conditions

### Error Handling
- Use `serializeError` from `serialize-error` package for error serialization
- Provide user-friendly error messages
- Log errors appropriately (console for TUI, OutputChannel for VS Code)

### Type Safety
- Avoid `any` types; use proper TypeScript types
- Define interfaces for all data structures
- Use union types for state enums (e.g., `ClineAsk`, `ClineSay`)
- Leverage discriminated unions for message types

### API Integration
- All API calls go through `ApiHandler` interface
- Use provider-specific transformers in `src/api/transform/`
- Handle streaming responses appropriately
- Track token usage and costs

### File Operations
- Use `fs/promises` for async file operations
- Check file existence with `fileExistsAtPath` utility
- Use `path.resolve()` for absolute paths
- Handle binary files appropriately (use `isbinaryfile` package)

## TUI-Specific Guidelines

### Component Structure
- Use functional components with hooks
- Leverage Ink components: `Box`, `Text`, `useInput`, `useApp`
- Keep components focused on single responsibility
- Use React hooks for state management

### Module Compatibility
- TUI uses ES modules (ESM)
- VS Code extension uses CommonJS via esbuild
- Use stubs for VS Code dependencies in TUI (`src/tui/stubs/`)
- External packages should be bundled unless they have ESM compatibility issues

### Configuration Management
- Use `Conf` package for persistent configuration
- Support both global and project-level config
- Validate configuration values
- Provide sensible defaults

## Testing

### Running Tests
- VS Code extension tests: `npm test`
- Build extension: `npm run compile`
- Build TUI: `node esbuild.js`

### Test Patterns
- Keep tests close to the code they test
- Use descriptive test names
- Mock external dependencies (APIs, VS Code, file system)
- Test both success and error paths

## Common Tasks

### Adding a New API Provider
1. Create provider file in `src/api/providers/`
2. Implement `ApiHandler` interface
3. Add format transformer in `src/api/transform/` if needed
4. Update `buildApiHandler` in `src/api/index.ts`
5. Add model definitions in `src/shared/api.ts`
6. Update documentation

### Adding a TUI Component
1. Create component in `src/tui/components/`
2. Use Ink components and hooks
3. Follow React functional component patterns
4. Export component from file
5. Import and use in parent component (usually `App.tsx`)

### Adding a New Tool/Capability
1. Define tool schema in appropriate file
2. Implement tool execution logic
3. Add tool to available tools list
4. Handle tool responses appropriately
5. Update system prompt if needed
6. Add UI feedback for tool execution

## Dependencies

### Core Dependencies
- **@anthropic-ai/sdk**: Claude API integration
- **openai**: GPT API integration
- **@google/generative-ai**: Gemini API integration
- **vscode**: VS Code extension APIs (extension only)

### TUI Dependencies
- **ink**: React for CLI
- **ink-***: UI components for terminal
- **commander**: CLI argument parsing
- **conf**: Configuration management
- **chalk**: Terminal colors

### Utilities
- **axios**: HTTP requests
- **cheerio**: HTML parsing
- **tree-sitter-wasms**: Code parsing
- **puppeteer-core**: Browser automation
- **globby**: File globbing
- **diff**: Diff generation

## Security Considerations

- Never commit API keys or secrets
- Validate all user input
- Sanitize file paths to prevent directory traversal
- Use secure methods for credential storage
- Follow principle of least privilege
- Review generated code for security issues

## Performance Guidelines

- Use streaming for large API responses
- Implement proper caching where appropriate
- Avoid blocking the main thread in TUI
- Use lazy loading for heavy dependencies
- Optimize file operations (batch reads, use streams)
- Monitor and limit memory usage

## Documentation

- Document all public APIs with JSDoc comments
- Keep README files up to date
- Provide examples for complex features
- Document breaking changes in CHANGELOG
- Include troubleshooting guides

## Git Practices

- Write clear, descriptive commit messages
- Use conventional commit format when possible
- Keep commits focused and atomic
- Update documentation in the same commit as code changes
- Run linter and tests before committing

## VS Code Extension Specifics

### WebView Communication
- Use message passing between extension and webview
- Define message types in `src/shared/ExtensionMessage.ts` and `WebviewMessage.ts`
- Handle messages asynchronously
- Validate message structure

### State Management
- Extension state in `ClineProvider`
- Persist important state to global storage
- Use workspace state for project-specific data
- Clean up state on deactivation

### Commands
- Register commands in `package.json` under `contributes.commands`
- Implement command handlers in `extension.ts`
- Use command palette for discoverability
- Provide keyboard shortcuts where appropriate

## Debugging

### VS Code Extension
- Use F5 to launch extension development host
- Check Output panel for Cline logs
- Use VS Code debugger with breakpoints
- Check Developer Tools for webview debugging

### TUI
- Use `console.log` for debugging (visible in terminal)
- Use Node.js debugger or VS Code debugging
- Check configuration with `cline config --list`
- Test with `node dist/tui/cli-wrapper.mjs`

## Build System

### esbuild Configuration
- Extension: CommonJS output to `dist/extension.js`
- TUI: ESM output to `dist/tui/cli.js`
- Bundle most dependencies
- External: `vscode` for extension
- Use plugins for WASM files and stubs

### Watch Mode
- Use `npm run watch` for development
- Automatically rebuilds on file changes
- Watches both extension and webview

## MCP Server Integration

- MCP servers extend Cline's capabilities
- Configured in config file under `mcpServers`
- Managed by `MCPManager` in TUI
- Each server runs as separate process
- Use stdio for communication
- Handle server lifecycle (start, stop, restart)

## Memory & Rules Systems

### Memory System
- Stores context across sessions
- Relevance-based retrieval
- Configurable retention limits
- Managed by `MemoryManager`

### Rules Engine
- Defines behavior guidelines
- Priority-based application
- Can be enabled/disabled
- Managed by `RulesManager`

## When Making Changes

1. **Understand Context**: Read relevant code and documentation first
2. **Maintain Compatibility**: Ensure changes work in both extension and TUI (if applicable)
3. **Follow Patterns**: Use existing patterns and conventions
4. **Test Thoroughly**: Test both happy path and error cases
5. **Update Documentation**: Keep docs in sync with code
6. **Consider Performance**: Profile changes if they affect performance
7. **Security First**: Review for security implications
8. **Accessibility**: Consider TUI accessibility and VS Code accessibility

## Common Pitfalls to Avoid

- Don't use semicolons (project uses no-semicolon style)
- Don't use spaces for indentation (use tabs)
- Don't import `vscode` in TUI code (use stubs or abstraction)
- Don't bundle all packages in TUI (some need to be external)
- Don't ignore error handling (always handle errors)
- Don't hardcode paths (use path utilities)
- Don't expose secrets in logs or error messages
- Don't block event loop with synchronous operations

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Hooks](https://react.dev/reference/react)
