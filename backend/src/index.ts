import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
// Body parser middleware
app.use(express.json());
const port = process.env.PORT || 9000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Voice Agent Interview Scheduling API");
});

// API Routes
app.use("/api", routes);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
