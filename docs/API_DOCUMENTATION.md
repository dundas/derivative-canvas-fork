# Derivative Canvas API Documentation

Complete API documentation for the Derivative Canvas framework.

## 📚 Documentation Index

### REST API Documentation
- **[OpenAPI Specification](../openapi.yaml)** - Complete REST API specification in OpenAPI 3.0 format
- **[Interactive API Docs](#viewing-interactive-documentation)** - View with Swagger UI or Redoc

### Plugin & Event System
- **[Plugin Events Documentation](../framework/derivative-canvas/docs/PLUGIN_EVENTS.md)** - Event system API reference
- **[Plugin Integration Guide](../framework/derivative-canvas/plugins/INTEGRATION_GUIDE.md)** - Multi-plugin integration guide
- **[Framework README](../framework/derivative-canvas/README.md)** - Framework overview and quick start

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
yarn install

# Start development server
yarn start
```

### Authentication

All API endpoints (except `/health`) require authentication via one of:

1. **Bearer Token (JWT)**
   ```bash
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```

2. **API Key**
   ```bash
   X-API-Key: your-api-key-here
   ```

### Base URL

```
Development: http://localhost:3000/api/excalidraw
Production: https://api.derivative-canvas.dev
```

---

## 📖 REST API Overview

### Storage Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/storage/save` | Save or update a canvas |
| `GET` | `/storage/load` | Load a canvas by ID |
| `GET` | `/storage/list` | List all user canvases |
| `DELETE` | `/storage/delete` | Delete a canvas |

### Sharing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/storage/share` | Create a share link for a canvas |

### Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | API health check |

---

## 📝 API Examples

### Save Canvas

```bash
curl -X POST https://api.derivative-canvas.dev/storage/save \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123abc",
    "canvasId": "canvas_xyz789",
    "data": {
      "id": "canvas_xyz789",
      "name": "My Whiteboard",
      "elements": [],
      "appState": {
        "viewBackgroundColor": "#ffffff"
      },
      "files": {},
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:30:00Z",
      "userId": "user_123abc"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "canvasId": "canvas_xyz789",
  "message": "Canvas saved successfully"
}
```

---

### Load Canvas

```bash
curl -X GET "https://api.derivative-canvas.dev/storage/load?userId=user_123abc&canvasId=canvas_xyz789" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "canvas": {
    "id": "canvas_xyz789",
    "name": "My Whiteboard",
    "elements": [
      {
        "id": "element_1",
        "type": "rectangle",
        "x": 100,
        "y": 100,
        "width": 200,
        "height": 150
      }
    ],
    "appState": {
      "viewBackgroundColor": "#ffffff"
    },
    "files": {},
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:45:00Z",
    "userId": "user_123abc"
  }
}
```

---

### List Canvases

```bash
curl -X GET "https://api.derivative-canvas.dev/storage/list?userId=user_123abc&limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "canvases": [
    {
      "id": "canvas_xyz789",
      "name": "My Whiteboard",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:45:00Z",
      "userId": "user_123abc",
      "isPublic": false,
      "collaborators": []
    },
    {
      "id": "canvas_abc123",
      "name": "Design Mockup",
      "createdAt": "2025-01-14T14:30:00Z",
      "updatedAt": "2025-01-14T15:20:00Z",
      "userId": "user_123abc",
      "isPublic": true,
      "collaborators": ["user_456def"]
    }
  ],
  "total": 2,
  "limit": 10,
  "offset": 0
}
```

---

### Delete Canvas

```bash
curl -X DELETE https://api.derivative-canvas.dev/storage/delete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123abc",
    "canvasId": "canvas_xyz789"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Canvas deleted successfully"
}
```

---

### Share Canvas

```bash
curl -X POST https://api.derivative-canvas.dev/storage/share \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123abc",
    "canvasId": "canvas_xyz789",
    "permissions": {
      "type": "view",
      "public": true,
      "expiresAt": null
    }
  }'
```

**Response:**
```json
{
  "shareId": "share_1234567890",
  "shareUrl": "https://derivative-canvas.dev/canvas/share/share_1234567890",
  "expiresAt": null
}
```

---

## 🔌 Plugin Event System

The Derivative Canvas framework includes a powerful event system for plugin communication.

### Key Event Categories

1. **Plugin Lifecycle** - Mount, unmount events
2. **Canvas Events** - Load, save, element changes
3. **User Events** - Login, logout, profile updates
4. **Collaboration** - Join, leave sessions
5. **Plugin-Specific** - Audio transcription, screen capture, AI responses

### Example: Listening to Events

```typescript
import { useDerivativeCanvas } from "@derivative-canvas/core";

function MyComponent() {
  const { context } = useDerivativeCanvas();

  useEffect(() => {
    // Listen for canvas load events
    const handleCanvasLoaded = (event: CanvasLoadedEvent) => {
      console.log(`Canvas ${event.canvasName} loaded with ${event.elementCount} elements`);
    };

    context.framework.on("canvas:loaded", handleCanvasLoaded);

    // Cleanup
    return () => {
      context.framework.off("canvas:loaded", handleCanvasLoaded);
    };
  }, [context.framework]);

  return <div>My Component</div>;
}
```

### Example: Emitting Events

```typescript
// In your plugin
export const MyPlugin: ExcalidrawPlugin = {
  id: "my-plugin",
  // ...

  onMount: (context) => {
    // Emit custom event
    context.framework.emit("my-plugin:initialized", {
      timestamp: new Date(),
      config: {}
    });
  }
};
```

**See [Plugin Events Documentation](../framework/derivative-canvas/docs/PLUGIN_EVENTS.md) for complete event reference.**

---

## 🛠️ Viewing Interactive Documentation

### Option 1: Swagger UI (Recommended)

#### Using Docker

```bash
docker run -p 8080:8080 \
  -e SWAGGER_JSON=/openapi.yaml \
  -v $(pwd)/openapi.yaml:/openapi.yaml \
  swaggerapi/swagger-ui
```

Then open: http://localhost:8080

#### Using NPM Package

```bash
# Install swagger-ui-dist
npm install -g swagger-ui-dist

# Serve documentation
npx swagger-ui-dist openapi.yaml
```

---

### Option 2: Redoc

```bash
# Install redoc-cli
npm install -g redoc-cli

# Generate static HTML
redoc-cli bundle openapi.yaml -o docs/api-reference.html

# Or serve directly
npx redoc-cli serve openapi.yaml
```

Then open: http://localhost:8080

---

### Option 3: VS Code Extension

1. Install **OpenAPI (Swagger) Editor** extension
2. Open `openapi.yaml`
3. Right-click → "Open Preview"

---

## 📦 Client SDK Generation

Generate type-safe client SDKs from the OpenAPI spec:

### TypeScript/JavaScript SDK

```bash
# Install openapi-generator-cli
npm install @openapitools/openapi-generator-cli -g

# Generate TypeScript client
openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./generated/typescript-client
```

### Python SDK

```bash
openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./generated/python-client
```

### Other Languages

Supports 50+ languages including:
- Java
- Go
- Ruby
- PHP
- C#
- Rust
- Swift
- Kotlin

See: https://openapi-generator.tech/docs/generators

---

## 🔐 Authentication Guide

### JWT Bearer Token

1. **Obtain Token** from your auth provider (NextAuth, Clerk, Auth0, etc.)

```typescript
import { getSession } from "next-auth/react";

const session = await getSession();
const token = session?.accessToken;
```

2. **Include in Requests**

```typescript
fetch("https://api.derivative-canvas.dev/storage/save", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(data)
});
```

---

### API Key Authentication

1. **Generate API Key** (implementation-specific)

2. **Include in Requests**

```typescript
fetch("https://api.derivative-canvas.dev/storage/save", {
  method: "POST",
  headers: {
    "X-API-Key": "your-api-key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(data)
});
```

---

## 🧪 Testing the API

### Using cURL

```bash
# Set your token as environment variable
export API_TOKEN="your-jwt-token-here"

# Test health endpoint (no auth required)
curl -X GET https://api.derivative-canvas.dev/health

# Test authenticated endpoint
curl -X GET "https://api.derivative-canvas.dev/storage/list?userId=user_123" \
  -H "Authorization: Bearer $API_TOKEN"
```

---

### Using Postman

1. Import the OpenAPI spec:
   - File → Import → Select `openapi.yaml`

2. Configure authentication:
   - Authorization tab
   - Type: Bearer Token
   - Token: `<your-jwt-token>`

3. Send requests from the generated collection

---

### Using JavaScript/TypeScript

```typescript
// Using fetch
const response = await fetch("https://api.derivative-canvas.dev/storage/save", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    userId: "user_123",
    canvasId: "canvas_456",
    data: { /* canvas data */ }
  })
});

const result = await response.json();
```

```typescript
// Using axios
import axios from "axios";

const api = axios.create({
  baseURL: "https://api.derivative-canvas.dev",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }
});

const response = await api.post("/storage/save", {
  userId: "user_123",
  canvasId: "canvas_456",
  data: { /* canvas data */ }
});
```

---

## 📊 Data Models

### CanvasData

Complete canvas with all elements and state.

```typescript
interface CanvasData {
  id: string;                    // Unique canvas ID
  name: string;                  // Canvas name
  elements: ExcalidrawElement[]; // All canvas elements
  appState: AppState;            // Excalidraw app state
  files: BinaryFiles;            // Referenced files (images, etc.)
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
  userId: string;                // Owner user ID
  metadata?: Record<string, any>; // Custom metadata
}
```

---

### CanvasMetadata

Lightweight canvas info (used in list operations).

```typescript
interface CanvasMetadata {
  id: string;              // Unique canvas ID
  name: string;            // Canvas name
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
  userId: string;          // Owner user ID
  thumbnail?: string;      // Base64 thumbnail
  isPublic?: boolean;      // Public visibility
  collaborators?: string[]; // Collaborator user IDs
}
```

---

### SharePermissions

Sharing configuration.

```typescript
interface SharePermissions {
  type: "view" | "edit" | "admin"; // Permission level
  users?: string[];                // Specific users (if not public)
  public?: boolean;                // Public access
  expiresAt?: Date;                // Expiration timestamp
}
```

---

### ExcalidrawElement

A single canvas element (shape, text, etc.).

```typescript
interface ExcalidrawElement {
  id: string;                      // Unique element ID
  type: "rectangle" | "diamond" | "ellipse" | "arrow" | "line" | "freedraw" | "text" | "image";
  x: number;                       // X coordinate
  y: number;                       // Y coordinate
  width: number;                   // Width
  height: number;                  // Height
  strokeColor: string;             // Stroke color (hex)
  backgroundColor: string;         // Background color (hex)
  fillStyle: "solid" | "hachure" | "cross-hatch";
  strokeWidth: number;             // Stroke width
  roughness: number;               // 0-2
  opacity: number;                 // 0-100
  angle: number;                   // Rotation (radians)
  // ... additional properties
}
```

---

## ⚠️ Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | Success | Request successful |
| `400` | Bad Request | Invalid parameters or request format |
| `401` | Unauthorized | Missing or invalid authentication |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `500` | Server Error | Internal server error |

---

### Error Response Format

All errors follow this structure:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE_FOR_PROGRAMMATIC_HANDLING",
  "details": {
    "additional": "context"
  }
}
```

**Examples:**

```json
// Missing parameters
{
  "error": "Missing required parameters",
  "code": "MISSING_PARAMETERS",
  "details": {
    "missing": ["userId", "canvasId"]
  }
}

// Unauthorized
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}

// Not found
{
  "error": "Canvas not found",
  "code": "NOT_FOUND"
}
```

---

## 🚦 Rate Limiting

API requests are rate-limited to ensure fair usage:

- **Authenticated requests**: 100 requests/minute
- **Unauthenticated requests**: 20 requests/minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

When rate limit is exceeded:

```json
HTTP/1.1 429 Too Many Requests
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retryAfter": 60
  }
}
```

---

## 📈 API Versioning

The API uses URL versioning:

```
https://api.derivative-canvas.dev/v1/storage/save
https://api.derivative-canvas.dev/v2/storage/save
```

Current version: **v1** (default if not specified)

---

## 🌐 CORS Configuration

For browser-based applications, the API supports CORS:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-API-Key
```

---

## 📱 SDKs & Libraries

### Official SDKs

- **JavaScript/TypeScript**: `@derivative-canvas/client` (coming soon)
- **Python**: `derivative-canvas-python` (coming soon)
- **Go**: `derivative-canvas-go` (coming soon)

### Community SDKs

Check the [GitHub repository](https://github.com/your-org/derivative-canvas) for community-maintained SDKs.

---

## 🔍 Monitoring & Observability

### Health Check

Monitor API health:

```bash
curl https://api.derivative-canvas.dev/health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Metrics

Production endpoints expose metrics at:

```
https://api.derivative-canvas.dev/metrics
```

---

## 📞 Support & Resources

### Documentation
- **Main Docs**: https://docs.derivative-canvas.dev
- **API Reference**: https://api-docs.derivative-canvas.dev
- **Plugin Guide**: [Plugin Events](../framework/derivative-canvas/docs/PLUGIN_EVENTS.md)

### Community
- **Discord**: https://discord.gg/derivative-canvas
- **GitHub Discussions**: https://github.com/your-org/derivative-canvas/discussions
- **Stack Overflow**: Tag `derivative-canvas`

### Issues & Bugs
- **GitHub Issues**: https://github.com/your-org/derivative-canvas/issues
- **Security Issues**: security@derivative-canvas.dev

---

## 🗺️ Roadmap

### Coming Soon
- [ ] GraphQL API
- [ ] WebSocket support for real-time updates
- [ ] Batch operations API
- [ ] Canvas export API (PDF, SVG, PNG)
- [ ] Webhook notifications
- [ ] OAuth 2.0 flows

---

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

---

**Built with ❤️ by the Derivative Canvas team**
