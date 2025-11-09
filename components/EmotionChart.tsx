"use client";

interface EmotionScores {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  anxiety: number;
  excitement: number;
}

interface EmotionChartProps {
  emotions: EmotionScores;
}

export default function EmotionChart({ emotions }: EmotionChartProps) {
  const emotionConfig = [
    { key: "joy", label: "Joy", color: "#10b981", emoji: "😊" },
    { key: "excitement", label: "Excitement", color: "#f59e0b", emoji: "🎉" },
    { key: "surprise", label: "Surprise", color: "#8b5cf6", emoji: "😲" },
    { key: "sadness", label: "Sadness", color: "#3b82f6", emoji: "😔" },
    { key: "anxiety", label: "Anxiety", color: "#ef4444", emoji: "😰" },
    { key: "fear", label: "Fear", color: "#7c3aed", emoji: "😨" },
    { key: "anger", label: "Anger", color: "#dc2626", emoji: "😠" },
    { key: "disgust", label: "Disgust", color: "#059669", emoji: "🤢" },
  ];

  // Filter emotions with scores > 10 for cleaner display
  const significantEmotions = emotionConfig.filter(
    (e) => emotions[e.key as keyof EmotionScores] > 10
  );

  if (significantEmotions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span>🧠</span>
        Emotional Analysis
      </h4>
      <div className="space-y-2">
        {significantEmotions.map((emotion) => {
          const score = emotions[emotion.key as keyof EmotionScores];
          return (
            <div key={emotion.key} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-gray-700 flex items-center gap-1">
                  <span>{emotion.emoji}</span>
                  {emotion.label}
                </span>
                <span className="text-gray-600 font-semibold">{score}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 ease-out rounded-full"
                  style={{
                    width: `${score}%`,
                    backgroundColor: emotion.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
