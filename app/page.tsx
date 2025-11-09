import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-3xl w-full text-center space-y-6">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Reflectly AI Journal
        </h1>
        <p className="text-xl text-gray-600">
          Private AI journaling with instant summaries, mood & themes.
        </p>
        <div className="flex justify-center gap-4 mt-8">
          <Link
            href="/signin"
            className="px-6 py-3 rounded-xl bg-black text-white hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            Start journaling
          </Link>
          <Link
            href="/signin"
            className="px-6 py-3 rounded-xl border-2 text-black border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
