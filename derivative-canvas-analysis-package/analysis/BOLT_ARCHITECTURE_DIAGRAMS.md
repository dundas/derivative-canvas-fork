# Bolt.DIY Architecture - Visual Diagrams

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BOLT.DIY ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        FRONTEND (React)                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │ Chat.client  │  │ Messages     │  │ Workbench (Editor)       │   │   │
│  │  │              │  │              │  │                          │   │   │
│  │  │ - sendMsg()  │  │ - User/Asst  │  │ - CodeMirror editor      │   │   │
│  │  │ - useChat()  │  │ - Artifact   │  │ - File tree              │   │   │
│  │  │   hook       │  │ - Actions    │  │ - Diff viewer            │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │   │
│  │         │                  │                        │                │   │
│  │         └─────────────┬────┴────────────────────────┘                │   │
│  │                       │                                              │   │
│  │       ┌───────────────▼──────────────────┐                          │   │
│  │       │    Message Parser (Streaming)    │                          │   │
│  │       │                                  │                          │   │
│  │       │ - Extract <boltArtifact> tags   │                          │   │
│  │       │ - Parse <boltAction> blocks     │                          │   │
│  │       │ - Detect code blocks (enhanced) │                          │   │
│  │       │ - Emit callbacks                │                          │   │
│  │       └───────────────┬──────────────────┘                          │   │
│  │                       │                                              │   │
│  │       ┌───────────────▼──────────────────┐                          │   │
│  │       │    Nanostores State Management   │                          │   │
│  │       │                                  │                          │   │
│  │       │ - workbenchStore.artifacts      │                          │   │
│  │       │ - workbenchStore.files          │                          │   │
│  │       │ - workbenchStore.unsavedFiles   │                          │   │
│  │       │ - workbenchStore.currentView    │                          │   │
│  │       └───────────────┬──────────────────┘                          │   │
│  │                       │                                              │   │
│  │  ┌────────────────────▼──────────────────────────┐                  │   │
│  │  │       Action Runner & File Store              │                  │   │
│  │  │                                               │                  │   │
│  │  │ - ActionRunner: Executes file/shell actions │                  │   │
│  │  │ - FilesStore: Virtual FS abstraction        │                  │   │
│  │  │ - EditorStore: Document state               │                  │   │
│  │  │ - Serialized execution queue                │                  │   │
│  │  └────────────────────┬──────────────────────────┘                  │   │
│  │                       │                                              │   │
│  └───────────────────────┼──────────────────────────────────────────────┘   │
│                          │                                                   │
│  ┌───────────────────────┼──────────────────────────────────────────────┐   │
│  │                       │      WEBCONTAINER (Sandboxed Runtime)        │   │
│  │                       ▼                                               │   │
│  │  ┌──────────────────────────────────────────────────────────────┐    │   │
│  │  │  Virtual Linux FS + npm/node/git + shell + dev server       │    │   │
│  │  │                                                              │    │   │
│  │  │  - fs.writeFile() - Write project files                    │    │   │
│  │  │  - spawn() - Execute shell commands                        │    │   │
│  │  │  - File watching for live reload                          │    │   │
│  │  └──────────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     BACKEND (Remix + Cloudflare)                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐    │   │
│  │  │  /api/chat - Main Chat Endpoint (POST)                       │    │   │
│  │  │                                                              │    │   │
│  │  │  1. Parse request (messages, files, model, provider)        │    │   │
│  │  │  2. Context Optimization                                    │    │   │
│  │  │     - createSummary() - Summarize chat history             │    │   │
│  │  │     - selectContext() - Pick relevant files                │    │   │
│  │  │  3. LLM Integration via AI SDK                             │    │   │
│  │  │  4. Stream Response with annotations                        │    │   │
│  │  │  5. SSE DataStream to client                               │    │   │
│  │  └──────────────────────────────────────────────────────────────┘    │   │
│  │                                                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐    │   │
│  │  │  LLM Provider Integration (Anthropic, OpenAI, etc)           │    │   │
│  │  │                                                              │    │   │
│  │  │  - streamText() via AI SDK                                  │    │   │
│  │  │  - System prompt with context                              │    │   │
│  │  │  - Tool calling (MCP)                                      │    │   │
│  │  │  - Token counting and limits                               │    │   │
│  │  └──────────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Message Parsing Pipeline

```
                    Streaming LLM Response
                            │
                            ▼
          ┌─────────────────────────────────────────┐
          │  StreamingMessageParser Input Stream     │
          │  (chunks arriving over time)             │
          └─────────────────────┬───────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Check for <boltArtifact>
                    └───────────┬───────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
            Found                          Not Found
               │                               │
        ┌──────▼──────┐               ┌────────▼─────────┐
        │ Parse tags  │               │ Detect patterns  │
        │             │               │                  │
        │ Extract:    │               │ Pattern 1:       │
        │ - id        │               │ "file.ext:\n```" │
        │ - title     │               │                  │
        │ - type      │               │ Pattern 2:       │
        │             │               │ "create 'file'"  │
        │ Emit:       │               │                  │
        │onArtifactOpen               │ Wrap + reparse   │
        └──────┬──────┘               │                  │
               │                      └────────┬─────────┘
               ▼                               │
        ┌──────────────────┐         (recurse)│
        │ Look for         │                  │
        │<boltAction> tags │                  │
        └──────┬───────────┘                  │
               │                              │
        ┌──────▼─────────────────────────┐   │
        │ For each action:                │   │
        │                                 │   │
        │ ┌─ type: 'file'              │   │
        │ │  └─ Parse filePath, content │   │
        │ │     Emit: onActionOpen      │   │
        │ │     onActionStream (chunks) │   │
        │ │     onActionClose           │   │
        │ │                             │   │
        │ ├─ type: 'shell'            │   │
        │ │  └─ Parse command           │   │
        │ │     Emit: onActionClose     │   │
        │ │                             │   │
        │ ├─ type: 'start'            │   │
        │ │  └─ Dev server command      │   │
        │ │     Emit: onActionClose     │   │
        │ │                             │   │
        │ └─ type: 'build'            │   │
        │    └─ Build command          │   │
        │       Emit: onActionClose    │   │
        └──────┬─────────────────────────┘   │
               │                             │
               └─────────────┬───────────────┘
                             │
                    ┌────────▼──────────┐
                    │ Emit Callbacks    │
                    │                   │
                    │ 1. onArtifactOpen │
                    │ 2. onActionOpen   │
                    │ 3. onActionStream │
                    │ 4. onActionClose  │
                    └────────┬──────────┘
                             │
                    ┌────────▼──────────────────────┐
                    │ Workbench Store Updates       │
                    │                               │
                    │ workbenchStore.addArtifact()  │
                    │ workbenchStore.addAction()    │
                    │ workbenchStore.runAction()    │
                    └────────┬──────────────────────┘
                             │
                    ┌────────▼──────────┐
                    │ Return Parsed     │
                    │ Markdown Content  │
                    │ (for display)     │
                    └───────────────────┘
```

---

## 3. File Update Flow: Creation to Display

```
LLM Response Stream
        │
        ├─ boltArtifact: id="proj-1", title="MyApp"
        │
        └─ boltAction: type="file", filePath="src/index.js"
           Content: "console.log('Hello');"
                    │
                    ▼
            ┌───────────────────────┐
            │ Message Parser        │
            │                       │
            │ Callback: onActionOpen│
            └───────────┬───────────┘
                        │
                ┌───────▼────────────────────────┐
                │ workbenchStore.addAction()     │
                │                                │
                │ - Create ActionState           │
                │ - status: 'pending'            │
                │ - Add to artifact.runner.actions
                └───────┬────────────────────────┘
                        │
                ┌───────▼─────────────────────────┐
                │ onActionStream (if file)        │
                │                                 │
                │ workbenchStore.runAction(      │
                │   data, isStreaming=true       │
                │ )                              │
                └───────┬─────────────────────────┘
                        │
                ┌───────▼──────────────────────────────┐
                │ workbenchStore._runAction()          │
                │                                      │
                │ 1. Switch to code view              │
                │    currentView.set('code')          │
                │                                      │
                │ 2. Select file in editor            │
                │    selectedFile.set(fullPath)       │
                │                                      │
                │ 3. Update EditorStore with content  │
                │    #editorStore.updateFile(         │
                │      fullPath,                      │
                │      data.action.content            │
                │    )                                │
                └───────┬──────────────────────────────┘
                        │
                ┌───────▼────────────────────────┐
                │ Editor Display Update          │
                │                                │
                │ Content appears in CodeMirror │
                │ with syntax highlighting      │
                │ (Live as chunks arrive)       │
                └───────┬────────────────────────┘
                        │
                ┌───────▼──────────────────────────┐
                │ When stream ends:                │
                │ onActionClose callback           │
                │                                  │
                │ workbenchStore.runAction(       │
                │   data, isStreaming=false       │
                │ )                               │
                └───────┬──────────────────────────┘
                        │
                ┌───────▼──────────────────────────────┐
                │ artifact.runner.runAction()          │
                │                                      │
                │ #runFileAction():                    │
                │ 1. Create directories if needed     │
                │ 2. webcontainer.fs.writeFile()      │
                │ 3. Status: 'complete'               │
                └───────┬──────────────────────────────┘
                        │
                ┌───────▼──────────────────────────┐
                │ FilesStore Update                │
                │                                  │
                │ files.setKey(filePath, {         │
                │   type: 'file',                  │
                │   content,                       │
                │   isBinary: false                │
                │ })                               │
                └───────┬──────────────────────────┘
                        │
                ┌───────▼──────────────────────────┐
                │ File Tree Update                 │
                │                                  │
                │ FileTree component reacts to    │
                │ files MapStore changes          │
                │                                  │
                │ Shows new file in tree           │
                │ with file icon                   │
                └───────┬──────────────────────────┘
                        │
                ┌───────▼──────────────────────────┐
                │ Artifact Display Update          │
                │                                  │
                │ Artifact component shows:        │
                │ ✓ Action progress                │
                │ ✓ Status: complete               │
                │ ✓ File count                     │
                └───────────────────────────────────┘
```

---

## 4. State Synchronization Cycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STATE SYNCHRONIZATION CYCLE                           │
└─────────────────────────────────────────────────────────────────────────────┘

Message N                                    Message N+1
      │                                             │
      └─────────────────────┬──────────────────────┘
                            │
                    ┌───────▼────────────┐
                    │ User Session       │
                    │                    │
                    │ Working in code    │
                    │ editor on files    │
                    │ created by prev    │
                    │ message            │
                    └───────┬────────────┘
                            │
                    ┌───────▼──────────────────────┐
                    │ File Modifications Tracked   │
                    │                              │
                    │ User edits file "src/App.js"│
                    │ 1. EditorStore tracks change│
                    │ 2. unsavedFiles Set updated │
                    │ 3. Modified files Map        │
                    │    stores original content   │
                    └───────┬──────────────────────┘
                            │
                    ┌───────▼────────────────────────┐
                    │ User Sends Next Message        │
                    │                                │
                    │ "Add error handling"           │
                    │ sendMessage() is called        │
                    └───────┬────────────────────────┘
                            │
                    ┌───────▼────────────────────────────┐
                    │ Collect Modified Files             │
                    │                                    │
                    │ getModifiedFiles()                 │
                    │ returns:                           │
                    │ {                                  │
                    │   'src/App.js': {                 │
                    │     originalContent: '...',       │
                    │     newContent: '...',            │
                    │   }                               │
                    │ }                                  │
                    └───────┬────────────────────────────┘
                            │
                    ┌───────▼──────────────────────────────┐
                    │ Format as Artifact Tags              │
                    │                                      │
                    │ <boltArtifact ...>                  │
                    │   <boltAction type="file"           │
                    │      filePath="src/App.js">         │
                    │     [file content with changes]     │
                    │   </boltAction>                     │
                    │ </boltArtifact>                     │
                    │                                      │
                    │ + user message                      │
                    │ + model/provider metadata           │
                    │ + image attachments                 │
                    └───────┬──────────────────────────────┘
                            │
                    ┌───────▼────────────────────┐
                    │ Send to /api/chat          │
                    │                            │
                    │ POST request with modified │
                    │ files sent to LLM          │
                    └───────┬────────────────────┘
                            │
                    ┌───────▼────────────────────┐
                    │ LLM Context                │
                    │                            │
                    │ LLM sees previous files    │
                    │ AND user's modifications   │
                    │ Provides accurate changes  │
                    └───────┬────────────────────┘
                            │
                    ┌───────▼────────────────────┐
                    │ New Response               │
                    │                            │
                    │ Updated boltArtifacts      │
                    │ reflecting all changes     │
                    └─────────────────────────────┘
```

---

## 5. Component Communication Map

```
                    ┌─────────────────┐
                    │  Chat.client    │
                    │  (orchestrator) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
    ┌────────────┐  ┌─────────────┐  ┌──────────────────┐
    │BaseChat    │  │useChat hook │  │useMessageParser  │
    │(layout)    │  │(AI SDK)     │  │(parsing)         │
    └────────────┘  └──────┬──────┘  └────────────────┬─┘
        │                  │                          │
        ├──────────────────┼──────────────────────────┤
        │                  │                          │
        ▼                  ▼                          ▼
    ┌────────────────────────────────────────────────────┐
    │         workbenchStore (Nanostores)               │
    │                                                    │
    │ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
    │ │artifacts:    │ │files:        │ │actions:    │ │
    │ │MapStore<...> │ │MapStore<...> │ │(per        │ │
    │ │              │ │              │ │ artifact)  │ │
    │ │id, title,    │ │filePath→     │ │            │ │
    │ │type, runner  │ │File|Folder   │ │type, path, │ │
    │ │              │ │content,lock  │ │content,    │ │
    │ │              │ │              │ │status      │ │
    │ └──────────────┘ └──────────────┘ └────────────┘ │
    │                                                    │
    │ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
    │ │currentView   │ │selectedFile  │ │unsaved     │ │
    │ │'code'|'diff' │ │filepath      │ │Files: Set  │ │
    │ │|'preview'    │ │              │ │<string>    │ │
    │ └──────────────┘ └──────────────┘ └────────────┘ │
    │                                                    │
    └────────────────────────────────────────────────────┘
        │                  │                 │
        ▼                  ▼                 ▼
    ┌──────────────┐  ┌────────────┐  ┌──────────────┐
    │Messages      │  │Workbench   │  │ActionRunner  │
    │- UserMsg     │  │- EditorPanel│ │- execute()   │
    │- AssistMsg   │  │- FileTree   │ │- abort()     │
    │- Artifact    │  │- DiffView   │ │- progress    │
    │  Container   │  │- Preview    │ │              │
    └──────────────┘  └────────────┘  └──────┬───────┘
                                               │
                                      ┌────────▼────────┐
                                      │WebContainer API │
                                      │                 │
                                      │fs.writeFile()   │
                                      │spawn(cmd)       │
                                      │fs.mkdir()       │
                                      │fs.readFile()    │
                                      └─────────────────┘
```

---

## 6. Action Execution Queue

```
                 New Action Arrives
                        │
                        ▼
        ┌──────────────────────────────┐
        │ workbenchStore.runAction()   │
        │                              │
        │ Check: isStreaming?          │
        └──────────┬───────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
    YES (streaming)      NO (final)
    Update editor         Queue execution
         │                     │
         └─────────┬───────────┘
                   │
        ┌──────────▼──────────────────────────┐
        │ addToExecutionQueue()                │
        │                                      │
        │ #globalExecutionQueue chain:         │
        │ Promise.resolve()                    │
        │   .then(() => actionCallback())     │
        │   .then(() => nextAction())         │
        │   ...                               │
        └──────────┬──────────────────────────┘
                   │
        ┌──────────▼──────────────────────────┐
        │ artifact.runner._executeAction()    │
        │                                      │
        │ Action Type Dispatch:                │
        │ - file → #runFileAction()           │
        │ - shell → #runShellAction()         │
        │ - start → #runStartAction()         │
        │ - build → #runBuildAction()         │
        │ - supabase → handleSupabaseAction() │
        └──────────┬──────────────────────────┘
                   │
        ┌──────────▼──────────────────────────┐
        │ Update Action Status                 │
        │                                      │
        │ pending → running → complete        │
        │                    OR failed        │
        │                    OR aborted       │
        └──────────┬──────────────────────────┘
                   │
        ┌──────────▼──────────────────────────┐
        │ Artifact Container Updates           │
        │                                      │
        │ Status visible in UI:                │
        │ ⏳ pending (gray)                   │
        │ ⚙️ running (spinner)                 │
        │ ✓ complete (green checkmark)        │
        │ ✗ failed (red X)                    │
        └──────────┬──────────────────────────┘
                   │
        ┌──────────▼──────────────────────────┐
        │ Next Action Starts                   │
        │ (if multiple queued)                 │
        │                                      │
        │ Serialization ensures:               │
        │ - No race conditions                 │
        │ - File writes are ordered            │
        │ - Shell commands complete before next
        └──────────────────────────────────────┘
```

---

## 7. WebContainer File System Integration

```
LLM sends file action
        │
        ▼
┌──────────────────────────────┐
│ FileAction.filePath          │
│ e.g., "/src/components/App.js"
└──────────┬───────────────────┘
           │
    ┌──────▼──────────────┐
    │ Compute relative path│
    │ (from workdir)       │
    │                      │
    │ relative =           │
    │ path.relative(       │
    │   wc.workdir,        │
    │   filePath           │
    │ )                    │
    └──────┬───────────────┘
           │
    ┌──────▼──────────────────────┐
    │ Extract directory            │
    │                              │
    │ folder = path.dirname(       │
    │   relative                   │
    │ )                            │
    │ // "src/components"          │
    └──────┬───────────────────────┘
           │
    ┌──────▼────────────────────────┐
    │ Create directory if needed     │
    │                                │
    │ await webcontainer            │
    │   .fs.mkdir(folder,            │
    │     { recursive: true }        │
    │   )                            │
    └──────┬─────────────────────────┘
           │
    ┌──────▼──────────────────────────┐
    │ Write file to WebContainer       │
    │                                  │
    │ await webcontainer              │
    │   .fs.writeFile(                │
    │     relative,                   │
    │     content                     │
    │   )                             │
    └──────┬──────────────────────────┘
           │
    ┌──────▼──────────────────────────┐
    │ Update FilesStore               │
    │                                  │
    │ files.setKey(filePath, {        │
    │   type: 'file',                 │
    │   content,                      │
    │   isBinary: false               │
    │ })                              │
    └──────┬──────────────────────────┘
           │
    ┌──────▼──────────────────────────────┐
    │ WebContainer Emits File Event       │
    │ (watched via PathWatcher)            │
    │                                      │
    │ triggers:                            │
    │ - Live reload                        │
    │ - Dev server refresh                │
    │ - Preview pane update               │
    └──────┬───────────────────────────────┘
           │
    ┌──────▼──────────────────────────┐
    │ EditorStore Synced               │
    │                                  │
    │ currentDocument.content updated │
    │ synced with preview              │
    │ Dev server running               │
    │                                  │
    │ USER SEES:                       │
    │ ✓ File in editor                 │
    │ ✓ File in file tree              │
    │ ✓ Live preview updated           │
    └──────────────────────────────────┘
```

---

## 8. Error & Alert Flow

```
Action Execution Error
        │
        ▼
┌─────────────────────────────┐
│ catch (error) block         │
│ in #executeAction()         │
└──────────┬──────────────────┘
           │
        ┌──┴──┐
        │     │
        ▼     ▼
    File   Shell
    Error  Error
        │     │
        └──┬──┘
           │
    ┌──────▼──────────────────────┐
    │ Create Error Alert           │
    │                              │
    │ ActionAlert {                │
    │   type: 'error',             │
    │   title: '...',              │
    │   description: '...',        │
    │   content: '...' (output)    │
    │ }                            │
    └──────┬───────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │ Update Action Status         │
    │                              │
    │ #updateAction({              │
    │   status: 'failed',          │
    │   error: message             │
    │ })                           │
    └──────┬───────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │ Trigger Alert Callback       │
    │                              │
    │ this.onAlert?.(alert)        │
    │                              │
    │ Sets workbench store:        │
    │ actionAlert.set(alert)       │
    └──────┬───────────────────────┘
           │
    ┌──────▼──────────────────────────┐
    │ Alert Component Renders          │
    │                                  │
    │ ┌────────────────────────────┐  │
    │ │   Dev Server Failed        │  │
    │ ├────────────────────────────┤  │
    │ │ Error: npm install failed  │  │
    │ │                            │  │
    │ │ Output:                    │  │
    │ │ ─────────────────────────  │  │
    │ │ ERR! code E404             │  │
    │ │ ERR! 404 Not Found - pkg   │  │
    │ └────────────────────────────┘  │
    │                                  │
    │ User can:                        │
    │ ✓ Copy error output              │
    │ ✓ Dismiss alert                  │
    │ ✓ Send follow-up message to LLM  │
    └──────────────────────────────────┘
```

---

## 9. Chat Synchronization Loop

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPLETE CHAT SYNCHRONIZATION LOOP                 │
└─────────────────────────────────────────────────────────────────┘

Round 1: AI Creates Project
┌────────────────────────────────────────────────────────────────┐
│                                                                  │
│  User: "Create a React app"                                     │
│    ├─ model: "claude-3-5-sonnet"                               │
│    ├─ provider: "Anthropic"                                     │
│    └─ files: [] (empty)                                         │
│                                                                  │
│                      ↓                                           │
│                                                                  │
│  Server Response:                                               │
│    <boltArtifact id="proj-1" title="React App">              │
│      <boltAction type="file" filePath="package.json">        │
│        { "name": "app", "dependencies": { ... } }           │
│      </boltAction>                                            │
│      <boltAction type="file" filePath="src/App.jsx">        │
│        export default function App() { ... }                 │
│      </boltAction>                                            │
│      <boltAction type="shell">                               │
│        npm install && npm start                              │
│      </boltAction>                                            │
│    </boltArtifact>                                            │
│                                                                │
│                      ↓                                          │
│                                                                │
│  Client State:                                                 │
│    - workbenchStore.artifacts[proj-1] created                │
│    - workbenchStore.files populated                           │
│    - Editor shows src/App.jsx                                 │
│    - Dev server running                                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘

Round 2: User Modifies & Asks for Changes
┌────────────────────────────────────────────────────────────────┐
│                                                                  │
│  User edits src/App.jsx in editor                             │
│    → EditorStore.updateFile()                                 │
│    → unsavedFiles.add("src/App.jsx")                         │
│    → workbenchStore tracks original vs new content           │
│                                                                │
│  User: "Add a button to the component"                        │
│    ├─ model: "claude-3-5-sonnet"                              │
│    ├─ provider: "Anthropic"                                    │
│    └─ files: [                                                 │
│         {                                                      │
│           path: "src/App.jsx",                                 │
│           originalContent: "export default function App...", │
│           newContent: "export default function App..."        │
│         }                                                       │
│       ]                                                        │
│    + Modified files sent as boltArtifact tags                │
│                                                                │
│                      ↓                                          │
│                                                                │
│  Server sees context:                                          │
│    - Current state of all files                               │
│    - What user changed                                        │
│    - User's request                                           │
│                                                                │
│  LLM generates response modifying src/App.jsx                │
│    respecting user's edits                                    │
│                                                                │
│  Server Response:                                              │
│    <boltArtifact id="proj-1" ...>                            │
│      <boltAction type="file" filePath="src/App.jsx">       │
│        export default function App() {                        │
│          return (                                              │
│            <div>                                              │
│              <h1>App</h1>                                      │
│              <button>Click me</button>  ← Added by LLM      │
│            </div>                                              │
│          );                                                    │
│        }                                                        │
│      </boltAction>                                            │
│    </boltArtifact>                                            │
│                                                                │
│                      ↓                                          │
│                                                                │
│  Client State:                                                │
│    - File updated in editor                                  │
│    - Preview refreshes                                        │
│    - unsavedFiles cleared (auto-saved by LLM)               │
│    - User can now further edit or ask more questions         │
│                                                                │
└────────────────────────────────────────────────────────────────┘

Cycle repeats with perfect context awareness...
```

