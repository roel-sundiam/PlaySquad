# 🎾 PlaySquad - Sports Club Matchmaking App

PlaySquad is a modern sports club management app with automated doubles matchmaking, helping players organize games, RSVP for events, and find perfectly balanced matches.

## ✨ Features

- **Club Management**: Create and join sports clubs
- **Event Scheduling**: Organize games with RSVP system
- **Automated Matchmaking**: AI-powered doubles team balancing
- **Real-time Chat**: Communicate with club members
- **Player Profiles**: Track stats and match history
- **Mobile-First Design**: Optimized for smartphones

## 🚀 Tech Stack

- **Frontend**: Angular 17+ (Mobile-responsive)
- **Backend**: Express.js + Node.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT + Social Login
- **Real-time**: WebSockets
- **Styling**: SCSS with custom design system

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Angular CLI (`npm install -g @angular/cli`)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/playsquad.git
cd playsquad
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

4. Set up environment variables:
```bash
# In backend/.env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3000
```

5. Run the development servers:

Frontend:
```bash
cd frontend
ng serve
```

Backend:
```bash
cd backend
npm run dev
```

## 🎨 Design System

PlaySquad uses a modern, professional design system optimized for mobile devices:

- **Primary Color**: #00C853 (Tennis court green)
- **Typography**: Inter & Poppins fonts
- **Spacing**: 8px grid system
- **Components**: Mobile-first, touch-friendly

## 📱 Mobile App Flow

1. **Authentication**: Login/Register
2. **Club Discovery**: Browse or create clubs
3. **Event RSVP**: Sign up for games
4. **Match Generation**: Automated team balancing
5. **Game Day**: View court assignments and teams

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- Your Name - Initial work

## 🙏 Acknowledgments

- Inspired by Reclub
- Built with Angular and Express.js