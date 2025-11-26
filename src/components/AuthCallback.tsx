import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { handleOAuthCallback } from '../utils/auth';

interface AuthCallbackProps {
  onSuccess: () => void;
}

export function AuthCallback({ onSuccess }: AuthCallbackProps) {
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const processCallback = async () => {
      // Get code from URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const errorParam = params.get('error');

      if (errorParam) {
        setError(`GitHub OAuth error: ${errorParam}`);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        return;
      }

      try {
        // Exchange code for token
        const { token, user } = await handleOAuthCallback(code);

        // Save to store
        login(token, user);

        // Clean URL (remove code parameter)
        window.history.replaceState({}, document.title, '/');

        // Notify success
        onSuccess();
      } catch (err: any) {
        setError(err.message || 'Authentication failed');
      }
    };

    processCallback();
  }, [login, onSuccess]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Error de Autenticación
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-amber-700 hover:bg-amber-800 text-white px-6 py-2 rounded-lg"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <img
            src="/potato-02.gif"
            alt="Loading"
            className="mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Completando autenticación...
          </h2>
          <p className="text-gray-600">
            Por favor espera mientras verificamos tu identidad
          </p>
        </div>
      </div>
    </div>
  );
}
