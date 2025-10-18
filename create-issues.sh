#!/bin/bash

# Script to create GitHub issues from PR #1 recommendations and known issues
# This script uses the GitHub CLI (gh) to create issues
# Install gh: https://cli.github.com/

set -e

REPO="cbwinslow/cline"

echo "Creating issues for ${REPO} based on PR #1..."
echo ""

# Issue 1: Conversation Loop (P0 - Critical)
echo "Creating Issue 1: Implement conversation loop in processTask..."
gh issue create \
  --repo "$REPO" \
  --title "TUI: Implement conversation loop with API calls and tool execution in processTask" \
  --label "bug,priority: critical,tui,needs-implementation" \
  --body "The \`processTask\` method in \`src/tui/core/ClineCore.ts\` currently stops after pushing the user message and hits a TODO without invoking any model or emitting assistant responses.

**Current Behavior:**
- User sends a message
- Message is added to conversation history
- Task immediately marks as complete
- No API call is made, no response is generated

**Expected Behavior:**
- User sends a message
- API is called with the conversation history
- Streaming responses are received and emitted
- Assistant messages are published to UI
- Tool calls are executed when requested
- Conversation loop continues until completion

**Code Location:** \`src/tui/core/ClineCore.ts\` lines 119-170

**Suggested Implementation:**
The conversation loop should:
1. Call the API with system prompt and conversation history
2. Stream responses back to UI via events
3. Handle tool calls (file operations, terminal commands, browser actions)
4. Request user approval for tool execution
5. Add tool results back to conversation
6. Continue loop until task is complete or aborted

**Related PR Comment:** https://github.com/cbwinslow/cline/pull/1#discussion_r2442417887"

echo "✓ Issue 1 created"
echo ""

# Issue 2: Manager Initialization (P1 - High)
echo "Creating Issue 2: Await manager initialization..."
gh issue create \
  --repo "$REPO" \
  --title "TUI: Fix unhandled promise in ClineCore manager initialization" \
  --label "bug,priority: high,tui,error-handling" \
  --body "The \`ClineCore\` constructor calls \`initializeManagers()\` which performs asynchronous setup (MCP servers, memory/rule loading), but the promise is not awaited. Any rejection becomes an unhandled promise.

**Current Behavior:**
\`\`\`typescript
constructor(config: ApiConfiguration, cwd: string) {
    super();
    this.config = config;
    this.cwd = cwd;
    this.api = buildApiHandler(config);
    
    // Initialize managers
    this.initializeManagers(); // Promise not awaited!
}
\`\`\`

**Expected Behavior:**
- Manager initialization is properly awaited before TUI accepts user input
- Initialization failures are surfaced to the user
- Managers are guaranteed to be ready before use

**Code Location:** \`src/tui/core/ClineCore.ts\` lines 41-48

**Suggested Solution:**
1. Remove initialization from constructor
2. Expose an async \`initialize()\` method
3. Call and await it in \`ClineTUI.start()\` before rendering UI
4. Add proper error handling and user feedback

**Related PR Comment:** https://github.com/cbwinslow/cline/pull/1#discussion_r2442417888"

echo "✓ Issue 2 created"
echo ""

# Issue 3: Runtime Module Resolution (P1 - High)
echo "Creating Issue 3: Fix runtime module resolution..."
gh issue create \
  --repo "$REPO" \
  --title "TUI: Resolve ES module compatibility issues at runtime" \
  --label "bug,priority: high,tui,build,esm" \
  --body "The TUI builds successfully but has ESM/CJS module resolution issues at runtime.

**Symptoms:**
\`\`\`
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
\`\`\`

**Root Cause:**
Some dependencies have complex module structures that don't work well with esbuild's ESM bundling strategy.

**Solution Options (in order of preference):**

1. **Option A: Fix ESM Import Paths** (Recommended)
   - Add \`.js\` extensions to imports in problematic packages
   - Use esbuild \`resolveExtensions\` option
   - May require patching some dependencies
   - Keeps modern ES module benefits

2. **Option B: Selective External Bundling**
   - Bundle most code but mark specific problematic packages as external
   - Ensure those packages are properly installed in node_modules
   - Use package.json exports fields correctly
   - Better compatibility without sacrificing modularity

3. **Option C: Use CJS as Fallback** (Last Resort)
   - Change \`format: \"esm\"\` to \`format: \"cjs\"\` in esbuild config
   - Remove ES module package.json
   - Loses some modern ESM benefits but maximum compatibility

**Testing:**
\`\`\`bash
npm run compile
node dist/tui/cli-wrapper.mjs --help
\`\`\`

**Reference:** See \`TUI_IMPLEMENTATION_STATUS.md\` section \"Runtime Module Resolution\""

echo "✓ Issue 3 created"
echo ""

# Issue 4: Replace substr (P2 - Medium)
echo "Creating Issue 4: Replace deprecated substr()..."
gh issue create \
  --repo "$REPO" \
  --title "Code quality: Replace deprecated substr() with substring()" \
  --label "code-quality,priority: medium,technical-debt" \
  --body "The deprecated \`substr()\` method is used in 1 location and should be replaced with \`substring()\`.

**Note:** Two of the three instances mentioned in the PR review (lines 82 and 64) have already been fixed. Only one remains.

**File to Update:**
1. \`src/tui/core/RulesManager.ts\` line 117

**Change:**
Replace:
\`\`\`typescript
id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
\`\`\`

With:
\`\`\`typescript
id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
\`\`\`

**Note:** The second parameter differs because \`substr()\` takes a length while \`substring()\` takes an ending index.

**Related PR Comments:**
- https://github.com/cbwinslow/cline/pull/1#discussion_r2442416146
- https://github.com/cbwinslow/cline/pull/1#discussion_r2442416148
- https://github.com/cbwinslow/cline/pull/1#discussion_r2442416150"

echo "✓ Issue 4 created"
echo ""

# Issue 5: Template Literals (P2 - Medium)
echo "Creating Issue 5: Use template literals..."
gh issue create \
  --repo "$REPO" \
  --title "Code quality: Use template literals for better readability" \
  --label "code-quality,priority: medium,refactoring" \
  --body "String concatenation using \`+\` operator should be replaced with template literals for better readability.

**Files to Update:**
1. \`src/tui/core/ClineCore.ts\` line 131
2. \`src/tui/core/ClineCore.ts\` line 191

**Location 1 (line 131):**
Replace:
\`\`\`typescript
systemPrompt += '\\n\\n## Relevant Memories:\\n' + relevantMemories.join('\\n');
\`\`\`

With:
\`\`\`typescript
systemPrompt += \`\\n\\n## Relevant Memories:\\n\${relevantMemories.join('\\n')}\`;
\`\`\`

**Location 2 (line 191):**
Replace:
\`\`\`typescript
prompt += '\\n\\n## Rules:\\n' + rules.join('\\n');
\`\`\`

With:
\`\`\`typescript
prompt += \`\\n\\n## Rules:\\n\${rules.join('\\n')}\`;
\`\`\`

**Related PR Comments:**
- https://github.com/cbwinslow/cline/pull/1#discussion_r2442416153
- https://github.com/cbwinslow/cline/pull/1#discussion_r2442416155"

echo "✓ Issue 5 created"
echo ""

# Issue 6: parseAsync (P2 - Medium)
echo "Creating Issue 6: Use parseAsync in CLI..."
gh issue create \
  --repo "$REPO" \
  --title "TUI: Use parseAsync in CLI entry point" \
  --label "enhancement,priority: medium,tui,cli" \
  --body "The CLI entry point uses synchronous \`program.parse()\` which can lead to premature exit before async command handlers complete.

**File:** \`src/tui/cli.ts\` line 94

**Current Code:**
\`\`\`typescript
program.parse(process.argv);
\`\`\`

**Suggested Change:**
\`\`\`typescript
(async () => {
    await program.parseAsync(process.argv);
})();
\`\`\`

**Benefit:**
Ensures all async command handlers complete before the process exits, preventing potential data loss or incomplete operations.

**Related PR Comment:** https://github.com/cbwinslow/cline/pull/1#discussion_r2442417042"

echo "✓ Issue 6 created"
echo ""

# Issue 7: Unit Tests (P3 - Low)
echo "Creating Issue 7: Add unit tests for core managers..."
gh issue create \
  --repo "$REPO" \
  --title "Testing: Add unit tests for MCPManager, MemoryManager, and RulesManager" \
  --label "testing,priority: low,enhancement" \
  --body "The TUI core managers need comprehensive unit tests to ensure reliability.

**Test Coverage Needed:**

**MCPManager** (\`src/tui/core/MCPManager.ts\`):
- [ ] Initialize with server configurations
- [ ] Start and stop individual servers
- [ ] Handle server crashes and restarts
- [ ] Track server status correctly
- [ ] Handle request/response communication
- [ ] Clean up on shutdown

**MemoryManager** (\`src/tui/core/MemoryManager.ts\`):
- [ ] Load memories from disk
- [ ] Save memories to disk
- [ ] Add new memories with tags
- [ ] Retrieve relevant memories based on query
- [ ] Respect maxMemories limit
- [ ] Calculate relevance scores correctly
- [ ] Handle corrupted memory files

**RulesManager** (\`src/tui/core/RulesManager.ts\`):
- [ ] Load rules from disk
- [ ] Create default rules on first run
- [ ] Add custom rules
- [ ] Update rule properties (enabled, priority)
- [ ] Delete rules
- [ ] Get rules sorted by priority
- [ ] Get only enabled rules
- [ ] Handle corrupted rule files

**Reference:** \`TUI_IMPLEMENTATION_STATUS.md\` section \"Testing\""

echo "✓ Issue 7 created"
echo ""

# Issue 8: Integration Tests (P3 - Low)
echo "Creating Issue 8: Add integration tests for API interactions..."
gh issue create \
  --repo "$REPO" \
  --title "Testing: Add integration tests for API provider interactions" \
  --label "testing,priority: low,enhancement,api" \
  --body "Add integration tests to verify that ClineCore correctly interacts with various API providers.

**Test Coverage Needed:**
- [ ] Test API configuration for each provider (Anthropic, OpenAI, Gemini, Ollama, Bedrock, Azure)
- [ ] Test streaming responses
- [ ] Test error handling (rate limits, auth failures, network errors)
- [ ] Test system prompt construction with custom instructions
- [ ] Test memory integration in prompts
- [ ] Test rules integration in prompts
- [ ] Test tool calling framework
- [ ] Test conversation history management

**Approach:**
- Use mock API responses for predictable testing
- Test against real APIs in a separate CI job (with appropriate safeguards)
- Verify event emissions at each stage

**Reference:** \`TUI_IMPLEMENTATION_STATUS.md\` section \"Testing\""

echo "✓ Issue 8 created"
echo ""

# Issue 9: UI Tests (P3 - Low)
echo "Creating Issue 9: Add UI component tests..."
gh issue create \
  --repo "$REPO" \
  --title "Testing: Add tests for TUI React/Ink components" \
  --label "testing,priority: low,enhancement,ui" \
  --body "The TUI UI components built with React/Ink need tests to ensure proper rendering and interaction handling.

**Components to Test:**

**App.tsx:**
- [ ] View switching (Chat, Settings, History)
- [ ] Keyboard shortcuts (Ctrl+1, Ctrl+2, Ctrl+3, Ctrl+Q)
- [ ] Event handling from core
- [ ] State updates

**ChatView.tsx:**
- [ ] Message rendering
- [ ] Tool execution visualization
- [ ] Image attachment indicators
- [ ] Processing spinners
- [ ] Welcome screen

**SettingsView.tsx:**
- [ ] Configuration display
- [ ] MCP server status
- [ ] Memory statistics
- [ ] Rules list

**InputBox.tsx:**
- [ ] Text input
- [ ] Submit on Enter
- [ ] Context mention support (@file, @folder, @url)
- [ ] Disabled state

**Testing Framework:** Use \`ink-testing-library\` for Ink component testing

**Reference:** \`TUI_IMPLEMENTATION_STATUS.md\` section \"Testing\""

echo "✓ Issue 9 created"
echo ""

# Issue 10: Enhanced Diff (Future)
echo "Creating Issue 10: Enhanced diff visualization..."
gh issue create \
  --repo "$REPO" \
  --title "Enhancement: Add improved diff visualization in terminal" \
  --label "enhancement,tui,ui,future" \
  --body "Add enhanced diff visualization for file changes in the TUI.

**Features:**
- [ ] Side-by-side diff view in terminal (using terminal width)
- [ ] Unified diff with syntax highlighting
- [ ] Inline diff for small changes
- [ ] Navigation controls for large diffs
- [ ] Color-coded additions/deletions
- [ ] Line numbers

**Possible Libraries:**
- \`diff\` (already in dependencies)
- \`chalk\` (already in dependencies)
- Custom rendering logic for terminal constraints

**Reference:** \`TUI_IMPLEMENTATION_STATUS.md\` section \"Polish (Future Enhancements)\""

echo "✓ Issue 10 created"
echo ""

# Issue 11: Terminal Multiplexing (Future)
echo "Creating Issue 11: Terminal multiplexing support..."
gh issue create \
  --repo "$REPO" \
  --title "Enhancement: Add terminal multiplexing support for TUI" \
  --label "enhancement,tui,terminal,future" \
  --body "Add support for terminal multiplexing tools like tmux and screen.

**Features:**
- [ ] Detect when running inside tmux/screen
- [ ] Integrate with tmux pane system for split views
- [ ] Support tmux copy-paste buffer
- [ ] Handle terminal resize events
- [ ] Persist session state in tmux

**Benefits:**
- Better workflow for power users
- Natural split-pane experience
- Session persistence through tmux
- Integration with existing terminal workflows

**Reference:** \`TUI_IMPLEMENTATION_STATUS.md\` section \"Polish (Future Enhancements)\""

echo "✓ Issue 11 created"
echo ""

# Issue 12: Session Persistence (Future)
echo "Creating Issue 12: Session persistence..."
gh issue create \
  --repo "$REPO" \
  --title "Enhancement: Add session persistence for TUI" \
  --label "enhancement,tui,persistence,future" \
  --body "Add the ability to persist TUI sessions across restarts.

**Features:**
- [ ] Save conversation state to disk on exit
- [ ] Restore conversation on startup
- [ ] Multiple named sessions
- [ ] Session switching
- [ ] Session deletion
- [ ] Auto-save at intervals

**Storage:**
- Store in \`~/.cline/sessions/\`
- JSON format for conversation history
- Separate files per session
- Include task state, messages, and context

**CLI Commands:**
\`\`\`bash
cline --session my-project
cline sessions list
cline sessions delete my-project
\`\`\`

**Reference:** \`TUI_IMPLEMENTATION_STATUS.md\` section \"Polish (Future Enhancements)\""

echo "✓ Issue 12 created"
echo ""

# Issue 13: Export/Import (Future)
echo "Creating Issue 13: Export/import conversations..."
gh issue create \
  --repo "$REPO" \
  --title "Enhancement: Add conversation export/import functionality" \
  --label "enhancement,tui,data,future" \
  --body "Add ability to export conversations to various formats and import them back.

**Export Formats:**
- [ ] JSON (full fidelity with all metadata)
- [ ] Markdown (readable format for documentation)
- [ ] HTML (rich format with styling)
- [ ] Plain text (simple format)

**Features:**
- [ ] Export current conversation
- [ ] Export conversation history
- [ ] Import from previous exports
- [ ] Selective export (filter by date, tags, etc.)
- [ ] Batch export/import

**CLI Commands:**
\`\`\`bash
cline export --format markdown --output conversation.md
cline export --format json --output backup.json
cline import backup.json
\`\`\`

**Reference:** \`TUI_IMPLEMENTATION_STATUS.md\` section \"Polish (Future Enhancements)\""

echo "✓ Issue 13 created"
echo ""

# Issue 14: Streaming (Future)
echo "Creating Issue 14: Streaming response rendering..."
gh issue create \
  --repo "$REPO" \
  --title "Enhancement: Add streaming response rendering in TUI" \
  --label "enhancement,tui,ui,future" \
  --body "Implement streaming response rendering to show LLM responses as they are generated.

**Features:**
- [ ] Real-time token rendering
- [ ] Smooth scrolling as content appears
- [ ] Partial markdown rendering
- [ ] Animation for \"thinking\" state
- [ ] Token-by-token updates
- [ ] Handle backspace/corrections from streaming API

**Benefits:**
- Faster perceived response time
- Better user feedback
- More engaging experience
- Matches modern AI chat interfaces

**Reference:** \`TUI_IMPLEMENTATION_STATUS.md\` section \"Polish (Future Enhancements)\""

echo "✓ Issue 14 created"
echo ""

# Issue 15: Autocomplete (Future)
echo "Creating Issue 15: Autocomplete for context mentions..."
gh issue create \
  --repo "$REPO" \
  --title "Enhancement: Add autocomplete for @file, @folder, @url mentions" \
  --label "enhancement,tui,ui,autocomplete,future" \
  --body "Add intelligent autocomplete when users type context mentions (@file, @folder, @url).

**Features:**
- [ ] File path autocomplete for @file
- [ ] Directory autocomplete for @folder
- [ ] URL history for @url
- [ ] Fuzzy matching
- [ ] Recent items prioritized
- [ ] Keyboard navigation through suggestions
- [ ] Preview of selected item

**Implementation:**
- Trigger autocomplete on \`@\` character
- Show dropdown with suggestions
- Navigate with arrow keys
- Select with Enter or Tab
- Cancel with Escape

**Example:**
\`\`\`
> @file src/
  → src/tui/cli.ts
    src/tui/components/App.tsx
    src/tui/core/ClineCore.ts
\`\`\`

**Reference:** \`TUI_IMPLEMENTATION_STATUS.md\` section \"Polish (Future Enhancements)\""

echo "✓ Issue 15 created"
echo ""

# Issue 16: Tool Approval (Future)
echo "Creating Issue 16: Interactive tool approval workflow..."
gh issue create \
  --repo "$REPO" \
  --title "Enhancement: Add interactive tool approval UI in TUI" \
  --label "enhancement,tui,ui,security,future" \
  --body "Implement an interactive tool approval workflow for reviewing and approving tool calls before execution.

**Features:**
- [ ] Show tool details before execution (command, file path, changes)
- [ ] Allow approve/reject/modify actions
- [ ] Show diff for file changes
- [ ] Batch approval for multiple tools
- [ ] Remember approval decisions (always allow, never allow)
- [ ] Approval timeout with configurable default action
- [ ] Audit log of tool executions

**Tool Types:**
- File operations (read, write, create, delete)
- Terminal commands
- Browser actions
- API calls
- MCP server requests

**UI Flow:**
\`\`\`
┌─────────────────────────────────────────┐
│ Tool Execution Pending                  │
├─────────────────────────────────────────┤
│ Type: write_to_file                     │
│ Path: src/utils/helper.ts               │
│                                         │
│ [View Diff] [Approve] [Reject] [Edit]  │
└─────────────────────────────────────────┘
\`\`\`

**Configuration:**
- Auto-approve for low-risk operations (read-only)
- Always prompt for high-risk operations (delete, execute)
- Configurable per tool type

**Reference:** \`TUI_IMPLEMENTATION_STATUS.md\` section \"Polish (Future Enhancements)\""

echo "✓ Issue 16 created"
echo ""

echo "=========================================="
echo "✅ All 16 issues created successfully!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - P0 (Critical): 1 issue"
echo "  - P1 (High): 2 issues"
echo "  - P2 (Medium): 3 issues"
echo "  - P3 (Low/Testing): 3 issues"
echo "  - Future Enhancements: 7 issues"
echo ""
echo "View all issues at: https://github.com/${REPO}/issues"
