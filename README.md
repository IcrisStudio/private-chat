# Private Chat App

A modern, secure private messaging application built with Next.js, Convex, and shadcn/ui.

## Features

- 🔐 **Authentication**: Simple username/password signup and login
- 💬 **Real-time Chat**: Instant messaging with real-time updates
- 🎨 **Theme Toggle**: Light/dark mode support
- 📱 **Mobile Responsive**: Works seamlessly on mobile and desktop
- 🖼️ **Media Support**: Send images and videos
- 🔒 **One-Time View**: Secure one-time view option for media (10-second viewing)
- 🎤 **Voice Messages**: Record and send voice messages
- 👥 **Friend Requests**: Send and accept friend requests before chatting
- 🎭 **Chat Themes**: Choose from multiple chat background themes
- ✅ **Message Indicators**: See sent, delivered, and read status
- 🟢 **Online Status**: See when users are online
- 🗑️ **Chat Management**: Delete and rename chats

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Convex account (free tier available)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd private-chat-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up Convex:
```bash
npx convex dev
```
This will:
- Create a new Convex project (if you don't have one)
- Generate the necessary Convex files
- Provide you with a deployment URL

4. Configure environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_CONVEX_URL=your_convex_url_here
```
Replace `your_convex_url_here` with the URL provided by Convex.

5. Push Convex schema:
```bash
npx convex deploy
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Sign Up / Login
1. Visit the home page
2. Enter your username and password
3. Optionally add an email address
4. Toggle between login and signup modes

### Starting a Chat
1. Click the "+" button in the chat list
2. Search for a user by username
3. Click "Message" to send a friend request or start chatting
4. If a friend request is sent, wait for acceptance
5. Once accepted, you can start chatting

### Sending Messages
- **Text**: Type your message and press Enter or click Send
- **Images**: Click the image icon or drag and drop
- **Videos**: Click the video icon or drag and drop
- **Voice**: Hold the microphone button to record

### One-Time View
- When sending media, check the "One-time view" option
- The recipient can view the content only once for 10 seconds
- After viewing, the content is no longer accessible

### Chat Settings
- Click the menu (three dots) in the chat header
- Rename the chat
- Choose a chat theme
- Delete the chat

### Managing Friend Requests
- View pending friend requests at the top of the chat list
- Click "✓" to accept or "✗" to block

## Tech Stack

- **Framework**: Next.js 16
- **Database**: Convex
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **File Upload**: React Dropzone

## Project Structure

```
├── app/
│   ├── (auth)/
│   ├── chat/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── chat/
│   │   ├── chat-list.tsx
│   │   ├── chat-settings.tsx
│   │   ├── chat-window.tsx
│   │   ├── friend-requests.tsx
│   │   ├── one-time-media-viewer.tsx
│   │   └── user-search.tsx
│   ├── providers/
│   ├── ui/
│   └── theme-toggle.tsx
├── convex/
│   ├── auth.ts
│   ├── chats.ts
│   ├── friendRequests.ts
│   └── schema.ts
├── hooks/
└── lib/
```

## Important Notes

⚠️ **Security**: This app stores passwords in plain text for simplicity. In production, you should:
- Hash passwords using bcrypt or similar
- Implement proper authentication tokens
- Use HTTPS
- Add rate limiting
- Implement proper input validation

⚠️ **Media Storage**: Currently, media files are stored as base64 in the database. For production:
- Use Convex file storage or external storage (S3, Cloudinary)
- Implement file size limits
- Add image/video compression

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
