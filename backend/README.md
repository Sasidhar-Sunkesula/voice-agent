# Voice Agent Backend

This is the backend service for the Voice Agent Interview Scheduling System. It provides APIs for managing jobs, candidates, appointments, and voice-based interactions.

## Features

- Job management (CRUD operations)
- Candidate management (CRUD operations)
- Appointment scheduling
- Voice-based interactions with candidates
- Text-to-Speech and Speech-to-Text processing
- Entity extraction from conversations

## Prerequisites

- Node.js (v16 or higher)
- MySQL database
- (Optional) Mozilla TTS server for text-to-speech
- (Optional) Vosk for speech-to-text

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file with your database credentials and other configurations.

4. Initialize the database:

```bash
npx prisma migrate dev --name init
```

5. Build the application:

```bash
npm run build
```

6. Start the server:

```bash
npm start
```

## API Endpoints

### Jobs

- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create a new job
- `PUT /api/jobs/:id` - Update a job
- `DELETE /api/jobs/:id` - Delete a job

### Candidates

- `GET /api/candidates` - Get all candidates
- `GET /api/candidates/:id` - Get candidate by ID
- `POST /api/candidates` - Create a new candidate
- `PUT /api/candidates/:id` - Update a candidate
- `DELETE /api/candidates/:id` - Delete a candidate
- `GET /api/candidates/:id/conversations` - Get candidate conversations

### Appointments

- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create a new appointment
- `PUT /api/appointments/:id` - Update an appointment
- `DELETE /api/appointments/:id` - Delete an appointment
- `GET /api/appointments/job/:jobId` - Get appointments by job ID
- `GET /api/appointments/candidate/:candidateId` - Get appointments by candidate ID

### Conversations

- `GET /api/conversations` - Get all conversations
- `GET /api/conversations/:id` - Get conversation by ID
- `POST /api/conversations/process-voice` - Process voice input
- `POST /api/conversations/process-text` - Process text input (for testing)

## Voice Agent Workflow

The voice agent follows a structured conversation flow:

1. **Greeting**: Introduction and checking interest in the job
2. **Interest**: Capturing candidate's interest
3. **Notice Period**: Asking about notice period
4. **CTC**: Asking about current and expected CTC
5. **Availability**: Scheduling an interview
6. **Confirmation**: Confirming the appointment
7. **Questions**: Answering candidate questions

## Development

### Adding New Features

To add new features or modify existing ones:

1. Update the Prisma schema if needed
2. Generate Prisma client:

```bash
npx prisma generate
```

3. Create or modify routes in the `src/routes` directory
4. Update services in the `src/services` directory
