export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Welcome to Portfolio Admin</h1>
        <p className="text-lg text-slate-600 mb-8">Art commission management system</p>
        <a
          href="/admin"
          className="inline-block bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          Go to Admin Dashboard
        </a>
      </div>
    </main>
  );
}
