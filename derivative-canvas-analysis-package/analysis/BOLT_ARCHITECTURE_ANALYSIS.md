# Bolt.DIY Chat Flow Architecture - Complete Analysis

## Executive Summary

Bolt.DIY implements a sophisticated streaming chat architecture that seamlessly connects user input to code file updates via a message parser and action runner system. The flow uses Server-Sent Events (SSE) through the AI SDK's `createDataStream` to stream LLM responses, which are parsed client-side to extract artifacts (projects), actions (file writes, shell commands), and visual updates.

---

## 1. Component Hierarchy: Chat → Messages → Code Blocks

### 1.1 Main Component Stack

```
BaseChat (UI Container)
  ├── Messages (Message List)
  │   ├── UserMessage (renders user input)
  │   └── AssistantMessage (renders LLM response)
  │       └── Markdown (content renderer)
  │           └── Artifact (code/project containers)
  │               ├── ActionList (file/shell actions)
  │               │   └── ActionItem (individual action)
  │               └── Preview (live preview pane)
  │
  ├── ChatBox (Input Area)
  │   ├── TextArea (user input)
  │   ├── ModelSelector (LLM provider/model)
  │   └── SendButton (message submission)
  │
  └── Workbench (Code Editor)
      ├── EditorPanel (CodeMirror editor)
      ├── DiffView (file changes)
      └── Preview (browser preview)
```

### 1.2 Key Files by Role

| File | Purpose |
|------|---------|
| `Chat.client.tsx` | Main chat orchestrator, uses useChat hook from @ai-sdk/react |
| `BaseChat.tsx` | UI layout, combines all components |
| `Messages.client.tsx` | Message list rendering, routes user/assistant messages |
| `AssistantMessage.tsx` | Parses annotations, renders parsed content |
| `Artifact.tsx` | Displays artifact container, shows action progress |
| `Workbench.client.tsx` | Code editor panel with file tree, editor, diff, preview |

---

## 2. Complete Data Flow: User Input → LLM → File Updates → UI Updates

### 2.1 Phase 1: User Message Submission

**Flow Path:** `BaseChat` → `Chat.client.tsx` → `/api/chat` endpoint

```javascript
// Chat.client.tsx - sendMessage function (lines 389-557)
const sendMessage = async (_event: React.UIEvent, messageInput?: string) => {
  // 1. Get message content and validate
  const messageContent = messageInput || input;
  
  // 2. Check for selected UI element context
  if (selectedElement) {
    const elementInfo = `<div class="__boltSelectedElement__"...>`;
    finalMessageContent = messageContent + elementInfo;
  }
  
  // 3. Include model and provider metadata
  const userMessageText = `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${finalMessageContent}`;
  
  // 4. Include modified file artifacts (from previous edits)
  const modifiedFiles = workbenchStore.getModifiedFiles();
  if (modifiedFiles) {
    const userUpdateArtifact = filesToArtifacts(modifiedFiles, `${Date.now()}`);
    messageText = `${userUpdateArtifact}${finalMessageContent}`;
  }
  
  // 5. Add file attachments (images)
  const attachments = await filesToAttachments(uploadedFiles);
  
  // 6. Send to AI SDK's useChat hook
  append({
    role: 'user',
    content: messageText,
    parts: createMessageParts(messageText, imageDataList),
  }, attachmentOptions);
};
```

**Key Data Structures:**
- Message includes: model, provider, file modifications, UI context, attachments
- Modified files tracked via `workbenchStore.getModifiedFiles()`
- File attachments converted from base64 to File parts

### 2.2 Phase 2: API Route Processing (Backend Streaming)

**File:** `/app/routes/api.chat.ts` (lines 18-463)

**Key Functions:**

1. **Request Parsing** (lines 42-74)
   ```typescript
   const { messages, files, promptId, contextOptimization, chatMode, designScheme } = 
     await request.json();
   const apiKeys = JSON.parse(parseCookies(cookieHeader).apiKeys);
   const providerSettings = JSON.parse(parseCookies(cookieHeader).providers);
   ```

2. **Context Optimization** (lines 104-208)
   - Creates summary of chat history via `createSummary()`
   - Selects relevant files via `selectContext()`
   - Injects context into system prompt for build mode
   - Streams progress updates to client

3. **LLM Streaming** (lines 302-347)
   ```typescript
   const dataStream = createDataStream({
     async execute(dataStream) {
       // Process MCP tool invocations
       const processedMessages = await mcpService.processToolInvocations(
         messages, dataStream
       );
       
       // Stream text from LLM
       const result = await streamText({
         messages: processedMessages,
         options: { toolChoice: 'auto', maxSteps: maxLLMSteps },
         onStepFinish: ({ toolCalls }) => {
           // Add tool call annotations
           toolCalls.forEach((toolCall) => {
             mcpService.processToolCall(toolCall, dataStream);
           });
         },
         onFinish: ({ text, usage }) => {
           // Write final usage data
           dataStream.writeMessageAnnotation({ type: 'usage', value: usage });
         },
       });
       
       result.mergeIntoDataStream(dataStream);
     },
   });
   ```

4. **Artifact Tag Format in LLM Response**
   ```xml
   <boltArtifact id="..." title="Project Name" type="bundled">
     <boltAction type="file" filePath="package.json">
       { "name": "project", ... }
     </boltAction>
     <boltAction type="file" filePath="src/index.js">
       console.log("hello");
     </boltAction>
     <boltAction type="shell">
       npm install && npm run build
     </boltAction>
   </boltArtifact>
   ```

### 2.3 Phase 3: Client-Side Message Parsing

**File:** `/app/lib/runtime/message-parser.ts` + Enhanced version

**Parsing Flow:**

```javascript
// useMessageParser hook (lib/hooks/useMessageParser.ts)
const messageParser = new EnhancedStreamingMessageParser({
  callbacks: {
    onArtifactOpen: (data) => {
      workbenchStore.showWorkbench.set(true);
      workbenchStore.addArtifact(data);  // Create artifact in store
    },
    onActionOpen: (data) => {
      if (data.action.type === 'file') {
        workbenchStore.addAction(data);  // Add file action to queue
      }
    },
    onActionClose: (data) => {
      if (data.action.type !== 'file') {
        workbenchStore.addAction(data);  // Add shell/build actions
      }
      workbenchStore.runAction(data);    // Execute action
    },
    onActionStream: (data) => {
      workbenchStore.runAction(data, true);  // Stream file updates
    },
  },
});

// Parse messages as they stream in
parseMessages(messages, isLoading) {
  for (const [index, message] of messages.entries()) {
    const newParsedContent = messageParser.parse(
      message.id, 
      extractTextContent(message)
    );
    setParsedMessages(prev => ({
      ...prev,
      [index]: !reset ? (prev[index] || '') + newParsedContent : newParsedContent,
    }));
  }
}
```

**Parser State Machine** (lines 76-387 in message-parser.ts):
```
Input Stream
  ↓
[Check for <boltArtifact> tags]
  ├─ YES → Parse artifact metadata
  │   ├─ Extract: id, title, type
  │   ├─ Emit: onArtifactOpen callback
  │   ├─ Look for <boltAction> inside
  │   │   ├─ type: file → Parse filePath, content
  │   │   ├─ type: shell → Parse command
  │   │   ├─ type: start → Parse dev server command
  │   │   └─ type: build → Parse build command
  │   ├─ Emit: onActionOpen, onActionClose callbacks
  │   └─ Stream file content chunks via onActionStream
  │
  └─ NO → Check for enhanced code block patterns
      ├─ Pattern 1: "filepath.ext:\n```\ncode\n```"
      ├─ Pattern 2: "create file 'name.ext':\n```\ncode\n```"
      └─ Pattern 3: Structured JSON/HTML blocks
          → Wrap in artifact tags and reparse
```

### 2.4 Phase 4: Artifact & Action Execution

**File:** `/app/lib/stores/workbench.ts` + `/app/lib/runtime/action-runner.ts`

#### 4.1 Artifact Creation
```typescript
// workbench.ts - addArtifact (lines 468-510)
addArtifact({ messageId, title, id, type }: ArtifactCallbackData) {
  this.artifacts.setKey(id, {
    id, title, closed: false, type,
    runner: new ActionRunner(
      webcontainer,           // WebContainer runtime
      () => this.boltTerminal, // Shell terminal
      (alert) => this.actionAlert.set(alert),  // Error handling
    ),
  });
}
```

#### 4.2 Action Execution Pipeline
```typescript
// workbench.ts - runAction (lines 542-603)
async _runAction(data: ActionCallbackData, isStreaming: boolean) {
  const { artifactId } = data;
  const artifact = this.#getArtifact(artifactId);
  
  if (data.action.type === 'file') {
    const fullPath = path.join(wc.workdir, data.action.filePath);
    
    // 1. Switch to code view and select file
    if (this.selectedFile.value !== fullPath) {
      this.setSelectedFile(fullPath);
    }
    if (this.currentView.value !== 'code') {
      this.currentView.set('code');
    }
    
    // 2. Update editor store with file content
    this.#editorStore.updateFile(fullPath, data.action.content);
    
    // 3. For streaming updates: show live as typing
    if (!isStreaming && data.action.content) {
      await this.saveFile(fullPath);  // Save to WebContainer
    }
    
    // 4. Finally execute action in webcontainer
    if (!isStreaming) {
      await artifact.runner.runAction(data);
    }
  } else {
    // For shell/start/build: execute directly
    await artifact.runner.runAction(data);
  }
}
```

#### 4.3 ActionRunner - File Execution
```typescript
// action-runner.ts - runFileAction (lines 311-339)
async #runFileAction(action: ActionState) {
  const webcontainer = await this.#webcontainer;
  const relativePath = nodePath.relative(
    webcontainer.workdir, 
    action.filePath
  );
  
  let folder = nodePath.dirname(relativePath);
  if (folder !== '.') {
    await webcontainer.fs.mkdir(folder, { recursive: true });
  }
  
  try {
    await webcontainer.fs.writeFile(relativePath, action.content);
    logger.debug(`File written ${relativePath}`);
  } catch (error) {
    logger.error('Failed to write file', error);
  }
}
```

**Action Queue:** Execution is serialized via execution promise chain
```typescript
#globalExecutionQueue = Promise.resolve();

addToExecutionQueue(callback: () => Promise<void>) {
  this.#globalExecutionQueue = this.#globalExecutionQueue
    .then(() => callback())
    .catch((error) => {
      logger.error('Action execution failed:', error);
    });
}
```

### 2.5 Phase 5: Files Store Synchronization

**File:** `/app/lib/stores/files.ts`

**File System Abstraction:**
```typescript
export interface File {
  type: 'file';
  content: string;        // File content
  isBinary: boolean;      // Binary detection
  isLocked?: boolean;     // Lock status
  lockedByFolder?: string;
}

export type FileMap = Record<string, Dirent | undefined>;

class FilesStore {
  #webcontainer: Promise<WebContainer>;
  #modifiedFiles: Map<string, string> = new Map();  // Track original content
  files: MapStore<FileMap> = map({});              // Nanostores atom
  
  async saveFile(filePath: string, content: string) {
    await this.#webcontainer.fs.writeFile(relativePath, content);
    // Update in-memory store
    this.files.setKey(filePath, { type: 'file', content, isBinary: false });
  }
}
```

**File Modification Tracking:**
- Original content saved when first edited
- Can be reset via `resetAllFileModifications()`
- Sent to next LLM request as modified file artifacts
- Uses diff library to compute changes

### 2.6 Phase 6: UI Updates & Display

**Files:** `AssistantMessage.tsx`, `Artifact.tsx`, `Workbench.client.tsx`

#### 6.1 Message Rendering
```typescript
// Messages.client.tsx
<Messages
  messages={messages.map((message, i) => {
    if (message.role === 'user') return message;
    return {
      ...message,
      content: parsedMessages[i] || ''  // Use parsed content
    };
  })}
/>
```

#### 6.2 Artifact Display
```typescript
// Artifact.tsx - renders artifact container
<div className="artifact border flex flex-col">
  <button onClick={() => workbenchStore.showWorkbench.set(!shown)}>
    {dynamicTitle}  {/* "Creating Project..." → "Project Created" */}
    Click to open Workbench
  </button>
  <ActionList actions={actions} />  {/* File/shell action list */}
</div>
```

#### 6.3 Live Action Progress
```typescript
// Artifact.tsx - updates as actions complete
const actions = useStore(
  computed(artifact.runner.actions, (actions) => {
    return Object.values(actions).filter(a => a.type !== 'supabase');
  })
);

// UI shows action status: pending → running → complete
<div className={getIconColor(action.status)}>
  {action.status === 'complete' ? <CheckIcon /> : <LoadingIcon />}
</div>
```

---

## 3. Key Files and Their Roles

### Client-Side Architecture

| File | Lines | Role |
|------|-------|------|
| `Chat.client.tsx` | 1-671 | Main chat hook integration, message sending |
| `BaseChat.tsx` | 1-523 | UI layout, combines chat, workbench, alerts |
| `Messages.client.tsx` | 1-103 | Message list rendering, fork/rewind |
| `AssistantMessage.tsx` | 1-300+ | Content rendering, annotations extraction |
| `Artifact.tsx` | 1-300+ | Artifact container, action progress display |
| `Workbench.client.tsx` | 1-400+ | Editor panel, file tree, diff, preview |
| `EditorPanel.tsx` | - | CodeMirror integration |
| `FileTree.tsx` | - | File navigation |
| `Preview.tsx` | - | Live preview pane |

### State Management

| Store | Lines | Role |
|-------|-------|------|
| `chat.ts` | - | Chat started state, aborted flag |
| `workbench.ts` | 1-950+ | Artifacts, files, editor, unsaved changes |
| `files.ts` | 1-951 | File map, WebContainer FS abstraction |
| `editor.ts` | - | Editor documents, selected file, scroll |
| `streaming.ts` | - | Global streaming state |

### Parsing & Runtime

| File | Lines | Role |
|------|-------|------|
| `message-parser.ts` | 1-417 | Core parser state machine |
| `enhanced-message-parser.ts` | 1-527 | Detects code blocks without tags |
| `action-runner.ts` | 1-600+ | Executes file writes, shell commands |

### Server-Side

| File | Lines | Role |
|------|-------|------|
| `/api.chat.ts` | 1-463 | Main chat endpoint, streaming |
| `stream-text.ts` | 1-311 | LLM provider integration |
| `select-context.ts` | - | Context optimization |
| `create-summary.ts` | - | Chat summarization |

---

## 4. State Management Architecture

### State Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  Nanostores (Client State)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  chat.ts                                                      │
│  ├─ showChat: boolean                                         │
│  └─ started: boolean                                          │
│                                                               │
│  workbench.ts (WorkbenchStore)                               │
│  ├─ artifacts: MapStore<ArtifactState>                      │
│  │  ├─ id, title, type, closed                              │
│  │  └─ runner: ActionRunner (manages actions)               │
│  ├─ files: MapStore<FileMap>                                │
│  │  └─ Record<filePath, File | Folder | undefined>         │
│  ├─ currentDocument: EditorDocument                         │
│  ├─ selectedFile: string | undefined                        │
│  ├─ unsavedFiles: Set<string>                               │
│  ├─ currentView: 'code' | 'diff' | 'preview'               │
│  ├─ actionAlert: ActionAlert | undefined                   │
│  ├─ supabaseAlert: SupabaseAlert | undefined               │
│  └─ deployAlert: DeployAlert | undefined                   │
│                                                               │
│  streaming.ts                                                │
│  └─ isStreaming: boolean                                     │
│                                                               │
│  ActionRunner.actions (in artifact.runner)                  │
│  └─ MapStore<Record<string, ActionState>>                  │
│     ├─ type: 'file' | 'shell' | 'start' | 'build'         │
│     ├─ status: 'pending' | 'running' | 'complete'         │
│     ├─ content: string                                       │
│     └─ filePath: string (for file actions)                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│                    WebContainer FS                            │
├─────────────────────────────────────────────────────────────┤
│ Virtual Linux filesystem with npm, node, git pre-installed  │
│ Used for: file writes, shell execution, dev server         │
└─────────────────────────────────────────────────────────────┘
```

### Message & File Sync Lifecycle

```
User sends message
  ↓ (includes model, provider, modified files)
Chat.sendMessage()
  ↓
useChat hook (AI SDK)
  ↓
POST /api/chat
  ↓
Server streams response with boltArtifact tags
  ↓
Client receives stream chunks
  ↓
EnhancedStreamingMessageParser.parse()
  ├─ Extracts artifact metadata → onArtifactOpen
  ├─ Extracts file actions → onActionOpen → workbenchStore.addAction()
  └─ Streams file content → onActionStream → workbenchStore.runAction(isStreaming)
  ↓
ActionRunner #runFileAction()
  ├─ Write to WebContainer FS
  └─ Update files MapStore
  ↓
Editor displays file with syntax highlighting
User can edit, editor updates unsavedFiles Set
  ↓
Next message includes modified files in artifacts
```

---

## 5. Streaming Implementation Details

### SSE (Server-Sent Events) via AI SDK

**Backend Streaming:**
```typescript
const dataStream = createDataStream({
  async execute(dataStream) {
    // Write progress annotations
    dataStream.writeData({
      type: 'progress',
      label: 'summary',
      status: 'in-progress',
      message: 'Analysing Request',
    });
    
    // Write message annotations (usage, context, etc)
    dataStream.writeMessageAnnotation({
      type: 'chatSummary',
      summary: summaryText,
    });
    
    // Merge LLM response stream
    const result = await streamText({ /* ... */ });
    result.mergeIntoDataStream(dataStream);
  },
  onError: (error) => { /* ... */ },
});
```

**Frontend Streaming:**
```typescript
// Via useChat hook from @ai-sdk/react
const { messages, isLoading, data: chatData } = useChat({
  api: '/api/chat',
  body: { /* request data */ },
  onError: (e) => handleError(e),
  onFinish: (message, response) => {
    console.log('Token usage:', response.usage);
  },
});

// ChatData contains server-sent annotations
useEffect(() => {
  if (chatData) {
    const progressList = chatData.filter(
      (x) => typeof x === 'object' && x.type === 'progress'
    );
    setProgressAnnotations(progressList);
  }
}, [chatData]);
```

### File Streaming (Incremental Updates)

During file action streaming:
1. `onActionStream` callback fires on each content chunk
2. `workbenchStore.runAction(data, true)` with `isStreaming=true`
3. Editor updates via `#editorStore.updateFile(fullPath, data.action.content)`
4. UI shows live file content as it arrives
5. On `onActionClose`, final save to WebContainer via `artifact.runner.runAction()`

```typescript
// Live streaming update
if (isStreaming && action.type === 'file') {
  let content = input.slice(i);  // Partial content chunk
  if (!currentAction.filePath.endsWith('.md')) {
    content = cleanoutMarkdownSyntax(content);
  }
  
  this._options.callbacks?.onActionStream?.({
    artifactId: currentArtifact.id,
    messageId,
    actionId: String(state.actionId - 1),
    action: {
      ...(currentAction as FileAction),
      content,  // Partial chunk
      filePath: currentAction.filePath,
    },
  });
}
```

---

## 6. Code Data Structures

### Message Format (AI SDK)

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string | Array<{
    type: 'text' | 'file';
    text?: string;
    mimeType?: string;
    data?: string;
  }>;
  annotations?: JSONValue[];  // Custom metadata
  parts?: Array<
    | TextUIPart
    | FileUIPart
    | ToolInvocationUIPart
    | ReasoningUIPart
  >;
}
```

### Artifact Metadata

```typescript
interface ArtifactCallbackData extends BoltArtifactData {
  messageId: string;
  artifactId?: string;
}

interface BoltArtifactData {
  id: string;
  title: string;
  type?: string;  // 'bundled' | etc
}

interface ArtifactState {
  id: string;
  title: string;
  type?: string;
  closed: boolean;
  runner: ActionRunner;  // Manages actions for this artifact
}
```

### Action Format

```typescript
interface ActionCallbackData {
  artifactId: string;
  messageId: string;
  actionId: string;
  action: BoltAction;
}

type BoltAction = FileAction | ShellAction | StartAction | BuildAction | SupabaseAction;

interface FileAction {
  type: 'file';
  filePath: string;
  content: string;
}

interface ShellAction {
  type: 'shell';
  content: string;  // Shell command
}

interface ActionState extends BoltAction {
  status: 'pending' | 'running' | 'complete' | 'aborted' | 'failed';
  executed: boolean;
  abort: () => void;
  abortSignal: AbortSignal;
}
```

### File Structure

```typescript
interface File {
  type: 'file';
  content: string;
  isBinary: boolean;
  isLocked?: boolean;
  lockedByFolder?: string;
}

interface Folder {
  type: 'folder';
  isLocked?: boolean;
  lockedByFolder?: string;
}

type FileMap = Record<string, (File | Folder | undefined)>;
```

---

## 7. Key Integration Points

### 7.1 Message Parser → Workbench Store

```typescript
// When artifact tags are detected
onArtifactOpen: (data) => {
  workbenchStore.showWorkbench.set(true);      // Show workbench
  workbenchStore.addArtifact(data);            // Create artifact
}

// When file action starts streaming
onActionOpen: (data) => {
  if (data.action.type === 'file') {
    workbenchStore.addAction(data);            // Add to queue
  }
}

// As file content arrives (streaming)
onActionStream: (data) => {
  workbenchStore.runAction(data, true);        // Update editor live
}

// When action completes
onActionClose: (data) => {
  workbenchStore.addAction(data);              // Queue final version
  workbenchStore.runAction(data);              // Write to WebContainer
}
```

### 7.2 Workbench Store → File Store

```typescript
// File saving pipeline
async _runAction(data, isStreaming) {
  if (data.action.type === 'file') {
    // 1. Update editor
    this.#editorStore.updateFile(fullPath, content);
    
    // 2. Save if final
    if (!isStreaming) {
      await this.saveFile(fullPath);
    }
    
    // 3. Execute in WebContainer
    await artifact.runner.runAction(data);
  }
}

// File store writes to WebContainer
async saveFile(filePath: string, content: string) {
  await this.#webcontainer.fs.writeFile(relativePath, content);
  this.files.setKey(filePath, { type: 'file', content, isBinary: false });
}
```

### 7.3 Workbench Store → Chat (Modified Files)

```typescript
// Send modified files with next message
getModifiedFiles() {
  return this.#filesStore.getModifiedFiles();
}

// In Chat.sendMessage()
const modifiedFiles = workbenchStore.getModifiedFiles();
if (modifiedFiles) {
  const userUpdateArtifact = filesToArtifacts(modifiedFiles, `${Date.now()}`);
  messageText = `${userUpdateArtifact}${finalMessageContent}`;
}
```

---

## 8. Error Handling & Alerts

### Alert Types

```typescript
type ActionAlert = {
  type: 'error' | 'info' | 'warning' | 'success';
  title: string;
  description?: string;
  content?: string;  // Detailed output
};

type SupabaseAlert = {
  type: 'error' | 'success';
  title: string;
  description: string;
};

type DeployAlert = {
  type: 'info' | 'success' | 'error';
  title: string;
  description: string;
  stage: 'building' | 'deploying';
  buildStatus: 'running' | 'complete' | 'failed';
  deployStatus: 'running' | 'complete' | 'failed';
};
```

### Error Flow

```typescript
// Shell command failure
if (resp?.exitCode != 0) {
  const enhancedError = this.#createEnhancedShellError(
    action.content, 
    resp?.exitCode, 
    resp?.output
  );
  throw new ActionCommandError(enhancedError.title, enhancedError.details);
}

// Caught in action runner
catch (error) {
  this.#updateAction(actionId, { status: 'failed', error: 'Action failed' });
  this.onAlert?.({
    type: 'error',
    title: 'Dev Server Failed',
    description: error.header,
    content: error.output,
  });
}

// Displayed in UI
{llmErrorAlert && <LlmErrorAlert alert={llmErrorAlert} />}
{actionAlert && <ChatAlert alert={actionAlert} />}
```

---

## 9. Context Optimization

### Chat Summary & File Selection

**Flow:**
1. When `contextOptimization` enabled
2. Create summary via LLM of all messages so far
3. Use summary to select most relevant files
4. Include selected files in system prompt

**Implementation:**
```typescript
// Inject context files into system prompt
if (chatMode === 'build' && contextFiles && contextOptimization) {
  const codeContext = createFilesContext(contextFiles, true);
  systemPrompt = `${systemPrompt}
  
  CONTEXT BUFFER:
  ---
  ${codeContext}
  ---
  `;
  
  if (summary) {
    systemPrompt = `${systemPrompt}
    CHAT SUMMARY:
    ---
    ${summary}
    ---
    `;
    // Slice messages to last N for context window
    processedMessages = processedMessages.slice(props.messageSliceId);
  }
}
```

---

## 10. WebContainer Runtime

### Purpose
- Virtual Linux environment in browser
- Runs npm, node, git, shell commands
- Isolated from browser, can't access system

### Key Operations

```typescript
// Write file
await webcontainer.fs.writeFile(relativePath, content);

// Read file
const content = await webcontainer.fs.readFile(path, 'utf-8');

// Create directory
await webcontainer.fs.mkdir(folder, { recursive: true });

// Execute command
const process = await webcontainer.spawn('npm', ['install']);
const exitCode = await process.exit;
process.output.pipeTo(new WritableStream({ write(data) { /* ... */ } }));
```

---

## 11. Performance Optimizations

### Sampler for High-Frequency Updates

```typescript
// Batch message parsing updates (debounced)
const processSampledMessages = createSampler(
  (options) => {
    parseMessages(options.messages, options.isLoading);
    if (options.messages.length > options.initialMessages.length) {
      storeMessageHistory(options.messages);
    }
  },
  50  // 50ms sample window
);
```

### Action Execution Queue

```typescript
#globalExecutionQueue = Promise.resolve();

addToExecutionQueue(callback: () => Promise<void>) {
  this.#globalExecutionQueue = this.#globalExecutionQueue.then(() => callback());
}
```

Ensures file actions execute serially, preventing race conditions.

### Lock File Mechanism

Prevents users from editing files being modified by LLM:
```typescript
lockFile(filePath: string) {
  return this.#filesStore.lockFile(filePath);
}

// Check before edit
if (file.isLocked) {
  toast.error('File is locked - being modified by assistant');
}
```

---

## 12. Summary of Key Flows

### Chat Message Flow
```
User Input → Model Selection → sendMessage() 
  → useChat (AI SDK) → /api/chat (POST)
  → Server: Context Optimization + LLM Stream
  → Server: Sends artifacts with boltAction tags
  → Client: EnhancedStreamingMessageParser
  → State callbacks: addArtifact(), addAction(), runAction()
  → ActionRunner: Write to WebContainer FS
  → Files Store: Update file map
  → Editor: Display file with syntax highlighting
  → Display: Show artifact container with action progress
```

### File Edit Flow
```
User edits file in CodeMirror
  → EditorStore: updateFile()
  → Files Store: Mark as modified (unsavedFiles Set)
  → Editor: Show unsaved indicator
  → User clicks Save
  → WorkbenchStore: saveFile()
  → WebContainer: fs.writeFile()
  → Next message includes modified files
```

### Streaming Update Flow
```
Server sends file action chunks
  → Parser: onActionStream callback
  → WorkbenchStore: runAction(data, isStreaming=true)
  → EditorStore: updateFile() with partial content
  → UI: Live updates as chunks arrive
  → Server sends actionClose tag
  → Parser: onActionClose callback
  → ActionRunner: Final write to WebContainer
```

---

## Conclusion

Bolt.DIY's architecture elegantly connects chat to code execution through:

1. **Streaming Parser** - Extracts structured artifact & action data from LLM responses
2. **Nanostores** - Reactive state management for artifacts, files, editor
3. **Action Runner** - Executes file writes and shell commands via WebContainer API
4. **Files Store** - Virtual file system abstraction over WebContainer
5. **Editor Integration** - Live updates as files are created/modified
6. **State Synchronization** - Modified files sent back to LLM for context

The system is designed for:
- **Responsiveness**: Streaming updates show progress in real-time
- **Safety**: Lock mechanism prevents conflicts
- **Context Awareness**: File modifications tracked and sent back to LLM
- **Isolation**: WebContainer provides sandboxed execution
- **Scalability**: Serialized execution queue prevents race conditions
