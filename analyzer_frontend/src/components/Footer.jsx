import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Project Analyzer</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Advanced code analysis platform with AI-powered insights, 
              complexity metrics, and comprehensive project evaluation.
            </p>
          </div>

          {/* Services Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Static Analysis
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                AI Detection
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Sandbox Execution
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Complexity Metrics
              </li>
            </ul>
          </div>

          {/* Tech Stack Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-gray-800 text-xs rounded-full">React</span>
              <span className="px-3 py-1 bg-gray-800 text-xs rounded-full">Node.js</span>
              <span className="px-3 py-1 bg-gray-800 text-xs rounded-full">Python</span>
              <span className="px-3 py-1 bg-gray-800 text-xs rounded-full">FastAPI</span>
              <span className="px-3 py-1 bg-gray-800 text-xs rounded-full">AI/ML</span>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              <p>Version 1.0.0</p>
              <p className="text-xs mt-1">Built with ❤️ for developers</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>&copy; 2026 Project Analyzer. All rights reserved.</p>
            <div className="flex gap-6 mt-2 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
