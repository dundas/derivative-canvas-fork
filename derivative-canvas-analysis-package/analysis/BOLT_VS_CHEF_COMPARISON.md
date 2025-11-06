# Bolt.DIY vs Chef: Chat-to-Code Architecture Comparison

## Executive Summary

Both **Bolt.DIY** and **Chef** implement sophisticated streaming architectures that transform LLM responses into executable code updates. While they share similar core patterns, they differ in implementation details, state management, and context handling.

### Quick Comparison

| Aspect | Bolt.DIY | Chef |
|--------|----------|------|
| **Framework** | Remix (React Router v7) | Remix + Convex |
| **State Management** | Nanostores | Nanostores + Convex |
| **Streaming** | AI SDK `createDataStream` | AI SDK `createDataStream` |
| **Parsing** | `StreamingMessageParser` | `StreamingMessageParser` (similar) |
| **File System** | WebContainer | WebContainer |
| **Context Management** | Manual file tracking | `ChatContextManager` |
| **LLM Integration** | Multiple providers (OpenAI, Anthropic, etc.) | Convex Agent + multiple providers |
| **Backend** | Cloudflare Workers | Convex backend |
| **Persistence** | Browser storage | Convex database |

---

## 1. Architecture Overview

### 1.1 Bolt.DIY Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BOLT.DIY ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│   User UI    │────────▶│   Chat.tsx   │────────▶│  /api/chat   │
│  (BaseChat)  │         │  (useChat)   │         │   (Remix)    │
│              │         │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
                                │                         │
                                │                         ▼
                                │                  ┌──────────────┐
                                │                  │              │
                                │                  │  LLM Stream  │
                                │                  │  (OpenAI,    │
                                │                  │  Anthropic)  │
                                │                  │              │
                                │                  └──────────────┘
                                │                         │
                                ▼                         │
                    ┌─────────────────────┐              │
                    │ StreamingMessage    │◀─────────────┘
                    │ Parser              │
                    │ (parses XML tags)   │
                    └─────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │  Artifact   │ │   Action    │ │   Text      │
        │  Callbacks  │ │  Callbacks  │ │  Chunks     │
        └─────────────┘ └─────────────┘ └─────────────┘
                │               │               │
                └───────┬───────┴───────────────┘
                        ▼
                ┌─────────────────────┐
                │  WorkbenchStore     │
                │  (Nanostores)       │
                │  - artifacts        │
                │  - actions          │
                │  - files            │
                └─────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Artifact.   │ │ ActionRunner │ │  Editor      │
│  tsx         │ │ (executes    │ │  Panel       │
│  (displays)  │ │  actions)    │ │  (CodeMirror)│
└──────────────┘ └──────────────┘ └──────────────┘
                        │
                        ▼
                ┌──────────────────┐
                │  WebContainer    │
                │  (File System)   │
                └──────────────────┘
```

### 1.2 Chef Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CHEF ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│   User UI    │────────▶│   Chat.tsx   │────────▶│  /api/chat   │
│  (BaseChat)  │         │  (useChat)   │         │   (Remix)    │
│              │         │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
                                │                         │
                                │                         ▼
                                │                  ┌──────────────┐
                                │                  │  Convex      │
                                │                  │  Agent       │
                                │                  │  (LLM        │
                                │                  │  Wrapper)    │
                                │                  └──────────────┘
                                │                         │
                                │                         ▼
                                │                  ┌──────────────┐
                                │                  │  LLM Stream  │
                                │                  │  + Tools     │
                                │                  └──────────────┘
                                │                         │
                                ▼                         │
                    ┌─────────────────────┐              │
                    │ ChatContext         │              │
                    │ Manager             │              │
                    │ (prepareRequest)    │──────────────┘
                    └─────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │ StreamingMessage    │
                    │ Parser              │
                    │ (parses XML tags)   │
                    └─────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │  Artifact   │ │   Action    │ │   Text      │
        │  Callbacks  │ │  Callbacks  │ │  Chunks     │
        └─────────────┘ └─────────────┘ └─────────────┘
                │               │               │
                └───────┬───────┴───────────────┘
                        ▼
                ┌─────────────────────┐
                │  WorkbenchStore     │
                │  (Nanostores)       │
                │  - artifacts        │
                │  - actions          │
                │  - files            │
                └─────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Artifact.   │ │ ActionRunner │ │  Editor      │
│  tsx         │ │ (executes    │ │  Panel       │
│  (displays)  │ │  actions)    │ │  (CodeMirror)│
└──────────────┘ └──────────────┘ └──────────────┘
                        │
                        ▼
                ┌──────────────────┐
                │  WebContainer    │
                │  (File System)   │
                └──────────────────┘
                        │
                        ▼
                ┌──────────────────┐
                │  Convex Storage  │
                │  (Persistence)   │
                └──────────────────┘
```

---

## 2. Detailed Flow Comparison

### 2.1 Message Send Flow

#### Bolt.DIY Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BOLT.DIY MESSAGE SEND FLOW                        │
└─────────────────────────────────────────────────────────────────────┘

User Types Message
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 1. sendMessage() - Chat.client.tsx:389                         │
│    • Validate input                                            │
│    • Get selected UI element context                           │
│    • Include model/provider metadata                           │
│    • Get modified files from workbenchStore                    │
│    • Convert to XML artifact format                            │
│    • Process file attachments (images)                         │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. append() - useChat hook from @ai-sdk/react                  │
│    • Add message to messages array                             │
│    • Trigger API call to /api/chat                             │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. POST /api/chat - api.chat.ts:42                             │
│    • Parse request body (messages, model, provider)            │
│    • Get API keys from environment                             │
│    • Convert messages to provider format                       │
│    • Inject system prompt with <boltArtifact> instructions     │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. streamText() - AI SDK                                       │
│    • Call LLM with messages                                    │
│    • Stream response chunks                                    │
│    • Wrap in createDataStream()                                │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 5. Response Stream - text/event-stream (SSE)                   │
│    • text-delta events (LLM response chunks)                   │
│    • finish event (completion metadata)                        │
│    • error events (if failures)                                │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 6. Client receives stream - Chat.client.tsx                    │
│    • useChat hook accumulates chunks                           │
│    • Updates messages state reactively                         │
│    • Triggers re-render                                        │
└────────────────────────────────────────────────────────────────┘
```

#### Chef Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CHEF MESSAGE SEND FLOW                          │
└─────────────────────────────────────────────────────────────────────┘

User Types Message
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 1. sendMessage() - Chat.tsx                                    │
│    • Validate input                                            │
│    • Get API key from provider                                 │
│    • Call append() from useChat                                │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. experimental_prepareRequestBody() - Chat.tsx:185            │
│    • Get current files from workbenchStore                     │
│    • Create ChatContextManager                                 │
│    • Collapse message history (smart context window)           │
│    • Extract relevant files from artifacts                     │
│    • Build context with file contents                          │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. POST /api/chat - chat.ts (Remix loader)                     │
│    • Parse request body                                        │
│    • Validate API key                                          │
│    • Get model/provider config                                 │
│    • Call convexAgent()                                        │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. convexAgent() - convex-agent.ts:43                          │
│    • Initialize Convex client                                  │
│    • Prepare tools (file operations)                           │
│    • Call streamText() with tools                              │
│    • Wrap in createDataStream()                                │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 5. Response Stream - text/event-stream (SSE)                   │
│    • 0:"text-delta-chunk"                                      │
│    • 8:{"type":"tool-call","toolCallId":"..."}                 │
│    • 9:{"type":"tool-result","result":"..."}                   │
│    • a:{"type":"finish","finishReason":"stop"}                 │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 6. Client receives stream - Chat.tsx                           │
│    • useChat hook accumulates chunks                           │
│    • onToolCall() waits for action completion                  │
│    • Updates messages state                                    │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 Message Parsing Flow

#### Bolt.DIY Parsing

```
┌─────────────────────────────────────────────────────────────────────┐
│                   BOLT.DIY MESSAGE PARSING FLOW                      │
└─────────────────────────────────────────────────────────────────────┘

LLM Response Stream Arrives
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 1. AssistantMessage.tsx renders                                │
│    • Receives message object from Messages.client.tsx          │
│    • Extracts annotations (parsed metadata)                    │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. Parse annotations - AssistantMessage.tsx:96                 │
│    • Check if message has annotations.artifacts                │
│    • Extract artifact metadata from annotations                │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. Render Artifact components                                  │
│    • Map over artifacts array                                  │
│    • Render <Artifact key={id} messageId={id} />               │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. Artifact.tsx:73 - Subscribe to workbenchStore               │
│    • useStore(workbenchStore.artifacts)                        │
│    • Get artifact by messageId                                 │
│    • Extract actions from artifact                             │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 5. Render ActionList                                           │
│    • Map over actions array                                    │
│    • Display file path, type, status                           │
│    • Show progress indicators                                  │
└────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│              STREAMING PARSER (Runs in parallel)                     │
└─────────────────────────────────────────────────────────────────────┘

Stream Chunk Arrives
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 1. useChat hook receives chunk                                 │
│    • Accumulates text in message.content                       │
│    • Triggers onChunk callback (if configured)                 │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. StreamingMessageParser.parse() - message-parser.ts:146      │
│    • Process chunk character by character                      │
│    • State machine for XML tag detection                       │
│    • Track open/close tags                                     │
└────────────────────────────────────────────────────────────────┘
        │
        ├──► <boltArtifact> detected
        │    │
        │    ▼
        │    onArtifactOpen({ id, title }) callback
        │    │
        │    ▼
        │    workbenchStore.setArtifact(id, { title, closed: false })
        │
        ├──► <boltAction> detected
        │    │
        │    ▼
        │    onActionOpen({ id, type, filePath }) callback
        │    │
        │    ▼
        │    workbenchStore.addAction(artifactId, action)
        │
        ├──► Content inside action
        │    │
        │    ▼
        │    onActionStream({ id, content }) callback
        │    │
        │    ▼
        │    workbenchStore.updateAction(id, { content: accumulated })
        │
        ├──► </boltAction> detected
        │    │
        │    ▼
        │    onActionClose({ id, content }) callback
        │    │
        │    ▼
        │    workbenchStore.setActionComplete(id)
        │    │
        │    ▼
        │    ActionRunner.executeAction(action)
        │
        └──► </boltArtifact> detected
             │
             ▼
             onArtifactClose({ id }) callback
             │
             ▼
             workbenchStore.setArtifactClosed(id)
```

#### Chef Parsing

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CHEF MESSAGE PARSING FLOW                        │
└─────────────────────────────────────────────────────────────────────┘

LLM Response Stream Arrives
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 1. useChat hook in Chat.tsx                                    │
│    • Accumulates message chunks                                │
│    • Builds messages array                                     │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. useMessageParser() hook - Chat.tsx:306                      │
│    • Takes messages array as input                             │
│    • Calls processSampledMessages()                            │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. processSampledMessages() - useMessageParser.ts:143          │
│    • Sample last N messages                                    │
│    • Call parseMessages() with sampled messages                │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. parseMessages() - useMessageParser.ts:181                   │
│    • Loop through messages                                     │
│    • Extract text parts and tool invocations                   │
│    • Call messageParser.parse() for each part                  │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 5. StreamingMessageParser.parse() - message-parser.ts          │
│    • Character-by-character parsing                            │
│    • XML tag detection (<boltArtifact>, <boltAction>)          │
│    • Trigger callbacks for tag events                          │
└────────────────────────────────────────────────────────────────┘
        │
        ├──► <boltArtifact> detected
        │    │
        │    ▼
        │    onArtifactOpen({ messageId, artifactId, title })
        │    │
        │    ▼
        │    workbenchStore.addArtifact(messageId, artifact)
        │
        ├──► <boltAction> detected
        │    │
        │    ▼
        │    onActionOpen({ messageId, actionId, type, filePath })
        │    │
        │    ▼
        │    workbenchStore.addAction(messageId, action)
        │
        ├──► Content streaming
        │    │
        │    ▼
        │    onActionStream({ messageId, actionId, content })
        │    │
        │    ▼
        │    workbenchStore.updateAction(actionId, { content })
        │
        ├──► </boltAction> detected
        │    │
        │    ▼
        │    onActionClose({ messageId, actionId })
        │    │
        │    ▼
        │    workbenchStore.setActionStatus(actionId, 'complete')
        │    │
        │    ▼
        │    ActionRunner.runAction(action)
        │
        └──► </boltArtifact> detected
             │
             ▼
             onArtifactClose({ messageId, artifactId })
             │
             ▼
             workbenchStore.setArtifactClosed(artifactId)
```

### 2.3 File Update Flow

#### Bolt.DIY File Updates

```
┌─────────────────────────────────────────────────────────────────────┐
│                   BOLT.DIY FILE UPDATE FLOW                          │
└─────────────────────────────────────────────────────────────────────┘

Action Complete (from parser)
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 1. onActionClose callback                                      │
│    • Triggered by </boltAction> tag                            │
│    • Action added to workbenchStore                            │
│    • Contains: type, filePath, content                         │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. ActionRunner.addAction() - action-runner.ts:89              │
│    • Add action to queue                                       │
│    • Process queue sequentially (prevent race conditions)      │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. ActionRunner.processAction() - action-runner.ts:124         │
│    • Check action type                                         │
│    ├─ file: writeFile()                                        │
│    ├─ shell: runShellCommand()                                 │
│    └─ start: startDevServer()                                  │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. writeFile() - action-runner.ts:207                          │
│    • Create parent directories if needed                       │
│    • Write to WebContainer filesystem                          │
│    • Update filesStore with new content                        │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 5. WebContainer.fs.writeFile()                                 │
│    • Virtual filesystem write                                  │
│    • Trigger file watch events                                 │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 6. filesStore.setFile() - files.ts:142                         │
│    • Update file content in store                              │
│    • Mark file as modified                                     │
│    • Trigger subscribers (Editor, FileTree)                    │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 7. EditorStore updates - editor.ts:87                          │
│    • Update document in documents map                          │
│    • Update CodeMirror editor state                            │
│    • Trigger syntax highlighting                               │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 8. UI Components Re-render                                     │
│    • EditorPanel shows new file content                        │
│    • FileTree shows modified indicator                         │
│    • Preview refreshes (if applicable)                         │
└────────────────────────────────────────────────────────────────┘
```

#### Chef File Updates

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CHEF FILE UPDATE FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

Action Complete (from parser)
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 1. onActionClose callback - useMessageParser.ts                │
│    • Triggered by </boltAction> or tool-result                 │
│    • workbenchStore.addAction() called                         │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. workbenchStore.runAction() - workbench.client.ts:201        │
│    • Serialize action execution                                │
│    • Update action status to 'running'                         │
│    • Call ActionRunner.runAction()                             │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. ActionRunner.runAction() - action-runner.ts:67              │
│    • Switch on action.type                                     │
│    ├─ file: handleFileAction()                                 │
│    ├─ shell: handleShellAction()                               │
│    └─ start: handleStartAction()                               │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. handleFileAction() - action-runner.ts:189                   │
│    • Get file content from action                              │
│    • Call filesStore.saveFile(filePath, content)               │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 5. filesStore.saveFile() - files.ts:95                         │
│    • Update files map with new content                         │
│    • Mark as modified (if user made changes)                   │
│    • Call webcontainer.fs.writeFile()                          │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 6. WebContainer filesystem update                              │
│    • Write file to virtual filesystem                          │
│    • Trigger watch events                                      │
│    • Update dev server (if running)                            │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 7. _processEventBuffer() - files.ts:234                        │
│    • Debounce file events (100ms)                              │
│    • Batch multiple file changes                               │
│    • Update editorStore with new documents                     │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 8. editorStore.setDocuments() - editor.ts:103                  │
│    • Update documents map                                      │
│    • Trigger CodeMirror state update                           │
│    • Update selected document view                             │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 9. UI Components Re-render                                     │
│    • EditorPanel updates with new content                      │
│    • FileTree shows file structure                             │
│    • Preview iframe reloads                                    │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 10. Convex Persistence (Optional)                              │
│     • Save project state to Convex                             │
│     • Store file contents and metadata                         │
│     • Enable cross-device sync                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. State Management Comparison

### 3.1 Bolt.DIY State Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                  BOLT.DIY STATE MANAGEMENT                           │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  workbenchStore (Nanostores)                                 │
│  File: workbench.ts                                          │
├──────────────────────────────────────────────────────────────┤
│  • artifacts: Map<messageId, Artifact>                       │
│    - id: string                                              │
│    - title: string                                           │
│    - closed: boolean                                         │
│                                                              │
│  • actions: Map<actionId, Action>                            │
│    - id: string                                              │
│    - type: 'file' | 'shell' | 'start'                       │
│    - filePath: string                                        │
│    - content: string                                         │
│    - status: 'pending' | 'running' | 'complete' | 'failed'  │
│                                                              │
│  • files: Map<filePath, FileContent>                         │
│    - path: string                                            │
│    - content: string                                         │
│    - modified: boolean                                       │
└──────────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ filesStore   │ │ editorStore  │ │ terminalStore│
│ (files.ts)   │ │ (editor.ts)  │ │ (terminal.ts)│
├──────────────┤ ├──────────────┤ ├──────────────┤
│ • files: Map │ │ • documents  │ │ • terminals  │
│ • selectedId │ │ • selectedId │ │ • logs       │
│ • showHidden │ │ • scroll     │ │ • running    │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Key Features:**
- **Nanostores**: Reactive atoms, zero-dependency
- **Map-based**: O(1) lookups for artifacts/actions/files
- **Computed stores**: Derived values (e.g., modified files list)
- **Persistence**: Browser storage (IndexedDB/localStorage)

### 3.2 Chef State Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CHEF STATE MANAGEMENT                             │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  workbenchStore (Nanostores)                                 │
│  File: workbench.client.ts                                   │
├──────────────────────────────────────────────────────────────┤
│  • artifacts: Map<messageId, Map<artifactId, Artifact>>      │
│    - messageId: string                                       │
│    - artifactId: string                                      │
│    - title: string                                           │
│    - closed: boolean                                         │
│                                                              │
│  • actions: Map<messageId, Map<actionId, ActionState>>       │
│    - messageId: string                                       │
│    - actionId: string                                        │
│    - type: 'file' | 'shell' | 'start'                       │
│    - status: 'pending' | 'running' | 'complete' | 'aborted' │
│    - content: string                                         │
│                                                              │
│  • showWorkbench: atom<boolean>                              │
│  • currentView: atom<ViewType>                               │
│  • selectedFile: atom<string>                                │
└──────────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ filesStore   │ │ editorStore  │ │ chatStore    │
│ (files.ts)   │ │ (editor.ts)  │ │ (chat.ts)    │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ • files: Map │ │ • documents  │ │ • messages   │
│ • hasUnsaved │ │ • selectedId │ │ • isStreaming│
│ • dirsMap    │ │ • theme      │ │ • inputValue │
└──────────────┘ └──────────────┘ └──────────────┘
                        │
                        ▼
        ┌──────────────────────────────┐
        │  Convex Backend              │
        │  (Persistence Layer)         │
        ├──────────────────────────────┤
        │  • chats table               │
        │  • projects table            │
        │  • files table               │
        │  • users table               │
        └──────────────────────────────┘
```

**Key Features:**
- **Nanostores**: Same reactive atoms as Bolt.DIY
- **Nested Maps**: Two-level structure (messageId → artifactId/actionId)
- **Convex Integration**: Backend persistence and real-time sync
- **Cross-device**: Share state across multiple devices/tabs

---

## 4. Context Management

### 4.1 Bolt.DIY Context Handling

**Approach:** Manual file tracking in message payload

```javascript
// Chat.client.tsx:460-475
const modifiedFiles = workbenchStore.getModifiedFiles();

if (modifiedFiles) {
  const userUpdateArtifact = `
<boltArtifact id="modified-files" title="Modified Files">
  <boltAction type="file" filePath="src/App.tsx">
    ${fileContent}
  </boltAction>
</boltArtifact>
  `.trim();

  messageText = userUpdateArtifact + finalMessageContent;
}
```

**Pros:**
- Simple, explicit approach
- Full control over what's sent
- No hidden context management

**Cons:**
- Manual tracking required
- Can send unnecessary files
- Token usage not optimized

### 4.2 Chef Context Handling

**Approach:** Smart context manager with message collapsing

```javascript
// Chat.tsx:185-213
experimental_prepareRequestBody: async ({ requestBody }) => {
  const files = workbenchStore.getFiles();

  const contextManager = new ChatContextManager({
    maxTokens: 100000,
    relevanceThreshold: 0.7
  });

  // Collapse message history
  const collapsedMessages = contextManager.collapseMessages(
    requestBody.messages
  );

  // Extract relevant files from artifacts
  const relevantFiles = contextManager.getRelevantFiles(
    collapsedMessages,
    files
  );

  // Build optimized context
  return contextManager.buildContext({
    messages: collapsedMessages,
    files: relevantFiles
  });
}
```

**Pros:**
- Automatic context optimization
- Token usage efficiency
- Relevance-based file inclusion
- Message history collapsing

**Cons:**
- More complex implementation
- Potential loss of context
- Harder to debug

---

## 5. Streaming Implementation

### 5.1 Bolt.DIY Streaming

**Protocol:** Server-Sent Events (SSE) via AI SDK

```
// Server side - api.chat.ts
const response = streamText({
  model: getModel(provider, model),
  messages: convertedMessages,
  system: systemPrompt,
});

return createDataStream({
  stream: response.toDataStream(),
  onChunk: (chunk) => {
    // Process chunk
  }
});

// Response format:
0:"text chunk"
1:"more text"
2:{"type":"finish","finishReason":"stop"}
```

**Client side:**
```javascript
// Chat.client.tsx
const { messages, append, isLoading } = useChat({
  api: '/api/chat',
  body: { model, provider },
  onFinish: (message) => {
    // Parse annotations
  }
});
```

### 5.2 Chef Streaming

**Protocol:** Server-Sent Events (SSE) via AI SDK + Tools

```
// Server side - convex-agent.ts
const response = streamText({
  model: getModel(provider, model),
  messages: preparedMessages,
  tools: {
    writeFile: tool({
      description: 'Write a file',
      parameters: z.object({
        path: z.string(),
        content: z.string()
      }),
      execute: async ({ path, content }) => {
        return { success: true };
      }
    })
  }
});

return createDataStream({
  stream: response.toDataStream(),
  onToolCall: async (toolCall) => {
    // Wait for tool execution
    await workbenchStore.waitOnToolCall();
  }
});

// Response format:
0:"text chunk"
8:{"type":"tool-call","toolCallId":"call_123"}
9:{"type":"tool-result","result":{"success":true}}
a:{"type":"finish","finishReason":"tool-calls"}
```

**Client side:**
```javascript
// Chat.tsx
const { messages, append } = useChat({
  api: '/api/chat',
  body: { model, provider },
  onToolCall: async ({ toolCall }) => {
    // Execute tool locally
    await ActionRunner.runAction(toolCall);
    return { success: true };
  }
});
```

---

## 6. Key Differences Summary

| Feature | Bolt.DIY | Chef |
|---------|----------|------|
| **Backend** | Cloudflare Workers | Convex + Remix |
| **Persistence** | Browser storage only | Convex database |
| **Context** | Manual file inclusion | ChatContextManager |
| **Streaming** | Text streaming only | Text + Tool streaming |
| **State** | Flat maps | Nested maps (messageId → artifactId) |
| **File Tracking** | Modified files sent in next message | Relevant files auto-detected |
| **Collaboration** | Single user | Multi-user (via Convex) |
| **Deploy** | Cloudflare Pages | Convex + Vercel/Netlify |
| **Offline** | Limited | No |
| **Cost** | Free tier generous | Convex costs apply |

---

## 7. Common Patterns

Both projects share these core patterns:

### 7.1 XML-Based Protocol

```xml
<boltArtifact id="project-123" title="My App">
  <boltAction type="file" filePath="src/App.tsx">
    // File content here
  </boltAction>
  <boltAction type="shell">
    npm install
  </boltAction>
</boltArtifact>
```

### 7.2 Streaming Message Parser

State machine that detects:
- `<boltArtifact>` → Start project container
- `<boltAction type="file">` → File write operation
- `<boltAction type="shell">` → Shell command
- `</boltAction>` → Execute action
- `</boltArtifact>` → Close project

### 7.3 Action Runner Pattern

Serialized execution queue:
1. Parse action from stream
2. Add to queue
3. Execute sequentially (no race conditions)
4. Update UI on completion

### 7.4 WebContainer Integration

Both use WebContainer for:
- Virtual filesystem
- Package installation (npm/yarn)
- Dev server execution
- Live preview

### 7.5 Reactive State Management

Nanostores for:
- Minimal re-renders
- Fine-grained reactivity
- TypeScript support
- Framework-agnostic

---

## 8. Architecture Recommendations

### Choose Bolt.DIY if:
- Building a standalone tool
- Don't need backend persistence
- Want simple deployment (static hosting)
- Single-user focused
- Lower operational costs

### Choose Chef if:
- Need real-time collaboration
- Require backend persistence
- Want cross-device sync
- Building a SaaS product
- Need user authentication/teams

### Hybrid Approach:
- Use Bolt.DIY's simpler context handling
- Add Chef's ChatContextManager for optimization
- Use Convex for optional persistence
- Deploy to Cloudflare with Convex backend

---

## 9. Flow Diagram Legend

```
┌────────────┐
│  Component │  = UI Component
└────────────┘

┌────────────┐
│   Store    │  = State Store (Nanostores)
└────────────┘

┌────────────┐
│  Service   │  = Backend Service
└────────────┘

    ▼          = Data flow direction

    ├──►       = Branching flow

    │          = Sequential flow
```

---

This comparison document should give you a comprehensive understanding of how both projects handle the chat-to-code flow. Both are excellent examples of modern AI-powered development tools with slightly different trade-offs in complexity vs. features.
