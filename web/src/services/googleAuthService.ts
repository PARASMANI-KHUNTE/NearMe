import { env } from '../config/env';
import { logger } from '../utils/logger';

// Google Auth Service for Web
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (
            element: HTMLElement,
            options: { theme: string; size: string; text: string; shape: string; width: number }
          ) => void;
          prompt: () => void;
        };
      };
    };
    handleGoogleCredential?: (idToken: string) => Promise<void>;
  }
}

interface GoogleCredentialResponse {
  credential?: string;
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
          const googleId = window.google?.accounts?.id;
          if (!googleId) {
            throw new Error('Google Identity Services script did not load');
          }

          googleId.initialize({
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

  static async handleCredentialResponse(response: GoogleCredentialResponse) {
    try {
      const idToken = response.credential;
      if (idToken && window.handleGoogleCredential) {
        await window.handleGoogleCredential(idToken);
      }
    } catch (error) {
      logger.error('Google auth error:', error);
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
