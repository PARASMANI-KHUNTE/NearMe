import { env } from '../config/env';

// Google Auth Service for Web
declare global {
  interface Window {
    google: any;
  }
}

export class GoogleAuthService {
  private static clientId = env.googleClientId;

  static initGoogleAuth() {
    return new Promise<void>((resolve, reject) => {
      if (!this.clientId) {
        reject(new Error('Missing VITE_GOOGLE_CLIENT_ID'));
        return;
      }

      const initialize = () => {
        try {
          window.google.accounts.id.initialize({
            client_id: this.clientId,
            callback: this.handleCredentialResponse.bind(this),
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      if (window.google?.accounts?.id) {
        initialize();
        return;
      }

      const startedAt = Date.now();
      const timeoutMs = 10_000;
      const pollMs = 50;

      const interval = window.setInterval(() => {
        if (window.google?.accounts?.id) {
          window.clearInterval(interval);
          initialize();
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          window.clearInterval(interval);
          reject(new Error('Google Identity Services script did not load'));
        }
      }, pollMs);
    });
  }

  static async handleCredentialResponse(response: any) {
    try {
      const idToken = response.credential;
      // Call the global handler if set
      if ((window as any).handleGoogleCredential) {
        await (window as any).handleGoogleCredential(idToken);
      }
    } catch (error) {
      console.error('Google auth error:', error);
    }
  }

  static renderGoogleButton(elementId: string) {
    if (!window.google?.accounts?.id) return;

    const element = document.getElementById(elementId);
    if (!element) return;

    window.google.accounts.id.renderButton(element, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: element.clientWidth || 320,
    });
  }

  static promptGoogleSignIn() {
    if (!window.google?.accounts?.id) return;
    window.google.accounts.id.prompt();
  }
}
