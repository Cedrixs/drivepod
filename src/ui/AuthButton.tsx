import { startLogin } from '../auth/auth';

export function AuthScreen(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-6 text-white">
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="w-24 h-24 bg-accent rounded-2xl flex items-center justify-center shadow-lg">
          <svg viewBox="0 0 64 64" className="w-14 h-14 text-white fill-current">
            <circle cx="32" cy="32" r="28" fill="currentColor" opacity="0.2" />
            <polygon points="24,16 48,32 24,48" fill="currentColor" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">DrivePod</h1>
        <p className="text-navy-100/60 text-center max-w-xs">
          Lecteur audio pour vos fichiers Google Drive
        </p>
      </div>

      <button
        onClick={() => void startLogin()}
        className="bg-white text-gray-800 font-semibold px-6 py-3 rounded-xl flex items-center gap-3 shadow-md hover:bg-gray-100 active:scale-95 transition-all"
      >
        <svg className="w-5 h-5" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        Se connecter à Google Drive
      </button>

      <p className="mt-6 text-xs text-navy-100/40 text-center max-w-xs">
        Connexion sécurisée OAuth 2.0 PKCE. Aucune donnée n&apos;est stockée sur nos serveurs.
      </p>
    </div>
  );
}
