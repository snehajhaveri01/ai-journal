# Reflectly AI Journal 🧠✨

An advanced AI-powered personal journaling application built with Next.js, Firebase, and OpenAI. Transform your daily thoughts into actionable insights with emotion analysis, smart prompts, and comprehensive analytics.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Firebase](https://img.shields.io/badge/Firebase-10.0-orange)

## 🌟 Features

### Core Journaling
- **Smart Prompts**: AI-generated personalized writing prompts based on your history
- **Voice Journaling**: Speech-to-text transcription using Web Speech API
- **Rich Text Editor**: TipTap-powered editor with formatting toolbar
- **Quick Entry**: Cmd/Ctrl + Enter keyboard shortcut to save

### AI-Powered Analysis
- **8-Dimensional Emotion Analysis**: Track joy, sadness, anger, fear, surprise, disgust, anxiety, and excitement (0-100 intensity scores)
- **Sentiment Detection**: Primary and secondary sentiment classification
- **Topic Modeling**: Automatic categorization into life domains (Work, Relationships, Health, etc.)
- **Entity Extraction**: Detect mentioned people, places, and events
- **Mood Scoring**: Overall emotional valence (0-100 scale)

### Analytics & Insights
- **Analytics Dashboard**: Comprehensive visualizations of your journaling patterns
  - Total entries and average mood
  - Writing streak tracking
  - Mood distribution charts
  - Top emotions, categories, and topics
  - Mood trend analysis (improving/declining/stable)
- **Search & Filter**: Full-text search with advanced filtering by mood, category, and date range
- **Data Export**: Export your journal in JSON, Markdown, or CSV formats

### Goal Tracking
- **Personal Goals**: Create and track goals with progress indicators
- **Target Dates**: Set deadlines and monitor days remaining
- **Progress Visualization**: Beautiful progress bars and completion tracking
- **Smart Notifications**: Overdue goal detection

### UI/UX Excellence
- **Modern Design**: Clean, minimalist interface with gradient accents
- **Responsive Layout**: Works beautifully on desktop and mobile
- **Custom Modals**: Beautiful confirmation dialogs and toast notifications
- **Loading States**: Fancy animated loaders during AI processing
- **Relative Timestamps**: Human-readable time indicators ("2h ago", "3d ago")

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ai-journal.git
cd ai-journal
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Firebase Client (safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...

# Firebase Admin (server-only - keep secret!)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=service-account@...iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# OpenAI API
OPENAI_API_KEY=sk-...
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** > **Sign-in method** > **Google**
3. Create a Web app to get client configuration
4. Create Firestore database:
   - Collections: `entries`, `goals`
   - Set security rules to require authentication
5. Generate service account credentials for server-side operations

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null;
    }

    match /goals/{goalId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null;
    }
  }
}
```

## 📁 Project Structure

```
ai-journal/
├── app/
│   ├── analytics/          # Analytics dashboard page
│   ├── api/
│   │   ├── entries/        # Journal entries CRUD API
│   │   ├── export/         # Data export endpoint
│   │   └── prompts/        # Smart prompts generation
│   ├── goals/              # Goal tracking page
│   ├── journal/            # Main journaling interface
│   └── signin/             # Authentication page
├── components/
│   ├── AuthGate.tsx        # Authentication wrapper
│   ├── EmotionChart.tsx    # 8-emotion visualization
│   ├── EntryList.tsx       # Journal entries display
│   ├── ExportButton.tsx    # Data export interface
│   ├── FancyLoader.tsx     # Loading animations
│   ├── Modal.tsx           # Custom modal dialogs
│   ├── RichTextEditor.tsx  # TipTap rich text editor
│   ├── SearchFilter.tsx    # Search and filtering
│   ├── Toast.tsx           # Toast notifications
│   └── VoiceRecorder.tsx   # Voice journaling
├── lib/
│   ├── firebase/
│   │   ├── admin.ts        # Firebase Admin SDK
│   │   └── client.ts       # Firebase Client SDK
│   └── openai.ts           # OpenAI integration
└── public/                 # Static assets
```

## 🎯 Key Technologies

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI**: OpenAI GPT-4o-mini
- **Rich Text**: TipTap
- **Voice**: Web Speech API

## 📊 AI Analysis Pipeline

When you create a journal entry, the following happens:

1. **Text Submission**: Entry sent to `/api/entries` endpoint
2. **OpenAI Analysis**: GPT-4o-mini analyzes the text with structured prompt
3. **Data Extraction**:
   - Summary (1-2 sentences)
   - Overall mood (positive/neutral/negative)
   - Mood score (0-100)
   - 8 emotion scores
   - Categories (Work, Relationships, etc.)
   - Topics (specific themes)
   - Entities (people, places, events)
   - Sentiment (primary + secondary)
4. **Firestore Storage**: All analysis saved to user's entry document
5. **Real-time Update**: UI updates instantly via Firestore listeners

## 🔐 Privacy & Security

- ✅ All data encrypted in transit (HTTPS)
- ✅ Firebase authentication required for all operations
- ✅ Row-level security via Firestore rules
- ✅ Server-side API key management
- ✅ No third-party tracking or analytics
- ✅ Data export available anytime
- ✅ OpenAI API calls use ephemeral processing (no training data)

## 🌈 Customization

### Change AI Model

Edit `lib/openai.ts`:
```typescript
const res = await client.chat.completions.create({
  model: "gpt-4o-mini", // Change to "gpt-4o" for better quality
  temperature: 0.3,
  // ...
});
```

### Adjust Emotion Categories

Edit `lib/openai.ts` to modify the emotion analysis prompt or add new emotions.

### Modify UI Colors

Edit `tailwind.config.ts` to change the color scheme.

## 📝 API Endpoints

### `POST /api/entries`
Create a new journal entry with AI analysis
- **Auth**: Required (Bearer token)
- **Body**: `{ text: string }`
- **Returns**: Complete analysis with entry ID

### `GET /api/prompts`
Generate personalized smart prompt
- **Auth**: Required
- **Returns**: `{ prompt: string }`

### `GET /api/export?format=json|markdown|csv`
Export all journal entries
- **Auth**: Required
- **Query**: `format`, `startDate`, `endDate`
- **Returns**: File download

### `DELETE /api/entries/[id]`
Delete a specific entry
- **Auth**: Required
- **Returns**: Success confirmation

## 🧪 Future Enhancements

- [ ] Photo Journaling with Firebase Storage
- [ ] AI Companion Chat with RAG (Retrieval Augmented Generation)
- [ ] Dream Journal Section
- [ ] Anomaly Detection (sudden mood shifts)
- [ ] Mobile App (React Native)
- [ ] Collaborative Journaling
- [ ] PDF Export with Charts
- [ ] Weekly Email Summaries
- [ ] Dark Mode

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Use TypeScript for all new code
- Follow existing code style
- Add comments for complex logic
- Test all features before submitting PR
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-journal/issues)
- **Email**: your.email@example.com
- **Discord**: [Join our community](https://discord.gg/yourinvite)

## 🙏 Acknowledgments

- OpenAI for GPT-4o-mini API
- Firebase team for excellent backend services
- Vercel for hosting and deployment
- TipTap for the rich text editor
- All contributors and users

---

**Built with ❤️ by [Your Name]**

*Transform your thoughts into insights. One entry at a time.*
