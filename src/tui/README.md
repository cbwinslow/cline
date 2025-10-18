# Cline TUI (Text User Interface)

A standalone, terminal-based interface for Cline that provides all the features of the VS Code extension in a modular, command-line environment.

## Features

### 🎯 Core Capabilities
- **AI-Powered Coding Assistant**: Full access to Claude, GPT, Gemini, and other LLM providers
- **Autonomous Agent**: Execute complex multi-step tasks with approval workflow
- **File Operations**: Create, read, edit, and search files
- **Terminal Integration**: Execute commands and monitor output
- **Context Management**: Use @file, @folder, @url mentions for rich context

### 🔧 Advanced Features
- **MCP Servers**: Support for Model Context Protocol servers to extend capabilities
- **Memory System**: Persistent memories across sessions for better context retention
- **Rules Engine**: Define custom rules and guidelines for AI behavior
- **Multi-Provider Support**: Anthropic, OpenAI, Google Gemini, AWS Bedrock, Azure, Ollama
- **Browser Actions**: Fetch and analyze web content
- **Code Analysis**: Parse and understand codebases with tree-sitter

### 🎨 User Interface
- **Google Gemini-style TUI**: Clean, modern terminal interface
- **Real-time Streaming**: See AI responses as they're generated
- **Keyboard Shortcuts**: Efficient navigation and control
- **Settings Management**: Configure everything from the terminal
- **History View**: Review past conversations and tasks

## Installation

### From NPM (when published)
```bash
npm install -g cline
```

### From Source
```bash
git clone https://github.com/cline/cline.git
cd cline
npm install
npm run build
npm link
```

## Quick Start

### Initialize Configuration
```bash
cline init
```

This creates a `.clinerc.json` file with default settings.

### Start the TUI
```bash
cline
```

### With Custom Configuration
```bash
cline --config /path/to/config.json
```

### Specify API Provider and Key
```bash
cline --api-provider anthropic --api-key your-api-key
```

## Configuration

### Configuration File
Cline TUI looks for configuration in these locations (in order):
1. `--config` CLI argument
2. `.clinerc.json` in current directory
3. `~/.cline/config.json` in home directory

### Example Configuration
```json
{
  "apiProvider": "anthropic",
  "apiKey": "your-api-key-here",
  "apiModelId": "claude-3-5-sonnet-20240620",
  "customInstructions": "Always write tests for new functions",
  "alwaysAllowReadOnly": false,
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"]
    }
  },
  "memories": {
    "enabled": true,
    "maxMemories": 100,
    "storageDir": "~/.cline/memories"
  },
  "rules": {
    "enabled": true,
    "rulesDir": "~/.cline/rules"
  }
}
```

## Usage

### Basic Commands

#### Start a New Task
Simply type your request when the TUI starts:
```
> Create a new Express.js API server with authentication
```

#### Use Context Mentions
```
> @file src/app.js Refactor this to use async/await
> @folder src/components Review all React components for accessibility
> @url https://docs.example.com/api Implement this API
```

#### Keyboard Shortcuts
- `Ctrl+C`: Exit
- `Ctrl+S`: Open Settings
- `Ctrl+H`: View History
- `Esc`: Return to Chat
- `Enter`: Send Message

### Configuration Management

#### View Configuration
```bash
cline config --list
```

#### Set a Value
```bash
cline config --set apiProvider=anthropic
cline config --set apiKey=sk-...
```

#### Get a Value
```bash
cline config --get apiProvider
```

#### Reset Configuration
```bash
cline config --reset
```

## MCP Servers

Cline TUI supports Model Context Protocol (MCP) servers to extend functionality.

### Configuring MCP Servers
Add to your configuration file:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"],
      "env": {
        "API_KEY": "optional-env-var"
      }
    },
    "database": {
      "command": "mcp-server-db",
      "args": ["--connection", "postgresql://localhost/mydb"]
    }
  }
}
```

### Available MCP Servers
- **@modelcontextprotocol/server-filesystem**: File system operations
- **@modelcontextprotocol/server-github**: GitHub integration
- **@modelcontextprotocol/server-postgres**: PostgreSQL database access
- Custom servers: Write your own MCP-compatible servers

## Memory System

The memory system helps Cline remember important context across sessions.

### How It Works
- Automatically captures important information during conversations
- Retrieves relevant memories for new tasks
- Stores up to 100 memories by default (configurable)

### Managing Memories
Memories are stored in `~/.cline/memories/memories.json` by default.

You can:
- View memories in the Settings view
- Clear memories via configuration
- Adjust memory retention settings

## Rules System

Define custom rules to guide Cline's behavior.

### Default Rules
Cline comes with built-in rules for:
- Code quality
- Security best practices
- Testing requirements

### Adding Custom Rules
Edit `~/.cline/rules/rules.json`:
```json
{
  "id": "custom-1",
  "name": "Company Style Guide",
  "description": "Follow company coding standards",
  "content": "Always use 2 spaces for indentation. Use semicolons in JavaScript.",
  "enabled": true,
  "priority": 1,
  "tags": ["style", "code"]
}
```

## API Providers

### Supported Providers
- **Anthropic**: Claude models
- **OpenAI**: GPT-4, GPT-3.5
- **Google Gemini**: Gemini Pro
- **AWS Bedrock**: Claude on AWS
- **Azure OpenAI**: Enterprise OpenAI
- **Ollama**: Local models
- **OpenRouter**: Access to multiple providers

### Provider Configuration
Each provider requires specific configuration:

#### Anthropic
```bash
cline config --set apiProvider=anthropic
cline config --set apiKey=sk-ant-...
cline config --set apiModelId=claude-3-5-sonnet-20240620
```

#### OpenAI
```bash
cline config --set apiProvider=openai
cline config --set openAiApiKey=sk-...
cline config --set openAiModelId=gpt-4
```

#### Ollama (Local)
```bash
cline config --set apiProvider=ollama
cline config --set ollamaBaseUrl=http://localhost:11434
cline config --set ollamaModelId=llama2
```

## Troubleshooting

### TUI Not Starting
- Check that all dependencies are installed: `npm install`
- Verify Node.js version: `node --version` (requires 16+)
- Check configuration file for syntax errors

### API Errors
- Verify API key is correct
- Check API provider is available
- Ensure you have credits/quota remaining

### MCP Server Issues
- Verify server command is correct and accessible
- Check server logs for errors
- Ensure required environment variables are set

## Development

### Project Structure
```
src/tui/
├── cli.ts              # CLI entry point
├── ClineTUI.ts         # Main TUI orchestrator
├── components/         # React/Ink UI components
│   ├── App.tsx
│   ├── ChatView.tsx
│   ├── Header.tsx
│   ├── InputBox.tsx
│   ├── SettingsView.tsx
│   └── StatusBar.tsx
├── config/             # Configuration management
│   └── ConfigManager.ts
└── core/               # Core functionality
    ├── ClineCore.ts    # Main Cline logic
    ├── MCPManager.ts   # MCP server management
    ├── MemoryManager.ts # Memory system
    └── RulesManager.ts  # Rules engine
```

### Building
```bash
npm run build
```

### Development Mode
```bash
npm run watch
```

### Testing
```bash
npm test
```

## Differences from VS Code Extension

The TUI provides the same core functionality but with these differences:

### ✅ Included
- All AI capabilities
- File operations
- Terminal command execution
- MCP server support
- Memory and rules systems
- Multi-provider support

### ⚠️ Adapted
- No VS Code-specific UI (replaced with terminal UI)
- No integrated diff viewer (shows diffs as text)
- No native VS Code settings sync

### 🚧 Planned
- Improved diff visualization
- Terminal multiplexing
- Session persistence
- Export/import conversations

## Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

Apache 2.0 - See [LICENSE](../LICENSE)
