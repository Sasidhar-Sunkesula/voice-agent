# Voice Agent System

A voice-based interview scheduling system using Mycroft for voice interaction and a TypeScript/Node.js backend.

## System Architecture

- **Backend**: Node.js/TypeScript with Express API and Prisma ORM
- **Frontend**: React with Vite
- **Voice Agent**: Mycroft skill for voice interaction

## Key Features

- Voice-based interview scheduling
- Conversation flow: greeting → interest → notice period → CTC → availability → confirmation → questions
- Entity extraction for interview parameters (notice period, CTC, availability)
- Appointment booking with database integration
- Browser-based voice agent simulation

## Installation

### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run init-db
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Mycroft Skill

1. Install Mycroft following the [official installation guide](https://mycroft-ai.gitbook.io/docs/using-mycroft-ai/get-mycroft/linux)

2. Install the voice agent skill:

```bash
mycroft-msm install https://github.com/yourusername/voice-agent-skill
# or copy the mycroft directory to ~/.mycroft/skills/voice-agent-skill
cp -r voice-agent-scripts/mycroft ~/.mycroft/skills/voice-agent-skill
```

3. Restart Mycroft:

```bash
mycroft-start restart
```

## Usage

1. Start the backend server
2. Start the frontend development server
3. Access the frontend at http://localhost:5173
4. Use the voice agent simulation or interact with Mycroft

## Implementation Notes

- The backend voice agent service uses simplified speech processing without external dependencies
- The system supports both voice and text-based interaction
- Mycroft skill integrates with the backend API for conversation processing
- Frontend includes a browser-based voice agent simulation using Web Speech API