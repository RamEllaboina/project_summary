# AI Code Analyzer Backend

This is the orchestration backend for the AI Code Analyzer system. It handles project uploads, job processing, and communication with the Python analysis service.

## Project Structure

```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── jobs/            # Background job processors
│   ├── middlewares/     # Express middlewares (auth, upload, errors)
│   ├── models/          # Mongoose models
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic (file handling, external APIs)
│   ├── utils/           # Helper classes/functions
│   ├── app.js           # Express app setup
│   └── server.js        # Entry point
├── storage/             # Local file storage for uploads/extracted files
├── .env                 # Environment variables
└── package.json
```

## Setup & Run

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Ensure `.env` exists with correct values:
   ```env
   PORT=3000
   DATABASE_LOCAL=mongodb://localhost:27017/ai-code-analyzer
   ANALYZER_URL=http://localhost:5000/analyze
   ```

3. **Start MongoDB**
   Make sure your local MongoDB instance is running.

4. **Run Server**
   ```bash
   # Development mode
   npm run dev

   # Production start
   npm start
   ```

## API Endpoints

- **POST** `/api/upload`
  - Body: `form-data` with key `project` (zip file)
  - Returns: `{ projectId: "uuid..." }`

- **GET** `/api/status/:projectId`
  - Returns: `{ status: "processing" | "completed" | ... }`

- **GET** `/api/report/:projectId`
  - Returns: `{ report: { ... } }`
