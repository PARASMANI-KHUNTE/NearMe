declare module 'expo-auth-session/providers/google' {
  export const useIdTokenAuthRequest: (config: {
    clientId: string;
    redirectUri?: string;
  }) => [
    unknown,
    { type?: string; params?: Record<string, string> } | null,
    (options?: unknown) => Promise<unknown>
  ];
}

