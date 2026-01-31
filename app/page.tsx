export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full">
        <h1 className="text-6xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          DevOps Learning Platform
        </h1>

        <p className="text-xl text-center text-gray-600 mb-12">
          Master DevOps from Zero to Hero with structured roadmaps, hands-on labs,
          and automated content from AWS official sources.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-semibold mb-2">📚 Structured Learning</h3>
            <p className="text-gray-600">
              Follow comprehensive roadmaps designed by experts, from beginner to advanced.
            </p>
          </div>

          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-semibold mb-2">🎯 Hands-on Practice</h3>
            <p className="text-gray-600">
              Learn by doing with interactive labs, real-world projects, and submissions.
            </p>
          </div>

          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-semibold mb-2">🚀 Auto-Updated Content</h3>
            <p className="text-gray-600">
              50,000+ resources automatically crawled from AWS official sources daily.
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-12">
          <a
            href="/signup"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Get Started Free
          </a>
          <a
            href="/signin"
            className="px-8 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Sign In
          </a>
        </div>

        <div className="mt-16 text-center text-sm text-gray-500">
          <p>🎓 100% Free • 🔄 Always Updated • 🌍 Community Driven</p>
        </div>
      </div>
    </main>
  );
}
