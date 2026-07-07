'use client'

export default function LoginPage() {
  async function handleLogin() {
    window.location.href = '/api/auth/signin/google'
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-2xl font-bold">SEO·MA</h1>
        <p className="mt-2 text-sm text-neutral-500">Outil SEO pour le marché marocain</p>
        <button
          onClick={handleLogin}
          className="mt-6 w-full rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
        >
          Se connecter avec Google
        </button>
      </div>
    </main>
  )
}
