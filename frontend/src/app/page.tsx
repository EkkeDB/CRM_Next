export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            NextCRM
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Modern CRM system built with Next.js and Django. Manage your customer relationships with style.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-gray-900">CSS Working</h3>
            </div>
            <p className="text-gray-600">Tailwind CSS v3.4.0 is properly configured and functioning</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-gray-900">Components Ready</h3>
            </div>
            <p className="text-gray-600">All UI components are styled and ready to use</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-gray-900">Responsive Design</h3>
            </div>
            <p className="text-gray-600">Mobile-first responsive design implemented</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Explore the Application
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <a 
              href="/contacts" 
              className="group block p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg border-2 border-cyan-200 hover:border-cyan-300 transition-all duration-200 hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-cyan-900 mb-2 group-hover:text-cyan-700">
                📋 Contacts Page
              </h3>
              <p className="text-cyan-700 text-sm">
                Monday.com style contacts interface with the target design
              </p>
            </a>
            
            <a 
              href="/dashboard-example" 
              className="group block p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-blue-900 mb-2 group-hover:text-blue-700">
                📊 Dashboard Example
              </h3>
              <p className="text-blue-700 text-sm">
                Modern dashboard with statistics and activity feed
              </p>
            </a>
            
            <a 
              href="/css-test" 
              className="group block p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200 hover:border-green-300 transition-all duration-200 hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-green-900 mb-2 group-hover:text-green-700">
                🎨 CSS Test Page
              </h3>
              <p className="text-green-700 text-sm">
                Basic CSS functionality test with colorful elements
              </p>
            </a>
            
            <a 
              href="/dashboard" 
              className="group block p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-200 hover:border-red-300 transition-all duration-200 hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-red-900 mb-2 group-hover:text-red-700">
                🔐 Dashboard (Auth)
              </h3>
              <p className="text-red-700 text-sm">
                Protected dashboard with authentication system
              </p>
            </a>
            
            <a 
              href="/simple-test" 
              className="group block p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-200 hover:border-yellow-300 transition-all duration-200 hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-yellow-900 mb-2 group-hover:text-yellow-700">
                ⚡ Simple Test
              </h3>
              <p className="text-yellow-700 text-sm">
                Basic test page for debugging purposes
              </p>
            </a>
            
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ✨ More Features
              </h3>
              <p className="text-gray-700 text-sm">
                Additional features coming soon...
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>NextCRM - Built with Next.js 15, Tailwind CSS 3, and TypeScript</p>
        </div>
      </div>
    </div>
  )
}