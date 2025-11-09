"use client";

import { useState, useRef, useEffect } from "react";

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
}

export default function VoiceRecorder({ onTranscript }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + " ";
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript);
          onTranscript(transcript + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === "not-allowed") {
          alert("Microphone access denied. Please enable it in your browser settings.");
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [transcript, onTranscript]);

  function startRecording() {
    if (recognitionRef.current && !isRecording) {
      setTranscript("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  }

  function stopRecording() {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }

  if (!isSupported) {
    return (
      <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
        <p className="font-semibold mb-1">Voice recording not supported</p>
        <p className="text-xs">
          Your browser doesn't support voice recording. Try using Chrome or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-white font-semibold transition-all ${
          isRecording
            ? "bg-red-500 hover:bg-red-600 animate-pulse"
            : "bg-purple-600 hover:bg-purple-700"
        }`}
      >
        {isRecording ? (
          <>
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            Stop Recording
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            Start Voice Recording
          </>
        )}
      </button>

      {isRecording && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-4 bg-purple-600 rounded-full animate-pulse" />
              <span
                className="w-1.5 h-4 bg-purple-600 rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="w-1.5 h-4 bg-purple-600 rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
            <p className="text-sm font-semibold text-purple-900">
              Listening...
            </p>
          </div>
          {transcript && (
            <p className="text-sm text-gray-700 italic">{transcript}</p>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">
        Tip: Click "Start Voice Recording" and speak clearly. Your words will be
        transcribed in real-time.
      </p>
    </div>
  );
}
