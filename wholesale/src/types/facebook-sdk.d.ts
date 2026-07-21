// Minimal type declarations for the Facebook JS SDK loaded via <script>
interface Window {
  fbAsyncInit?: () => void;
  FB: {
    init(params: {
      appId: string;
      cookie?: boolean;
      xfbml?: boolean;
      version: string;
    }): void;
    login(
      callback: (response: fb.AuthResponse) => void,
      options?: { scope: string }
    ): void;
    api(
      path: string,
      params: Record<string, string>,
      callback: (response: fb.UserInfo) => void
    ): void;
  };
}

declare namespace fb {
  interface AuthResponse {
    authResponse?: {
      accessToken: string;
      userID: string;
    };
  }

  interface UserInfo {
    id?: string;
    name?: string;
    email?: string;
    picture?: { data?: { url?: string } };
  }
}
