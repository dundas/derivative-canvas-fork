import type { AuthAdapter, User } from "../../core/types";

// NextAuth adapter
export const createNextAuthAdapter = (options?: {
  signInPage?: string;
  apiRoute?: string;
}): AuthAdapter => {
  const { signInPage = "/auth/signin", apiRoute = "/api/auth" } = options || {};

  const getCurrentUser = async (): Promise<User | null> => {
    try {
      // For client-side, we need to use the session endpoint
      const response = await fetch(`${apiRoute}/session`);
      if (!response.ok) {
        return null;
      }

      const session = await response.json();
      if (!session?.user) {
        return null;
      }

      return {
        id: session.user.id || session.user.email, // Fallback to email if no id
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role,
        metadata: session.user.metadata || {},
      };
    } catch (error) {
      console.error("Failed to get current user:", error);
      return null;
    }
  };

  const signIn = async (provider?: string): Promise<void> => {
    // Redirect to NextAuth sign-in page
    const url = new URL(signInPage, window.location.origin);
    if (provider) {
      url.searchParams.set("callbackUrl", window.location.href);
    }
    window.location.href = url.toString();
  };

  const signOut = async (): Promise<void> => {
    try {
      await fetch(`${apiRoute}/signout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Redirect to home page after sign out
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to sign out:", error);
      throw error;
    }
  };

  const getToken = async (): Promise<string | null> => {
    try {
      const response = await fetch(`${apiRoute}/session`);
      if (!response.ok) {
        return null;
      }

      const session = await response.json();
      return session?.accessToken || null;
    } catch (error) {
      console.error("Failed to get token:", error);
      return null;
    }
  };

  const isAuthenticated = async (): Promise<boolean> => {
    const user = await getCurrentUser();
    return user !== null;
  };

  return {
    getCurrentUser,
    signIn,
    signOut,
    getToken,
    isAuthenticated,
  };
};

// Server-side NextAuth adapter (for use in API routes)
export const createServerNextAuthAdapter = (
  getSession: () => Promise<any>,
): AuthAdapter => {
  const getCurrentUser = async (): Promise<User | null> => {
    try {
      const session = await getSession();
      if (!session?.user) {
        return null;
      }

      return {
        id: session.user.id || session.user.email,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role,
        metadata: session.user.metadata || {},
      };
    } catch (error) {
      console.error("Failed to get current user:", error);
      return null;
    }
  };

  const getToken = async (): Promise<string | null> => {
    try {
      const session = await getSession();
      return session?.accessToken || null;
    } catch (error) {
      console.error("Failed to get token:", error);
      return null;
    }
  };

  const isAuthenticated = async (): Promise<boolean> => {
    const user = await getCurrentUser();
    return user !== null;
  };

  return {
    getCurrentUser,
    signIn: async (): Promise<void> => {
      throw new Error("Sign-in not available on server side");
    },
    signOut: async (): Promise<void> => {
      throw new Error("Sign-out not available on server side");
    },
    getToken,
    isAuthenticated,
  };
};
