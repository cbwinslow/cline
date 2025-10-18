# Issues to Create from PR #1

This document contains all the issues that should be created based on the recommendations and known issues from PR #1 (Add standalone TUI with MCP servers, memory system, and rules engine).

## Priority: Critical (P0)

### Issue 1: Implement Conversation Loop in ClineCore.processTask

**Title:** TUI: Implement conversation loop with API calls and tool execution in processTask

**Labels:** `bug`, `priority: critical`, `tui`, `needs-implementation`

**Description:**
The `processTask` method in `src/tui/core/ClineCore.ts` currently stops after pushing the user message and hits a TODO without invoking any model or emitting assistant responses. This causes the UI to never produce output and follow-up messages fail once `isRunning` is reset.

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

**Code Location:**
`src/tui/core/ClineCore.ts` lines 119-170 (particularly around line 170 where TODO comment exists)

**Suggested Implementation:**
The conversation loop should:
1. Call the API with system prompt and conversation history
2. Stream responses back to UI via events
3. Handle tool calls (file operations, terminal commands, browser actions)
4. Request user approval for tool execution
5. Add tool results back to conversation
6. Continue loop until task is complete or aborted

**Related PR Comment:**
From @chatgpt-codex-connector review: https://github.com/cbwinslow/cline/pull/1#discussion_r2442417887

---

## Priority: High (P1)

### Issue 2: Await Manager Initialization in ClineCore Constructor

**Title:** TUI: Fix unhandled promise in ClineCore manager initialization

**Labels:** `bug`, `priority: high`, `tui`, `error-handling`

**Description:**
The `ClineCore` constructor calls `initializeManagers()` which performs asynchronous setup (MCP servers, memory/rule loading), but the promise is not awaited. Any rejection becomes an unhandled promise and the TUI proceeds with undefined managers, leading to silent feature loss or process warnings.

**Current Behavior:**
```typescript
constructor(config: ApiConfiguration, cwd: string) {
    super();
    this.config = config;
    this.cwd = cwd;
    this.api = buildApiHandler(config);
    
    // Initialize managers
    this.initializeManagers(); // Promise not awaited!
}
```

**Expected Behavior:**
- Manager initialization is properly awaited before TUI accepts user input
- Initialization failures are surfaced to the user
- Managers are guaranteed to be ready before use

**Code Location:**
`src/tui/core/ClineCore.ts` lines 41-48

**Suggested Solution:**
1. Remove initialization from constructor
2. Expose an async `initialize()` method
3. Call and await it in `ClineTUI.start()` before rendering UI
4. Add proper error handling and user feedback

**Related PR Comment:**
From @chatgpt-codex-connector review: https://github.com/cbwinslow/cline/pull/1#discussion_r2442417888

---

### Issue 3: Fix Runtime Module Resolution Issues (ESM/CJS)

**Title:** TUI: Resolve ES module compatibility issues at runtime

**Labels:** `bug`, `priority: high`, `tui`, `build`, `esm`

**Description:**
The TUI builds successfully but has ESM/CJS module resolution issues at runtime. Some dependencies have complex module structures that don't play well with esbuild's ESM bundling.

**Symptoms:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
```

**Root Cause:**
Some dependencies have complex module structures that don't work well with esbuild's ESM bundling strategy.

**Solution Options (in order of preference):**

1. **Option A: Fix ESM Import Paths** (Recommended)
   - Add `.js` extensions to imports in problematic packages
   - Use esbuild `resolveExtensions` option
   - May require patching some dependencies
   - Keeps modern ES module benefits

2. **Option B: Selective External Bundling**
   - Bundle most code but mark specific problematic packages as external
   - Ensure those packages are properly installed in node_modules
   - Use package.json exports fields correctly
   - Better compatibility without sacrificing modularity

3. **Option C: Use CJS as Fallback** (Last Resort)
   - Change `format: "esm"` to `format: "cjs"` in esbuild config
   - Remove ES module package.json
   - Loses some modern ESM benefits but maximum compatibility

**Testing:**
```bash
npm run compile
node dist/tui/cli-wrapper.mjs --help
```

**Reference:**
See `TUI_IMPLEMENTATION_STATUS.md` section "Runtime Module Resolution"

---

## Priority: Medium (P2)

### Issue 4: Replace Deprecated substr() with substring()

**Title:** Code quality: Replace deprecated substr() with substring()

**Labels:** `code-quality`, `priority: medium`, `technical-debt`

**Description:**
The deprecated `substr()` method is used in 3 locations across the TUI codebase. It should be replaced with the modern `substring()` method.

**Files to Update:**
1. `src/tui/core/RulesManager.ts` line 82
2. `src/tui/core/RulesManager.ts` line 117
3. `src/tui/core/MemoryManager.ts` line 64

**Changes Needed:**
Replace all instances of:
```typescript
Math.random().toString(36).substr(2, 9)
```

With:
```typescript
Math.random().toString(36).substring(2, 11)
```

**Note:** The second parameter differs because `substr()` takes a length while `substring()` takes an ending index.

**Related PR Comments:**
- https://github.com/cbwinslow/cline/pull/1#discussion_r2442416146
- https://github.com/cbwinslow/cline/pull/1#discussion_r2442416148
- https://github.com/cbwinslow/cline/pull/1#discussion_r2442416150

---

### Issue 5: Use Template Literals for String Concatenation

**Title:** Code quality: Use template literals for better readability

**Labels:** `code-quality`, `priority: medium`, `refactoring`

**Description:**
String concatenation using `+` operator should be replaced with template literals for better readability and maintainability.

**Files to Update:**
1. `src/tui/core/ClineCore.ts` line 131
2. `src/tui/core/ClineCore.ts` line 191

**Changes Needed:**

**Location 1 (line 131):**
Replace:
```typescript
systemPrompt += '\n\n## Relevant Memories:\n' + relevantMemories.join('\n');
```

With:
```typescript
systemPrompt += `\n\n## Relevant Memories:\n${relevantMemories.join('\n')}`;
```

**Location 2 (line 191):**
Replace:
```typescript
prompt += '\n\n## Rules:\n' + rules.join('\n');
```

With:
```typescript
prompt += `\n\n## Rules:\n${rules.join('\n')}`;
```

**Related PR Comments:**
- https://github.com/cbwinslow/cline/pull/1#discussion_r2442416153
- https://github.com/cbwinslow/cline/pull/1#discussion_r2442416155

---

### Issue 6: Use parseAsync in CLI to Prevent Premature Exit

**Title:** TUI: Use parseAsync in CLI entry point

**Labels:** `enhancement`, `priority: medium`, `tui`, `cli`

**Description:**
The CLI entry point uses synchronous `program.parse()` which can lead to premature exit before async command handlers complete. Should use `parseAsync()` instead.

**File:** `src/tui/cli.ts` line 94

**Current Code:**
```typescript
program.parse(process.argv);
```

**Suggested Change:**
```typescript
(async () => {
    await program.parseAsync(process.argv);
})();
```

**Benefit:**
Ensures all async command handlers complete before the process exits, preventing potential data loss or incomplete operations.

**Related PR Comment:**
From @qodo-merge-pro review: https://github.com/cbwinslow/cline/pull/1#discussion_r2442417042

---

## Priority: Low (P3) - Testing

### Issue 7: Add Unit Tests for TUI Core Managers

**Title:** Testing: Add unit tests for MCPManager, MemoryManager, and RulesManager

**Labels:** `testing`, `priority: low`, `enhancement`

**Description:**
The TUI core managers need comprehensive unit tests to ensure reliability.

**Test Coverage Needed:**

**MCPManager** (`src/tui/core/MCPManager.ts`):
- [ ] Initialize with server configurations
- [ ] Start and stop individual servers
- [ ] Handle server crashes and restarts
- [ ] Track server status correctly
- [ ] Handle request/response communication
- [ ] Clean up on shutdown

**MemoryManager** (`src/tui/core/MemoryManager.ts`):
- [ ] Load memories from disk
- [ ] Save memories to disk
- [ ] Add new memories with tags
- [ ] Retrieve relevant memories based on query
- [ ] Respect maxMemories limit
- [ ] Calculate relevance scores correctly
- [ ] Handle corrupted memory files

**RulesManager** (`src/tui/core/RulesManager.ts`):
- [ ] Load rules from disk
- [ ] Create default rules on first run
- [ ] Add custom rules
- [ ] Update rule properties (enabled, priority)
- [ ] Delete rules
- [ ] Get rules sorted by priority
- [ ] Get only enabled rules
- [ ] Handle corrupted rule files

**Testing Framework:**
Use existing test infrastructure (likely Jest based on package.json)

**Reference:**
`TUI_IMPLEMENTATION_STATUS.md` section "Testing"

---

### Issue 8: Add Integration Tests for TUI API Interactions

**Title:** Testing: Add integration tests for API provider interactions

**Labels:** `testing`, `priority: low`, `enhancement`, `api`

**Description:**
Add integration tests to verify that ClineCore correctly interacts with various API providers.

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

**Reference:**
`TUI_IMPLEMENTATION_STATUS.md` section "Testing"

---

### Issue 9: Add UI Component Tests for React/Ink Components

**Title:** Testing: Add tests for TUI React/Ink components

**Labels:** `testing`, `priority: low`, `enhancement`, `ui`

**Description:**
The TUI UI components built with React/Ink need tests to ensure proper rendering and interaction handling.

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

**Testing Framework:**
Use `ink-testing-library` for Ink component testing

**Reference:**
`TUI_IMPLEMENTATION_STATUS.md` section "Testing"

---

## Priority: Future Enhancement

### Issue 10: Enhanced Diff Visualization in TUI

**Title:** Enhancement: Add improved diff visualization in terminal

**Labels:** `enhancement`, `tui`, `ui`, `future`

**Description:**
Add enhanced diff visualization for file changes in the TUI, similar to what's available in the VS Code extension.

**Features:**
- [ ] Side-by-side diff view in terminal (using terminal width)
- [ ] Unified diff with syntax highlighting
- [ ] Inline diff for small changes
- [ ] Navigation controls for large diffs
- [ ] Color-coded additions/deletions
- [ ] Line numbers

**Possible Libraries:**
- `diff` (already in dependencies)
- `chalk` (already in dependencies)
- Custom rendering logic for terminal constraints

**Reference:**
`TUI_IMPLEMENTATION_STATUS.md` section "Polish (Future Enhancements)"

---

### Issue 11: Terminal Multiplexing Support

**Title:** Enhancement: Add terminal multiplexing support for TUI

**Labels:** `enhancement`, `tui`, `terminal`, `future`

**Description:**
Add support for terminal multiplexing tools like tmux and screen to enable better session management and multi-pane workflows.

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

**Reference:**
`TUI_IMPLEMENTATION_STATUS.md` section "Polish (Future Enhancements)"

---

### Issue 12: Session Persistence Across TUI Restarts

**Title:** Enhancement: Add session persistence for TUI

**Labels:** `enhancement`, `tui`, `persistence`, `future`

**Description:**
Add the ability to persist TUI sessions across restarts, allowing users to resume conversations and continue work after closing the TUI.

**Features:**
- [ ] Save conversation state to disk on exit
- [ ] Restore conversation on startup
- [ ] Multiple named sessions
- [ ] Session switching
- [ ] Session deletion
- [ ] Auto-save at intervals

**Storage:**
- Store in `~/.cline/sessions/`
- JSON format for conversation history
- Separate files per session
- Include task state, messages, and context

**CLI Commands:**
```bash
cline --session my-project
cline sessions list
cline sessions delete my-project
```

**Reference:**
`TUI_IMPLEMENTATION_STATUS.md` section "Polish (Future Enhancements)"

---

### Issue 13: Export/Import Conversations

**Title:** Enhancement: Add conversation export/import functionality

**Labels:** `enhancement`, `tui`, `data`, `future`

**Description:**
Add ability to export conversations to various formats and import them back, enabling sharing, archiving, and migration.

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
```bash
cline export --format markdown --output conversation.md
cline export --format json --output backup.json
cline import backup.json
```

**Reference:**
`TUI_IMPLEMENTATION_STATUS.md` section "Polish (Future Enhancements)"

---

### Issue 14: Streaming Response Rendering

**Title:** Enhancement: Add streaming response rendering in TUI

**Labels:** `enhancement`, `tui`, `ui`, `future`

**Description:**
Implement streaming response rendering to show LLM responses as they are generated, rather than waiting for complete responses.

**Features:**
- [ ] Real-time token rendering
- [ ] Smooth scrolling as content appears
- [ ] Partial markdown rendering
- [ ] Animation for "thinking" state
- [ ] Token-by-token updates
- [ ] Handle backspace/corrections from streaming API

**Technical Considerations:**
- Update Ink components to handle streaming state
- Buffer and render tokens efficiently
- Handle terminal width and wrapping
- Maintain smooth UX without flickering

**Benefits:**
- Faster perceived response time
- Better user feedback
- More engaging experience
- Matches modern AI chat interfaces

**Reference:**
`TUI_IMPLEMENTATION_STATUS.md` section "Polish (Future Enhancements)"

---

### Issue 15: Autocomplete for Context Mentions

**Title:** Enhancement: Add autocomplete for @file, @folder, @url mentions

**Labels:** `enhancement`, `tui`, `ui`, `autocomplete`, `future`

**Description:**
Add intelligent autocomplete when users type context mentions (@file, @folder, @url) in the input box.

**Features:**
- [ ] File path autocomplete for @file
- [ ] Directory autocomplete for @folder
- [ ] URL history for @url
- [ ] Fuzzy matching
- [ ] Recent items prioritized
- [ ] Keyboard navigation through suggestions
- [ ] Preview of selected item

**Implementation:**
- Trigger autocomplete on `@` character
- Show dropdown with suggestions
- Navigate with arrow keys
- Select with Enter or Tab
- Cancel with Escape

**UI Library:**
Use `ink-select-input` or custom component for dropdown

**Example:**
```
> @file src/
  → src/tui/cli.ts
    src/tui/components/App.tsx
    src/tui/core/ClineCore.ts
```

**Reference:**
`TUI_IMPLEMENTATION_STATUS.md` section "Polish (Future Enhancements)"

---

### Issue 16: Interactive Tool Approval Workflow

**Title:** Enhancement: Add interactive tool approval UI in TUI

**Labels:** `enhancement`, `tui`, `ui`, `security`, `future`

**Description:**
Implement an interactive tool approval workflow that allows users to review and approve/reject tool calls before they are executed.

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
```
┌─────────────────────────────────────────┐
│ Tool Execution Pending                  │
├─────────────────────────────────────────┤
│ Type: write_to_file                     │
│ Path: src/utils/helper.ts               │
│                                         │
│ [View Diff] [Approve] [Reject] [Edit]  │
└─────────────────────────────────────────┘
```

**Configuration:**
- Auto-approve for low-risk operations (read-only)
- Always prompt for high-risk operations (delete, execute)
- Configurable per tool type

**Reference:**
`TUI_IMPLEMENTATION_STATUS.md` section "Polish (Future Enhancements)"

---

## Summary

This document outlines **16 issues** to be created based on PR #1:

**By Priority:**
- **P0 (Critical):** 1 issue - Conversation loop implementation
- **P1 (High):** 2 issues - Manager initialization, Module resolution
- **P2 (Medium):** 3 issues - Code quality improvements
- **P3 (Low - Testing):** 3 issues - Unit tests, Integration tests, UI tests
- **Future Enhancements:** 7 issues - New features for improved UX

**By Category:**
- **Bugs:** 3 issues
- **Code Quality:** 3 issues
- **Testing:** 3 issues
- **Enhancements:** 7 issues

All issues reference the specific PR comments and documentation sections where they were identified.
