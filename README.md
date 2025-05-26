# Focus0 - YouTube Study Tool 🎯

*Made with ❤️ by [devmnn](https://github.com/manan0209)*

Focus0 is a next-generation web application that transforms YouTube into a laser-focused study tool, creating a distraction-free environment for watching educational content with built-in focus tracking and productivity features.

## ✨ Latest Updates (v1.1)

### 🎮 Enhanced Video Controls
- **Playback Speed Control**: 8 speed options from 0.25x to 2x
- **Smart Seeking**: Jump forward/backward 10 seconds
- **Caption Support**: Toggle video captions on/off
- **Improved Fullscreen**: Enhanced fullscreen experience with proper enter/exit
- **Clickable Progress Bar**: Jump to any point in the video
- **Auto-hiding Controls**: Controls fade after 3 seconds of inactivity

### ⌨️ Keyboard Shortcuts
- **Space/K**: Play/Pause video
- **← →**: Seek backward/forward 10 seconds
- **M**: Toggle mute
- **F**: Toggle fullscreen
- **C**: Toggle captions
- **1-9**: Jump to 10%-90% of video
- **< >**: Decrease/increase playback speed
- **?**: Show keyboard shortcuts help

### 📱 Responsive Design
- **MacBook Air 13" Optimized**: Perfect layout for smaller laptop screens
- **Mobile-Friendly**: Responsive design works on all devices
- **Adaptive Sidebar**: Sidebar stacks on mobile, side-by-side on desktop
- **Smart Breakpoints**: Uses xl: breakpoints for better laptop compatibility

## 🎯 Key Features

### 📺 Distraction-Free Video Experience
- Clean, fullscreen YouTube player integration
- No recommendations, comments, or sidebar clutter
- Embedded player with custom controls
- Support for both individual videos and playlists

### 🎯 Focus Tracking
- Dynamic focus bar that tracks window activity
- Visual progress indicators and streak counting
- Automatic session pause when window loses focus
- Real-time focus time calculation

### ⏰ Pomodoro Timer Integration
- Configurable work/break intervals (default: 25min work, 5min short break, 15min long break)
- Audio notifications for phase transitions
- Customizable settings with modal interface
- Automatic cycle management

### 💾 Session Management
- LocalStorage-backed session persistence
- Create, save, and resume study sessions
- Session sharing via unique URLs
- Quick access to saved sessions

### 🎨 Modern UI/UX
- Beautiful dark mode interface
- Responsive design for all screen sizes
- Glass morphism effects and smooth animations
- Accessible keyboard navigation

### 🔔 Smart Notifications
- Browser-based notifications for Pomodoro phase transitions
- Non-intrusive focus time alerts
- Session completion notifications

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lf0
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### YouTube API Configuration (Optional)

For **real playlist content** instead of placeholder videos, configure the YouTube Data API:

1. **Get a YouTube API Key**
   - Visit [Google Cloud Console](https://console.developers.google.com/)
   - Create a new project or select existing one
   - Enable "YouTube Data API v3"
   - Create credentials (API Key)
   - Restrict the key to YouTube Data API v3 (recommended)

2. **Configure Environment Variables**
   ```bash
   # Create .env.local file in project root
   cp .env.local.example .env.local
   
   # Add your API key
   NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

3. **Restart Development Server**
   ```bash
   npm run dev
   ```

**Note**: Without API configuration, playlists will show placeholder content. Individual videos work without API keys.

### Building for Production

```bash
npm run build
npm start
```

### 🚀 Deployment

For detailed deployment instructions including Vercel setup, environment variables, and troubleshooting, see our comprehensive [Deployment Guide](./DEPLOYMENT.md).

## 🛠️ Technical Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom dark theme
- **Icons**: Lucide React icon library
- **YouTube Integration**: react-youtube library
- **State Management**: React hooks with LocalStorage persistence
- **Build Tools**: ESLint, PostCSS

## 📖 Usage Guide

### Creating a Study Session

1. **Enter Session Name**: Give your study session a descriptive name
2. **Add YouTube Content**: 
   - Paste individual video URLs
   - Add entire playlist URLs
   - Mix and match videos and playlists
3. **Start Studying**: Click "Start Session" to enter focus mode

### During Study Sessions

- **Focus Tracking**: Keep the window focused to maintain your focus streak
- **Pomodoro Timer**: Use the built-in timer for structured study sessions
- **Video Controls**: Use mouse or keyboard shortcuts for seamless control
- **Progress Monitoring**: Track your study time and video completion

### Keyboard Shortcuts

| Action | Shortcut | Alternative |
|--------|----------|-------------|
| Play/Pause | `Space` | `K` |
| Seek Backward | `←` | |
| Seek Forward | `→` | |
| Toggle Mute | `M` | |
| Toggle Fullscreen | `F` | |
| Toggle Captions | `C` | |
| Jump to Percentage | `1-9` | (10%-90%) |
| Decrease Speed | `,` | |
| Increase Speed | `.` | |
| Show Help | `?` | |

## 🚀 Feature Roadmap

Check out our comprehensive [Feature Roadmap](./FEATURE_ROADMAP.md) for upcoming enhancements including:
- 📊 Study analytics and progress tracking
- 📝 Integrated note-taking with timestamps
- 🤝 Collaborative study sessions
- 🎵 Enhanced ambient sound system
- 📱 Mobile app development

## 🤝 Contributing

We welcome contributions! Please check our [Feature Roadmap](./FEATURE_ROADMAP.md) for ideas.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Submit a pull request with detailed description

### Bug Reports & Feature Requests

- 🐛 **Bug Reports**: [Create an issue](https://github.com/manan0209/focus0/issues)
- 💡 **Feature Requests**: [Start a discussion](https://github.com/manan0209/focus0/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- YouTube for providing the embedded player API
- The Next.js team for the amazing framework
- Tailwind CSS for the utility-first styling approach
- Lucide React for the beautiful icons

---

**Made with ❤️ by [devmnn](https://github.com/manan0209)**

*Transform your YouTube learning experience with Focus0* 🎓✨

1. **Enter YouTube URLs**: Paste YouTube video or playlist URLs in the input field
2. **Session Name**: Give your session a descriptive name
3. **Start Session**: Click "Start Study Session" to begin

### During a Study Session

- **Focus Bar**: Monitor your attention with the dynamic focus indicator
- **Video Controls**: Use custom player controls or navigate between videos
- **Pomodoro Timer**: Start work sessions with configurable break intervals
- **Session Stats**: Track total study time, focus time, and completed videos

### Sharing Sessions

- Click the "Share" button in any active session
- Copy the generated link to share with others
- Shared sessions maintain all videos and settings

### Managing Sessions

- **Save Sessions**: Sessions auto-save to localStorage
- **Resume Sessions**: Access saved sessions from the main page
- **Delete Sessions**: Remove old sessions to keep your list clean

---

**Built with ❤️ for focused learning**
