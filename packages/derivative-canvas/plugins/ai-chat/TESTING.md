# Testing Documentation for AI Chat Plugin

This document describes the comprehensive test suite for the AI Chat Plugin.

## Test Coverage

We have created **5 test files** covering all major components of the AI Chat Plugin:

### 1. PlacementEngine Tests (`services/__tests__/placementEngine.test.ts`)

**Coverage**: 15 tests

Tests the intelligent element placement algorithm:

- ✅ Viewport center placement
- ✅ Grid-based alignment
- ✅ Flow-based layout
- ✅ Proximity-based positioning
- ✅ Collision detection and avoidance
- ✅ Bounding box calculations
- ✅ Grid snapping
- ✅ Spiral position generation

**Key Test Cases**:
- Places element in viewport center when canvas is empty
- Avoids overlapping existing elements
- Snaps to grid with grid strategy
- Places elements in natural flow pattern
- Places near target element with proximity strategy
- Respects padding when detecting overlaps

### 2. ElementFactory Tests (`utils/__tests__/elementFactory.test.ts`)

**Coverage**: 20+ tests

Tests creation of specialized canvas elements:

- ✅ Code blocks with syntax highlighting
- ✅ Terminal output displays
- ✅ Sticky notes with color schemes
- ✅ Chat bubbles for user/assistant
- ✅ Document placeholders
- ✅ Text elements
- ✅ Element grouping
- ✅ Unique ID generation
- ✅ Content-based sizing

**Key Test Cases**:
- Creates code blocks with proper styling
- Sizes elements based on content
- Groups related elements together
- Applies correct color schemes to notes
- Distinguishes between user and AI chat bubbles
- Handles placement options correctly

### 3. AIService Tests (`services/__tests__/aiService.test.ts`)

**Coverage**: 18 tests

Tests AI API integration and conversation management:

- ✅ Initialization with different providers
- ✅ Canvas context updates
- ✅ Message sending to custom/Anthropic/OpenAI
- ✅ Conversation history management
- ✅ AI response parsing
- ✅ Action extraction from responses
- ✅ Error handling
- ✅ Network error resilience

**Key Test Cases**:
- Sends messages to AI endpoints correctly
- Includes canvas context in requests
- Maintains conversation history
- Parses code/terminal/note actions from responses
- Handles API and network errors gracefully
- Supports multiple AI providers (Anthropic, OpenAI, Custom)

### 4. Canvas Helpers Tests (`utils/__tests__/canvasHelpers.test.ts`)

**Coverage**: 18 tests

Tests utility functions for canvas operations:

- ✅ Bounding box calculations
- ✅ Canvas state summaries
- ✅ Element filtering by type
- ✅ Text search in elements
- ✅ Area-based element selection
- ✅ Distance calculations
- ✅ Nearest element finding
- ✅ Overlap detection
- ✅ Viewport bounds
- ✅ Visibility checks

**Key Test Cases**:
- Calculates correct bounding boxes
- Generates AI-friendly canvas summaries
- Filters and searches elements efficiently
- Detects overlaps with padding
- Accounts for scroll and zoom in visibility checks
- Adds elements via framework API correctly

### 5. Integration Tests (`__tests__/integration.test.tsx`)

**Coverage**: 15 integration tests

Tests complete end-to-end workflows:

- ✅ Plugin configuration and metadata
- ✅ End-to-end AI chat → element creation
- ✅ Multi-element intelligent placement
- ✅ Context-aware conversations
- ✅ Conversation history across messages
- ✅ Complete user journeys
- ✅ Multiple element types in single response
- ✅ Error handling scenarios
- ✅ Plugin lifecycle hooks

**Key Test Cases**:
- Complete workflow: user message → AI response → element creation → canvas addition
- Handles multiple element types in single response
- Maintains context awareness throughout conversation
- Places multiple elements without overlaps
- Handles errors gracefully
- Plugin lifecycle hooks work correctly

## Test Statistics

- **Total Test Files**: 5
- **Total Test Cases**: 86+
- **Lines of Test Code**: ~3,000
- **Test Framework**: Vitest
- **Code Coverage Target**: >80%

## Running Tests

### Run All AI Chat Plugin Tests

```bash
# From project root
yarn test plugins/ai-chat

# Or with vitest directly
npx vitest run packages/derivative-canvas/plugins/ai-chat
```

### Run Specific Test File

```bash
# PlacementEngine tests
npx vitest packages/derivative-canvas/plugins/ai-chat/services/__tests__/placementEngine.test.ts

# ElementFactory tests
npx vitest packages/derivative-canvas/plugins/ai-chat/utils/__tests__/elementFactory.test.ts

# AIService tests
npx vitest packages/derivative-canvas/plugins/ai-chat/services/__tests__/aiService.test.ts

# Canvas helpers tests
npx vitest packages/derivative-canvas/plugins/ai-chat/utils/__tests__/canvasHelpers.test.ts

# Integration tests
npx vitest packages/derivative-canvas/plugins/ai-chat/__tests__/integration.test.tsx
```

### Run Tests in Watch Mode

```bash
yarn test:watch plugins/ai-chat
```

### Generate Coverage Report

```bash
yarn test:coverage plugins/ai-chat
```

## Test Organization

```
plugins/ai-chat/
├── __tests__/
│   └── integration.test.tsx       # Integration tests
├── services/
│   └── __tests__/
│       ├── aiService.test.ts      # AI service unit tests
│       └── placementEngine.test.ts # Placement engine unit tests
└── utils/
    └── __tests__/
        ├── canvasHelpers.test.ts  # Canvas helpers unit tests
        └── elementFactory.test.ts # Element factory unit tests
```

## Mocking Strategy

### API Mocking

All AI API calls are mocked using Vitest's `vi.fn()`:

```typescript
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ message: 'AI response' }),
});
```

### Canvas Context Mocking

Canvas elements and app state are mocked with minimal required properties:

```typescript
const mockContext = {
  elements: [],
  appState: {
    scrollX: 0,
    scrollY: 0,
    zoom: { value: 1 },
    width: 1000,
    height: 800,
  },
};
```

### Framework API Mocking

Framework API calls are mocked to verify integration:

```typescript
const mockAPI = {
  addElement: vi.fn(),
  updateElements: vi.fn(),
  updateAppState: vi.fn(),
};
```

## Testing Best Practices

1. **Unit Tests**: Test individual functions and methods in isolation
2. **Integration Tests**: Test complete workflows end-to-end
3. **Error Cases**: Always test error handling and edge cases
4. **Mocking**: Mock external dependencies (API calls, canvas API)
5. **Assertions**: Use specific assertions to verify behavior
6. **Clear Names**: Use descriptive test names that explain what is being tested

## Known Limitations

- Component rendering tests not included (would require React testing library setup)
- Visual regression tests not included (would require Playwright/Cypress)
- Performance benchmarks not included (would require custom tooling)

## Future Testing Enhancements

1. Add visual regression tests for element rendering
2. Add E2E tests with real AI endpoints (optional, for integration)
3. Add performance benchmarks for placement algorithm
4. Add accessibility tests for chat UI components
5. Add snapshot tests for generated elements

## Continuous Integration

Tests should be run in CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run AI Chat Plugin Tests
  run: yarn test plugins/ai-chat --run

- name: Generate Coverage
  run: yarn test:coverage plugins/ai-chat

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## Debugging Tests

### View Test Output

```bash
npx vitest run packages/derivative-canvas/plugins/ai-chat --reporter=verbose
```

### Debug Specific Test

```bash
npx vitest run -t "should place element in viewport center" --reporter=verbose
```

### Debug with Node Inspector

```bash
node --inspect-brk ./node_modules/.bin/vitest run
```

## Contributing

When adding new features to the AI Chat Plugin:

1. Write unit tests for new functions
2. Update integration tests if workflows change
3. Ensure all tests pass before committing
4. Maintain >80% code coverage
5. Update this documentation with new test cases

---

**Test Suite Created**: October 2025
**Last Updated**: October 2025
**Maintainer**: AI Chat Plugin Team
