import type {
  StorageAdapter,
  CanvasData,
  CanvasMetadata,
  SharePermissions,
} from "../../core/types";

interface MongoDBConfig {
  connectionString: string;
  databaseName?: string;
  collectionName?: string;
}

export const createMongoDBAdapter = (config: MongoDBConfig): StorageAdapter => {
  const {
    connectionString,
    databaseName = "excalidraw",
    collectionName = "canvases",
  } = config;

  // Base API URL for MongoDB operations
  const apiBase = "/api/excalidraw/storage";

  const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${apiBase}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Storage operation failed: ${error}`);
    }

    return response.json();
  };

  return {
    saveCanvas: async (
      userId: string,
      canvasId: string,
      data: CanvasData,
    ): Promise<void> => {
      await makeRequest("/save", {
        method: "POST",
        body: JSON.stringify({
          userId,
          canvasId,
          data: {
            ...data,
            updatedAt: new Date(),
          },
        }),
      });
    },

    loadCanvas: async (
      userId: string,
      canvasId: string,
    ): Promise<CanvasData | null> => {
      try {
        const result = await makeRequest(
          `/load?userId=${userId}&canvasId=${canvasId}`,
        );
        return result.canvas || null;
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          return null;
        }
        throw error;
      }
    },

    listCanvases: async (userId: string): Promise<CanvasMetadata[]> => {
      const result = await makeRequest(`/list?userId=${userId}`);
      return result.canvases || [];
    },

    deleteCanvas: async (userId: string, canvasId: string): Promise<void> => {
      await makeRequest("/delete", {
        method: "DELETE",
        body: JSON.stringify({ userId, canvasId }),
      });
    },

    shareCanvas: async (
      userId: string,
      canvasId: string,
      permissions: SharePermissions,
    ): Promise<string> => {
      const result = await makeRequest("/share", {
        method: "POST",
        body: JSON.stringify({
          userId,
          canvasId,
          permissions,
        }),
      });
      return result.shareId;
    },
  };
};

// Helper function to create API routes for MongoDB storage
export const createMongoDBAPIRoutes = () => {
  // This would be used in your Next.js API routes
  // Example: app/api/excalidraw/storage/[...operation]/route.ts

  return {
    // Save canvas
    save: async (req: Request) => {
      const { userId, canvasId, data } = await req.json();

      // Connect to MongoDB and save
      // Implementation would depend on your MongoDB client (mongoose, mongodb driver, etc.)

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    },

    // Load canvas
    load: async (req: Request) => {
      const url = new URL(req.url);
      const userId = url.searchParams.get("userId");
      const canvasId = url.searchParams.get("canvasId");

      if (!userId || !canvasId) {
        return new Response("Missing parameters", { status: 400 });
      }

      // Connect to MongoDB and load
      // Implementation would depend on your MongoDB client

      return new Response(JSON.stringify({ canvas: null }), {
        headers: { "Content-Type": "application/json" },
      });
    },

    // List canvases
    list: async (req: Request) => {
      const url = new URL(req.url);
      const userId = url.searchParams.get("userId");

      if (!userId) {
        return new Response("Missing userId", { status: 400 });
      }

      // Connect to MongoDB and list
      // Implementation would depend on your MongoDB client

      return new Response(JSON.stringify({ canvases: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    },

    // Delete canvas
    delete: async (req: Request) => {
      const { userId, canvasId } = await req.json();

      // Connect to MongoDB and delete
      // Implementation would depend on your MongoDB client

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    },

    // Share canvas
    share: async (req: Request) => {
      const { userId, canvasId, permissions } = await req.json();

      // Connect to MongoDB and create share record
      // Implementation would depend on your MongoDB client

      const shareId = `share_${Date.now()}`;

      return new Response(JSON.stringify({ shareId }), {
        headers: { "Content-Type": "application/json" },
      });
    },
  };
};

// Example MongoDB schema for canvas storage
export const canvasSchema = {
  _id: "ObjectId",
  canvasId: "String", // Unique canvas identifier
  userId: "String", // Owner user ID
  name: "String",
  elements: "Array", // Excalidraw elements
  appState: "Object", // Excalidraw app state
  files: "Object", // Binary files
  createdAt: "Date",
  updatedAt: "Date",
  metadata: "Object", // Additional metadata
  isPublic: "Boolean",
  collaborators: ["String"], // Array of user IDs
  shareSettings: {
    shareId: "String",
    permissions: "Object",
    expiresAt: "Date",
  },
};
