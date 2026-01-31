export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex-col justify-between">
        <div>
          <h2 className="text-4xl font-bold text-white mb-4">
            DevOps Learning Platform
          </h2>
          <p className="text-blue-100 text-lg">
            Master DevOps from Zero to Hero with structured roadmaps and hands-on labs
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Structured Learning</h3>
              <p className="text-blue-100 text-sm">
                Follow comprehensive roadmaps designed by experts
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Hands-on Practice</h3>
              <p className="text-blue-100 text-sm">
                Learn by doing with interactive labs and real-world projects
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🚀</span>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Auto-Updated Content</h3>
              <p className="text-blue-100 text-sm">
                50,000+ resources from AWS official sources, updated daily
              </p>
            </div>
          </div>
        </div>

        <div className="text-blue-100 text-sm">
          © 2025 DevOps Learning Platform. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
}
