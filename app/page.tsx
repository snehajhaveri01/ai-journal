import Link from "next/link";
export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-8 text-center">
      <h1 className="text-4xl font-bold">
        Reflectly × ChatGPT — but lightweight
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        Private AI journaling with instant summaries, mood & themes.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/journal"
          className="px-5 py-3 rounded-xl bg-black text-white"
        >
          Start journaling
        </Link>
        <Link href="/settings" className="px-5 py-3 rounded-xl border">
          Settings
        </Link>
      </div>
    </main>
  );
}
