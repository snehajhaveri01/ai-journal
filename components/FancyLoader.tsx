"use client";

interface FancyLoaderProps {
  message?: string;
}

export default function FancyLoader({ message = "Analyzing..." }: FancyLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4">
        <div className="flex flex-col items-center space-y-6">
          {/* Animated brain/thinking icon */}
          <div className="relative">
            <div className="w-20 h-20 relative">
              {/* Outer pulsing circles */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-ping opacity-20"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse opacity-30"></div>

              {/* Inner spinning circle */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-spin flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-purple-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Animated text */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {message}
            </h3>
            <p className="text-sm text-gray-500">
              AI is analyzing your entry
            </p>
          </div>

          {/* Animated dots */}
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
