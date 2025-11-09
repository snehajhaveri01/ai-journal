"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-purple-600 underline",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getText());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[160px] p-4",
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getText()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-black focus-within:border-transparent transition-shadow">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-xl flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
            editor.isActive("bold") ? "bg-gray-300 font-bold" : ""
          }`}
          title="Bold (Ctrl+B)"
          type="button"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M6 12h8M6 6h8M6 18h8"
            />
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg hover:bg-gray-200 transition-colors italic ${
            editor.isActive("italic") ? "bg-gray-300" : ""
          }`}
          title="Italic (Ctrl+I)"
          type="button"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m-4 4h8"
            />
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
            editor.isActive("strike") ? "bg-gray-300" : ""
          }`}
          title="Strikethrough"
          type="button"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <line x1="4" y1="12" x2="20" y2="12" strokeWidth={2} />
            <path
              strokeLinecap="round"
              strokeWidth={2}
              d="M9 5c0-1 1-2 3-2 3 0 4 2 4 4M9 19c0 1 1 2 3 2 3 0 4-2 4-4"
            />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
            editor.isActive("bulletList") ? "bg-gray-300" : ""
          }`}
          title="Bullet List"
          type="button"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <line x1="9" y1="6" x2="20" y2="6" strokeWidth={2} />
            <line x1="9" y1="12" x2="20" y2="12" strokeWidth={2} />
            <line x1="9" y1="18" x2="20" y2="18" strokeWidth={2} />
            <circle cx="5" cy="6" r="1" fill="currentColor" />
            <circle cx="5" cy="12" r="1" fill="currentColor" />
            <circle cx="5" cy="18" r="1" fill="currentColor" />
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
            editor.isActive("orderedList") ? "bg-gray-300" : ""
          }`}
          title="Numbered List"
          type="button"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <line x1="10" y1="6" x2="21" y2="6" strokeWidth={2} />
            <line x1="10" y1="12" x2="21" y2="12" strokeWidth={2} />
            <line x1="10" y1="18" x2="21" y2="18" strokeWidth={2} />
            <text x="4" y="8" fontSize="10" fill="currentColor">
              1
            </text>
            <text x="4" y="14" fontSize="10" fill="currentColor">
              2
            </text>
            <text x="4" y="20" fontSize="10" fill="currentColor">
              3
            </text>
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
            editor.isActive("blockquote") ? "bg-gray-300" : ""
          }`}
          title="Quote"
          type="button"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
          type="button"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
          type="button"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
            />
          </svg>
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Character/Word Count */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <p className="text-xs text-gray-500">
          {editor.storage.characterCount?.characters() || 0} characters ·{" "}
          {editor.storage.characterCount?.words() || 0} words
        </p>
      </div>
    </div>
  );
}
