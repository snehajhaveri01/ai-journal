"use client";

interface MoodMusicProps {
  mood: string;
  moodScore: number;
}

export default function MoodMusic({ mood, moodScore }: MoodMusicProps) {
  // Generate music recommendations based on mood
  const getMusicRecommendations = () => {
    if (mood === "positive" || moodScore >= 70) {
      return {
        vibe: "Upbeat & Energetic",
        genres: ["Pop", "Indie", "Electronic"],
        playlists: [
          { name: "Happy Hits", emoji: "😊" },
          { name: "Feel Good Indie", emoji: "🎸" },
          { name: "Positive Vibes", emoji: "✨" },
        ],
        color: "from-yellow-50 to-orange-50",
        border: "border-yellow-200",
      };
    } else if (mood === "negative" || moodScore <= 40) {
      return {
        vibe: "Reflective & Calm",
        genres: ["Acoustic", "Ambient", "Lo-fi"],
        playlists: [
          { name: "Peaceful Piano", emoji: "🎹" },
          { name: "Chill Lo-fi Beats", emoji: "🌙" },
          { name: "Acoustic Comfort", emoji: "🎵" },
        ],
        color: "from-blue-50 to-indigo-50",
        border: "border-blue-200",
      };
    } else {
      return {
        vibe: "Balanced & Mellow",
        genres: ["Jazz", "Soul", "Instrumental"],
        playlists: [
          { name: "Jazz Vibes", emoji: "🎷" },
          { name: "Smooth Soul", emoji: "💫" },
          { name: "Focus Flow", emoji: "🎧" },
        ],
        color: "from-purple-50 to-pink-50",
        border: "border-purple-200",
      };
    }
  };

  const music = getMusicRecommendations();

  const openSpotify = (playlistName: string) => {
    const searchQuery = encodeURIComponent(playlistName);
    window.open(`https://open.spotify.com/search/${searchQuery}`, "_blank");
  };

  return (
    <div
      className={`p-4 rounded-xl bg-gradient-to-br ${music.color} border ${music.border}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🎵</span>
        <div>
          <h4 className="text-sm font-bold text-gray-900">Music for Your Mood</h4>
          <p className="text-xs text-gray-600">{music.vibe}</p>
        </div>
      </div>

      <div className="space-y-2">
        {music.playlists.map((playlist, idx) => (
          <button
            key={idx}
            onClick={() => openSpotify(playlist.name)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-white hover:bg-gray-50 transition-all group border border-gray-200"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{playlist.emoji}</span>
              <span className="text-sm font-medium text-gray-900">
                {playlist.name}
              </span>
            </div>
            <svg
              className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Opens in Spotify • Tailored to your {mood} mood
      </p>
    </div>
  );
}
