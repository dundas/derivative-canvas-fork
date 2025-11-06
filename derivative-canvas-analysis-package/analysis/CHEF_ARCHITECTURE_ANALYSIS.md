# Chef Project Architecture Analysis: Chat Flow & Code Updates

## Executive Summary

Chef is an AI-powered full-stack app builder built on Convex. The architecture is highly structured around a **streaming message parser** that extracts code artifacts and file modifications from LLM responses, automatically updating the UI and file system in real-time.

### Key Findings:
1. **Streaming Architecture**: Uses Server-Sent Events (SSE) with `createDataStream` from the AI SDK
2. **Message Parsing**: Custom `StreamingMessageParser` extracts `<boltArtifact>` and `<boltAction>` XML tags
3. **State Management**: Nanostores for client-side state, Convex for backend persistence
4. **File System**: Virtual file system abstraction (WebContainer) with real-time synchronization
5. **Bidirectional Sync**: Chat messages influence file updates; user edits sent back in context

---

## 1. Component Hierarchy

### 1.1 Chat Component Tree

```
ExistingChat.client.tsx
└── Chat.tsx (memo)
    ├── BaseChat.client.tsx (forwardRef)
    │   ├── Messages.client.tsx (forwardRef)
    │   │   ├── UserMessage.tsx
    │   │   └── AssistantMessage.tsx
    │   │       └── Artifact.tsx (memo)
    │   │           └── ActionList
    │   │               └── ActionState[]
    │   ├── MessageInput.tsx
    │   ├── StreamingIndicator.tsx
    │   └── Workbench.client.tsx
    │       ├── EditorPanel.tsx (CodeMirrorEditor)
    │       ├── Preview.tsx
    │       └── Dashboard.tsx
    └── UsageDebugView.tsx
```

### 1.2 Component Responsibilities

**Chat.tsx (Main Chat Controller)**
- File: `/Users/kefentse/dev_env/bolt_research/chef/app/components/chat/Chat.tsx`
- Orchestrates the entire chat experience
- Uses `useChat()` hook from @ai-sdk/react for streaming
- Manages message parsing via `useMessageParser()`
- Handles API key validation and token usage
- Triggers animations when chat starts

**BaseChat.client.tsx (Chat Layout)**
- Renders chat interface with messages panel and workbench side-by-side
- Manages subchat feature for branching conversations
- Controls message input and streaming indicators
- Responsive layout with mobile compatibility

**Messages.client.tsx (Message Display)**
- Renders message history
- Separates user vs assistant messages
- Shows rewind buttons for message history navigation
- Displays streaming indicator

**AssistantMessage.tsx (Message Part Rendering)**
- Processes message parts (text, tool-invocations, steps)
- Renders markdown content
- Embeds ToolCall components for artifact actions
- Displays usage annotations

**Artifact.tsx (File Modification Display)**
- Shows artifact card with "Click to open Workbench"
- Expands to show action list (file operations)
- Tracks action status (pending, running, complete, failed)
- Opens workbench when clicked

**ToolCall.tsx (Individual Tool Invocation)**
- Displays single file modification or tool call
- Shows status icon (pending/running/complete/error)
- Expands to show detailed output
- Links to workbench for file viewing

**Workbench.client.tsx (File Editor)**
- Split-pane layout (code editor, preview, terminal)
- EditorPanel with CodeMirror
- Preview iframe for live preview
- Terminal for build/deployment logs

---

## 2. Data Flow: User Input → LLM → File Updates → UI Updates

### 2.1 Message Send Flow

```
User Input in MessageInput
    ↓
sendMessage() in Chat.tsx
    ↓
append(message) → useChat hook
    ↓
experimental_prepareRequestBody() (Client)
    ├── Get current files from workbenchStore
    ├── Prepare message context via ChatContextManager
    ├── Get relevant files based on LRU cache
    ├── Get modified files since last user message
    ├── Construct request body with metadata
    └── Send to /api/chat endpoint
    ↓
POST /api/chat → chatAction() Server Handler
```

### 2.2 Chat API Handler Flow

**File**: `/Users/kefentse/dev_env/bolt_research/chef/app/lib/.server/chat.ts`

```
chatAction({ request })
    ↓
Parse request body
    ├── messages: Message[]
    ├── firstUserMessage: boolean
    ├── chatInitialId: string
    ├── modelProvider: ModelProvider
    ├── shouldDisableTools: boolean
    ├── recordRawPromptsForDebugging: boolean
    └── userApiKey: optional override
    ↓
Check token usage (Convex)
    ├── If exceeded quota → return 402 error
    ├── If team disabled → return 402 error
    └── If user has API key → use user key
    ↓
convexAgent() Function
    ├── Get model provider instance
    ├── Build system prompt with options
    ├── Construct message array with system prompt
    ├── Cache control (Anthropic/Bedrock)
    └── Create data stream with streamText()
    ↓
createDataStream({ execute })
    ├── result = streamText({
    │   ├── model
    │   ├── messages (with context)
    │   ├── tools (deploy, edit, view, npmInstall, etc.)
    │   ├── toolChoice (auto or none)
    │   ├── maxTokens
    │   ├── onFinish → onFinishHandler()
    │   └── experimental_telemetry
    │ })
    ├── Track first response time
    ├── result.mergeIntoDataStream(dataStream)
    └── Return dataStream as SSE response
```

### 2.3 LLM Response Streaming

**Streaming Format**: Text/event-stream with structured events

```
Server (AI SDK) → Client
    ├── text deltas (streaming tokens)
    ├── tool-call-start events
    ├── tool-call-delta events
    ├── tool-call-end events
    ├── finish event
    └── usage event
```

### 2.4 Client-Side Streaming & Parsing

**File**: `/Users/kefentse/dev_env/bolt_research/chef/app/lib/hooks/useMessageParser.ts`

```
useChat hook receives stream
    ↓
onToolCall({ toolCall }) callback
    ├── workbenchStore.waitOnToolCall(toolCallId)
    └── Returns result promise that resolves when action completes
    ↓
Messages accumulate in state
    ↓
processSampledMessages() (throttled, 50ms)
    ├── parseMessages(messages)
    └── storeMessageHistory(messages, status)
    ↓
parseMessages(messages)
    ├── For each message:
    │   └── processMessage(message, previousParts)
    │       ├── Cache previous parse results
    │       ├── For each part:
    │       │   ├── If text:
    │       │   │   ├── messageParser.parse(partId, text)
    │       │   │   └── Extract artifacts/actions via streaming parser
    │       │   └── If tool-invocation:
    │       │       ├── workbenchStore.addArtifact()
    │       │       └── workbenchStore.runAction()
    │       └── Return parsed message with cached parts
    └── Update state → triggers re-render
```

### 2.5 Message Parser: XML Tag Extraction

**File**: `/Users/kefentse/dev_env/bolt_research/chef/chef-agent/message-parser.ts`

```
StreamingMessageParser.parse(partId, input)
    ├── Maintains per-part state (position, inside artifact/action)
    ├── Scans for <boltArtifact> tags
    │   ├── onArtifactOpen() callback
    │   └── onArtifactClose() callback
    ├── Scans for <boltAction> tags within artifacts
    │   ├── onActionOpen() callback → workbenchStore.addAction()
    │   ├── onActionStream() callback → workbenchStore.runAction(isStreaming=true)
    │   └── onActionClose() callback → workbenchStore.runAction(isStreaming=false)
    └── Returns output text (artifacts stripped)

Parser Callbacks:
    ├── onArtifactOpen({ id, title, type })
    │   └── workbenchStore.addArtifact(data)
    ├── onArtifactClose()
    │   └── workbenchStore.updateArtifact({ closed: true })
    ├── onActionOpen({ action: FileAction | ToolUseAction })
    │   └── workbenchStore.addAction(data)
    ├── onActionStream()
    │   └── workbenchStore.runAction(data, isStreaming=true)
    └── onActionClose()
        └── workbenchStore.runAction(data, isStreaming=false)
```

### 2.6 Workbench Store: Action Execution

**File**: `/Users/kefentse/dev_env/bolt_research/chef/app/lib/stores/workbench.client.ts`

```
workbenchStore.runAction(data, isStreaming)
    ├── Create ActionRunner for each artifact
    │   └── ActionRunner._executeAction(actionId)
    │       ├── If file action:
    │       │   ├── Validate file path (exclude convex/auth.ts)
    │       │   ├── filesStore.saveFile(filePath, content)
    │       │   │   └── webcontainer.fs.writeFile()
    │       │   └── Track modified files
    │       └── If tool action:
    │           ├── Call tool implementation (deploy, edit, view, etc.)
    │           └── Capture output/result
    │
    ├── Update action status (pending → running → complete)
    └── onToolCallComplete({ kind, result, toolCallId })
        └── Resolve waitOnToolCall() promise
            └── useChat hook sends result back to server
```

### 2.7 File Updates & Editor Sync

**File**: `/Users/kefentse/dev_env/bolt_research/chef/app/lib/stores/files.ts`

```
WebContainer watches all file changes:
    webcontainer.internal.watchPaths({
        include: [WORK_DIR + "/**"],
        exclude: ["**/node_modules", ".git"],
        includeContent: true
    })
    ↓
bufferWatchEvents() (batches changes 100ms)
    ↓
FilesStore._processEventBuffer(events)
    ├── Update filesStore.files (nanostores map)
    │   └── Each file update triggers subscribers
    ├── Track modified files (relative to user message)
    │   └── Store originalContent for diff
    └── Increment fileUpdateCounter (triggers UI refresh)
    ↓
EditorStore.setDocuments(files)
    ├── Convert FileMap to EditorDocuments
    ├── Preserve scroll position for existing docs
    └── Update nanostores documents map
    ↓
Workbench.client.tsx subscribes to:
    ├── files (from workbenchStore.files)
    ├── selectedFile (currently open file)
    ├── currentDocument (merge of above)
    └── unsavedFiles (tracked separately)
    ↓
EditorPanel re-renders with updated content
    └── CodeMirrorEditor shows new code
```

### 2.8 Chat Context Management

**File**: `/Users/kefentse/dev_env/bolt_research/chef/chef-agent/ChatContextManager.ts`

```
ChatContextManager prepares messages for LLM:

1. Message Collapsing:
   ├── Calculate total size of messages
   ├── If exceeds maxCollapsedMessagesSize:
   │   └── Collapse old messages to summary
   └── Keep recent messages at full fidelity

2. Relevant Files:
   ├── Build LRU cache of recently used files
   ├── Sort by:
   │   ├── Files touched in assistant messages
   │   ├── User-written files (unsavedFiles)
   │   └── Currently open document
   └── Include up to maxRelevantFilesSize characters

3. Message Context:
   ├── System prompts (cached on server)
   ├── Collapsed message history
   └── Full recent message history

4. Character Counts:
   ├── messageHistoryChars (previous turns)
   ├── currentTurnChars (user input)
   └── totalPromptChars (including system)
```

### 2.9 Modified Files Tracking

**Flow**:
```
User edits in editor
    ↓
CodeMirrorEditor onChange event
    ↓
workbenchStore.setCurrentDocumentContent(newContent)
    ├── Update editorStore.documents
    ├── Mark as unsaved in unsavedFiles set
    └── Update files via filesStore.updateFile()
    ↓
User sends message
    ↓
Chat.sendMessage()
    ├── Get modified files since last user message
    │   └── workbenchStore.getModifiedFiles()
    ├── Create artifact message part from modifications
    │   └── filesToArtifacts(modifiedFiles)
    ├── Append to user message
    └── Reset modifications tracking
```

---

## 3. Key Files and Their Roles

### Client-Side Components

| File | Purpose | Key Exports |
|------|---------|-------------|
| `app/components/chat/Chat.tsx` | Main chat orchestrator | `Chat` component |
| `app/components/chat/BaseChat.client.tsx` | Chat layout container | `BaseChat` component |
| `app/components/chat/Messages.client.tsx` | Message history display | `Messages` component |
| `app/components/chat/AssistantMessage.tsx` | Individual assistant message | `AssistantMessage` component |
| `app/components/chat/UserMessage.tsx` | Individual user message | `UserMessage` component |
| `app/components/chat/Artifact.tsx` | File modification artifact card | `Artifact` component |
| `app/components/chat/ToolCall.tsx` | Individual tool invocation display | `ToolCall` component |
| `app/components/chat/MessageInput.tsx` | Chat input textbox | `MessageInput` component |
| `app/components/chat/CodeBlock.tsx` | Syntax-highlighted code display | `CodeBlock` component |
| `app/components/workbench/Workbench.client.tsx` | Code editor + preview + terminal | `Workbench` component |
| `app/components/workbench/EditorPanel.tsx` | CodeMirror editor wrapper | `EditorPanel` component |
| `app/components/workbench/Preview.tsx` | iframe for app preview | `Preview` component |

### State Management (Nanostores)

| File | Store Purpose | Key Atoms |
|------|--------------|-----------|
| `app/lib/stores/workbench.client.ts` | Artifact & file state | `artifacts`, `showWorkbench`, `currentView`, `unsavedFiles` |
| `app/lib/stores/artifacts.ts` | Artifact type definitions | `Artifacts` type, `PartId` |
| `app/lib/stores/files.ts` | File system abstraction | `files` (FileMap), `userWrites` |
| `app/lib/stores/editor.ts` | Editor document state | `documents`, `selectedFile`, `currentDocument` |
| `app/lib/stores/chatId.ts` | Current chat ID | `chatIdStore`, `initialIdStore` |
| `app/lib/stores/description.ts` | Chat title/description | `description` atom |
| `app/lib/stores/messageInput.ts` | Chat input text | `messageInputStore` |
| `app/lib/stores/subchats.ts` | Subchat branches | `subchatIndexStore` |

### Server-Side

| File | Purpose | Key Functions |
|------|---------|--------------|
| `app/routes/api.chat.ts` | Chat API endpoint | `action()` → `chatAction()` |
| `app/lib/.server/chat.ts` | Chat request handler | `chatAction()` |
| `app/lib/.server/llm/convex-agent.ts` | LLM streaming orchestration | `convexAgent()`, `onFinishHandler()` |
| `app/lib/.server/llm/provider.ts` | Model provider factory | `getProvider()` |

### Message Parsing (Chef-Agent)

| File | Purpose | Key Exports |
|------|---------|------------|
| `chef-agent/message-parser.ts` | Streams message parsing | `StreamingMessageParser` class |
| `chef-agent/ChatContextManager.ts` | Message context preparation | `ChatContextManager` class |
| `chef-agent/partId.ts` | Part ID generation | `makePartId()`, `parsePartId()` |
| `chef-agent/types.ts` | Artifact & action types | `BoltArtifactData`, `FileAction`, `ToolUseAction` |

### Action Execution

| File | Purpose | Key Classes |
|------|---------|------------|
| `app/lib/runtime/action-runner.ts` | File/tool execution | `ActionRunner` class |
| `app/lib/hooks/useMessageParser.ts` | Message parsing hook | `useMessageParser()` hook |

---

## 4. State Management Architecture

### 4.1 Nanostores Approach

Chef uses **nanostores** (lightweight atom-based state) instead of Redux/Zustand:

```typescript
// Atoms (single values)
const showWorkbench = atom<boolean>(false);
const selectedFile = atom<string | undefined>();

// Maps (records)
const artifacts = map<Record<PartId, ArtifactState>>({});
const files = map<FileMap>({});

// Computed (derived values)
const currentDocument = computed([documents, selectedFile], (docs, file) => {
  return docs[file];
});

// Usage in React
const showWb = useStore(showWorkbench);
const { setKey, set, get } = artifacts;
```

### 4.2 State Hierarchy

```
WorkbenchStore (Singleton)
├── artifacts (map) → ArtifactState[]
│   └── ActionRunner (per artifact)
│       └── actions (map) → ActionState[]
├── filesStore.files (map) → FileMap
├── filesStore.userWrites (map) → { path: timestamp }
├── filesStore.#modifiedFiles (map) → { path: originalContent }
├── editorStore.documents (map) → EditorDocuments
├── editorStore.selectedFile (atom)
├── editorStore.currentDocument (computed)
├── showWorkbench (atom)
├── currentView (atom) → 'code' | 'preview' | 'dashboard' | 'diff'
├── unsavedFiles (set)
└── actionAlert (atom)

ChatStore (Singleton)
├── started (boolean)
├── aborted (boolean)
└── showChat (boolean)

WebContainer Integration
├── Virtual file system (in-browser)
├── Watch events for file changes
└── Terminal emulation (xterm.js)
```

### 4.3 Persistence Across HMR

For HMR (Hot Module Replacement), Chef persists state:

```typescript
// In WorkbenchStore constructor
if (import.meta.hot) {
  import.meta.hot.data.artifacts = this.artifacts;
  import.meta.hot.data.unsavedFiles = this.unsavedFiles;
  import.meta.hot.data.showWorkbench = this.showWorkbench;
  import.meta.hot.data.currentView = this.currentView;
  // ... persist other stores
}
```

---

## 5. Streaming and SSE Implementation

### 5.1 Server-Side Streaming (AI SDK)

**File**: `app/lib/.server/llm/convex-agent.ts`

```typescript
export async function convexAgent(args) {
  const dataStream = createDataStream({
    execute(dataStream) {
      const result = streamText({
        model: provider.model,
        messages: messagesForDataStream,
        tools: {
          deploy: ...,
          npmInstall: ...,
          edit: ...,
          view: ...,
          // ...
        },
        maxTokens: provider.maxTokens,
        toolChoice: 'auto', // or 'none'
        onFinish: (result) => {
          // Record usage, finalize conversation
          onFinishHandler({...});
        },
      });

      // Merge tool results and text into data stream
      result.mergeIntoDataStream(dataStream);
    },
    onError(error) {
      return error.message;
    },
  });

  return dataStream; // Returned as Response with content-type: text/event-stream
}
```

### 5.2 Client-Side Streaming

**File**: `app/components/chat/Chat.tsx`

```typescript
const { messages, status, stop, append, setMessages, reload, error } = useChat({
  initialMessages,
  api: '/api/chat',
  sendExtraMessageFields: true,
  experimental_prepareRequestBody: ({ messages }) => {
    // Prepare context before sending
    return {
      messages: preparedMessages,
      firstUserMessage,
      chatInitialId,
      token,
      // ...
    };
  },
  maxSteps: 64, // Max agentic steps
  async onToolCall({ toolCall }) {
    // Wait for tool execution
    const { result } = await workbenchStore.waitOnToolCall(toolCall.toolCallId);
    return result;
  },
  onFinish: async (message, response) => {
    // Called when streaming completes
    await checkTokenUsage();
  },
});
```

### 5.3 Message Format

**AI SDK Protocol**:
```
event: text
data: "Hello "

event: text
data: "world"

event: tool_call_start
data: {"toolCallId":"...","toolName":"edit","args":{...}}

event: tool_call_delta
data: {"toolCallId":"...","delta":{"type":"input_json_delta","jsonDelta":...}}

event: tool_call_end
data: {"toolCallId":"..."}

event: finish
data: {"finishReason":"stop"}

event: usage
data: {"inputTokens":100,"outputTokens":50}
```

### 5.4 Streaming in Action

```
1. Server starts streaming text tokens
   → useChat hook accumulates messages.parts[].text

2. Server outputs tool-call events
   → useChat hook calls onToolCall callback
   → Client waits for actionRunner to complete
   → actionRunner executes file operations
   → actionRunner resolves tool call promise
   → useChat hook sends result back to server

3. Server loops up to maxSteps times
   → Each iteration: assistant response → tool calls → results → next turn

4. Server outputs finish event
   → onFinish callback fires
   → Update usage/analytics
   → Finalize conversation
```

---

## 6. Data Structures

### 6.1 Message Types (from `ai` SDK)

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  parts?: Part[]; // For structured content
  toolInvocations?: ToolInvocation[];
  annotations?: string[];
  createdAt?: Date;
}

type Part =
  | { type: 'text'; text: string }
  | { type: 'tool-invocation'; toolInvocation: ToolInvocation }
  | { type: 'tool-result'; toolName: string; result: any }
  | { type: 'step-start'; stepType: string }
  | { type: 'step-end'; stepType: string };

interface ToolInvocation {
  state: 'call' | 'partial-call' | 'result';
  toolCallId: string;
  toolName: string;
  args?: Record<string, any>;
  result?: any;
}
```

### 6.2 Artifact Types

```typescript
// From chef-agent/types.ts
interface BoltArtifactData {
  id: string;
  title: string;
  type?: 'bundled' | 'code' | string;
}

type BoltAction = FileAction | ToolUseAction;

interface FileAction {
  type: 'file';
  filePath: RelativePath;
  isEdit?: boolean;
  content: string;
}

interface ToolUseAction {
  type: 'toolUse';
  toolName: string;
  parsedContent: ToolInvocation;
  content: string; // Serialized for deduping
}

// In app/lib/stores/workbench.client.ts
interface ArtifactState {
  id: string;
  title: string;
  type?: string;
  closed: boolean;
  runner: ActionRunner; // Executes actions
}

type ActionStatus = 'pending' | 'running' | 'complete' | 'aborted' | 'failed';

interface ActionState extends BoltAction {
  status: ActionStatus;
  executed: boolean;
  abort: () => void;
  abortSignal: AbortSignal;
  error?: string; // For failed status
}
```

### 6.3 File System Types

```typescript
// From chef-agent/types.ts
interface File {
  type: 'file';
  content: string;
  isBinary: boolean;
}

interface Folder {
  type: 'folder';
}

type Dirent = File | Folder;
type FileMap = Record<AbsolutePath, Dirent | undefined>;

interface EditorDocument {
  value: string;
  isBinary: boolean;
  filePath: AbsolutePath;
  scroll?: ScrollPosition;
}

interface ScrollPosition {
  top: number;
  left: number;
}
```

### 6.4 Tool Parameters

```typescript
// Example: Edit Tool
interface EditToolParameters {
  filePath: string;
  fileText: string;
}

// Example: View Tool
interface ViewParameters {
  path: string; // File or directory path
}

// Example: Deploy Tool
interface DeployParameters {} // Empty object

// Example: npm Install Tool
interface NpmInstallToolParameters {} // Empty object
```

---

## 7. Integration Points

### 7.1 Chat to Workbench Integration

```typescript
// When artifact is clicked
Artifact.tsx (onClick)
  └── workbenchStore.showWorkbench.set(true)
      └── Workbench.client.tsx responds to showWorkbench change
          └── Animation opens workbench panel

// When user edits file
Workbench.client.tsx (EditorPanel onChange)
  └── workbenchStore.setCurrentDocumentContent(newContent)
      └── filesStore.updateFile() → triggers watch event
      └── EditorStore updates documents
      └── Marks file as unsaved

// When user sends message
Chat.tsx (sendMessage)
  ├── getModifiedFiles() → send as context
  ├── resetAllFileModifications() → clear tracker
  └── append(message) → useChat hook sends to server
```

### 7.2 LLM to UI Integration

```typescript
// LLM outputs: <boltArtifact id="..." title="...">
//   <boltAction type="file" filePath="src/main.tsx">
//     const App = () => {...}
//   </boltAction>
// </boltArtifact>

Parser extracts action
  ├── onActionOpen callback
  │   └── workbenchStore.addAction({ action, actionId, partId })
  └── onActionClose callback
      └── workbenchStore.runAction(data, isStreaming=false)

ActionRunner._executeAction
  ├── For FileAction: filesStore.saveFile() → webcontainer.fs.writeFile()
  ├── File change event → watch listener
  ├── FilesStore._processEventBuffer
  │   └── files.setKey() → reactive update
  └── EditorStore.setDocuments() → documents map updates
      └── CodeMirrorEditor re-renders
```

### 7.3 Server to Client Context

```typescript
// Client prepares context
ChatContextManager.prepareContext({
  messages,
  maxCollapsedMessagesSize: 8192,
  minCollapsedMessagesSize: 4096
})
  → { messages, collapsedMessages, promptCharacterCounts }

// Request includes:
{
  messages: [...], // Potentially collapsed
  firstUserMessage: boolean,
  chatInitialId: string,
  token: string (auth),
  teamSlug: string,
  modelProvider: 'Anthropic' | 'OpenAI' | 'Google' | ...,
  userApiKey?: { preference, value, ... },
  shouldDisableTools: boolean,
  promptCharacterCounts?: { messageHistoryChars, currentTurnChars, ... }
}

// Server uses context for:
- Selecting appropriate model
- Setting cache control headers
- Logging/analytics
- Token usage calculation
```

---

## 8. WebContainer Virtual File System

### 8.1 File Synchronization

```
LLM outputs file content
    ↓
ActionRunner executes FileAction
    ├── filesStore.saveFile(absPath, content)
    │   └── webcontainer.fs.writeFile(relativePath, content)
    ├── Update modifiedFiles map
    └── Emit userWrites timestamp
    ↓
WebContainer notifies of file write
    ↓
FilesStore watches with:
  webcontainer.internal.watchPaths({
    include: [WORK_DIR + "/**"],
    exclude: ["node_modules", ".git"],
    includeContent: true
  })
    ↓
bufferWatchEvents() collects changes for 100ms
    ↓
_processEventBuffer(events)
    ├── For each file change:
    │   ├── Read file content
    │   ├── Detect binary vs text
    │   └── files.setKey(absPath, { type: 'file', content, isBinary })
    ├── This triggers:
    │   ├── EditorStore.setDocuments()
    │   ├── CodeMirrorEditor updates
    │   └── FileTree re-renders
```

### 8.2 User Modifications Tracking

```
User edits in CodeMirror
    ↓
EditorPanel onChange event
    ↓
setCurrentDocumentContent(newContent)
    ├── files.setKey() → immediately updates
    ├── Compare with originalContent
    ├── Mark in unsavedFiles set if changed
    └── NO write to webcontainer yet (user hasn't saved)
    ↓
User sends message
    ↓
getModifiedFiles()
    ├── Compare current content with baselineContent
    ├── Prepare artifact message for LLM
    └── Reset baseline (modifiedFiles map)
```

---

## 9. Container & Runtime Integration

### 9.1 Convex Project Management

```typescript
// From convex/schema and app/lib/stores/convexProject.ts
type ConvexProject = {
  token: string;              // Auth token
  deploymentName: string;     // Project name
  deploymentUrl: string;      // Full deployment URL
  projectSlug: string;        // URL-friendly name
  teamSlug: string;           // Team identifier
};

// Used in:
// - Chat server handler: to tag request origins
// - Tool implementations: to know which project to deploy
// - Usage tracking: team-based quotas
```

### 9.2 Tool Implementations

The following tools are available to the LLM:

| Tool | Purpose | Example |
|------|---------|---------|
| `edit` | Create/modify files | `edit({ filePath, fileText })` |
| `view` | Read file/directory contents | `view({ path })` |
| `deploy` | Deploy Convex functions | `deploy({})` |
| `npmInstall` | Install npm dependencies | `npmInstall({})` |
| `lookupDocs` | Search documentation | `lookupDocs({ query })` |
| `addEnvironmentVariables` | Set env vars | `addEnvironmentVariables({})` |
| `getConvexDeploymentName` | Get project name | `getConvexDeploymentName({})` |

---

## 10. Key Architectural Patterns

### 10.1 Reactive State with Nanostores

All UI updates driven by store subscriptions:
```
store.set() / store.setKey() → React component re-render
```

### 10.2 Streaming Message Parsing

Streaming text processed incrementally as it arrives:
```
message.parts[].text += newDelta
  → parseMessages() → messageParser.parse()
  → Emit artifact/action callbacks
  → Update workbench store
```

### 10.3 Tool Call Request-Response

Async tool calls in agentic loop:
```
LLM decides to call tool
  → useChat onToolCall({ toolCall }) triggered
  → ActionRunner executes tool
  → Promise resolves with result
  → LLM receives result
  → Loop continues
```

### 10.4 Context Management

Smart message summarization to stay within token limits:
```
If messages too large:
  → Collapse old messages to summary
  → Keep recent messages at full fidelity
  → Include relevant files by LRU
```

### 10.5 WebContainer Abstraction

Virtual file system treats local files same as web files:
```
LLM doesn't care about storage
  → All files accessed via webcontainer API
  → Same interface for read/write
  → Watch events for real-time sync
```

---

## Summary Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
├─────────────────────────────────────────────────────────────────┤
│  Chat Panel          │          Workbench Panel                 │
│  ┌─────────────────┐ │ ┌──────────────────────────────────────┐│
│  │  Messages       │ │ │  Editor Panel (CodeMirror)           ││
│  │  ┌─────────────┐│ │ │  ┌────────────────────────────────┐ ││
│  │  │Assistant    ││ │ │  │  File Content (live)           │ ││
│  │  │ - Artifact  ││ │ │  │  ┌──────────────────────────┐ │ ││
│  │  │ - ToolCall  ││ │ │  │  │ src/App.tsx             │ ││ ││
│  │  └─────────────┘│ │ │  │  └──────────────────────────┘ │ ││
│  │  ┌─────────────┐│ │ │  └────────────────────────────────┘ ││
│  │  │User Message ││ │ │  Preview Pane                      ││
│  │  │             ││ │ │  Terminal Pane                     ││
│  │  └─────────────┘│ │ │                                    ││
│  └─────────────────┘ │ └──────────────────────────────────────┘│
│  MessageInput        │                                         │
└─────────────────────────────────────────────────────────────────┘
           ↓                          ↑
     [useChat hook]        [workbenchStore subscriptions]
           │                         │
           └─────────┬───────────────┘
                     │
           ┌─────────▼────────┐
           │  Nanostores      │
           ├──────────────────┤
           │ - artifacts      │
           │ - files          │
           │ - editor docs    │
           │ - selectedFile   │
           │ - showWorkbench  │
           └──────────────────┘
                     │
                     ↓
           ┌─────────────────┐
           │  Client State   │
           ├─────────────────┤
           │ - messages      │
           │ - status        │
           │ - error         │
           └─────────────────┘
                     │
      ┌──────────────┼──────────────┐
      │              │              │
      ▼              ▼              ▼
  [MessageParser]  [useChat]    [ActionRunner]
      │              │              │
      └──────────────┼──────────────┘
                     │
         [/api/chat Handler]
                     │
      ┌──────────────┼──────────────┐
      │              │              │
      ▼              ▼              ▼
   [Provider]   [Tools]      [Prompts]
   (Model)    (edit, view,  (System
               deploy, etc)  context)
                     │
                     ▼
              [LLM Streaming]
                     │
         [Tool Invocations]
              │
              ▼
        [WebContainer]
        Virtual FS
```

---

## Critical Code Snippets

### Message Send Flow
**File**: `/Users/kefentse/dev_env/bolt_research/chef/app/components/chat/Chat.tsx`
```typescript
const sendMessage = async (messageInput: string) => {
  // ... validation ...
  
  const shouldSendRelevantFiles = chatContextManager.current.shouldSendRelevantFiles(
    messages,
    maxSizeForModel(modelSelection, maxCollapsedMessagesSize),
  );
  
  const maybeRelevantFilesMessage = shouldSendRelevantFiles
    ? chatContextManager.current.relevantFiles(messages, `${Date.now()}`, maxRelevantFilesSize)
    : { id: `${Date.now()}`, content: '', role: 'user', parts: [] };

  // Add modified files to message
  const modifiedFiles = workbenchStore.getModifiedFiles();
  if (modifiedFiles !== undefined) {
    const userUpdateArtifact = filesToArtifacts(modifiedFiles, `${Date.now()}`);
    maybeRelevantFilesMessage.parts.push({ type: 'text', text: userUpdateArtifact });
    workbenchStore.resetAllFileModifications();
  }

  maybeRelevantFilesMessage.parts.push({ type: 'text', text: messageInput });
  append(maybeRelevantFilesMessage);
};
```

### Message Parsing Loop
**File**: `/Users/kefentse/dev_env/bolt_research/chef/app/lib/hooks/useMessageParser.ts`
```typescript
export function processMessage(
  message: Message,
  previousParts: PartCache,
): { message: Message; hitRate: [number, number] } {
  const parsedParts = [];
  let hits = 0;
  
  for (let i = 0; i < message.parts.length; i++) {
    const part = message.parts[i];
    const partId = makePartId(message.id, i);
    const cacheEntry = previousParts.get(partId);
    
    if (cacheEntry && isPartMaybeEqual(cacheEntry.original, part)) {
      parsedParts.push(cacheEntry.parsed);
      hits++;
      continue;
    }
    
    let newPart;
    switch (part.type) {
      case 'text': {
        let prevContent = cacheEntry?.parsed?.text || '';
        const delta = messageParser.parse(partId, part.text);
        newPart = {
          type: 'text' as const,
          text: prevContent + delta,
        };
        break;
      }
      case 'tool-invocation': {
        // Handle tool invocation
        workbenchStore.addArtifact({ id: partId, partId, title: 'Editing files...' });
        workbenchStore.runAction(data, true);
        // ...
      }
    }
    
    parsedParts.push(newPart);
    previousParts.set(partId, { original: part, parsed: newPart });
  }
  
  return { message: { ...message, parts: parsedParts }, hitRate: [hits, message.parts.length] };
}
```

### Artifact & Action Execution
**File**: `/Users/kefentse/dev_env/bolt_research/chef/app/lib/stores/workbench.client.ts`
```typescript
addArtifact({ partId, title, id, type }: ArtifactCallbackData) {
  const artifact = this.#getArtifact(partId);
  if (artifact) return;

  if (!this.partIdList.includes(partId)) {
    this.partIdList.push(partId);
  }

  this.artifacts.setKey(partId, {
    id,
    title,
    closed: false,
    type,
    runner: new ActionRunner(webcontainer, this.boltTerminal, {
      onAlert: (alert) => {
        this.actionAlert.set(alert);
      },
      onToolCallComplete: ({ kind, result, toolCallId, toolName }) => {
        const toolCallPromise = this.#toolCalls.get(toolCallId);
        if (!toolCallPromise) return;
        
        toolCallPromise.resolve({
          result: kind === 'success' ? result : `Error: ${result}`,
        });
      },
    }),
  });
}
```

---

## Conclusion

Chef's architecture elegantly separates concerns while maintaining tight integration:

1. **Presentation**: React components subscribe to nanostores for reactive updates
2. **State**: Nanostores provide lightweight, observable state management
3. **Parsing**: Streaming message parser extracts artifacts in real-time
4. **Execution**: ActionRunner manages async tool calls and file operations
5. **Persistence**: WebContainer provides virtual file system with real-time sync
6. **Context**: ChatContextManager intelligently manages token usage
7. **Streaming**: AI SDK handles message streaming and tool orchestration

This design enables smooth, real-time code generation with immediate UI feedback.

