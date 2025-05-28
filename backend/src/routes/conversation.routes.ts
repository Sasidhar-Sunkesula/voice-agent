import { Router } from "express";
import { prisma } from "../client";
import voiceAgentService from "../services/voice-agent.service";

const router = Router();

// Get all conversations
router.get("/", async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        candidate: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Get conversation by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await prisma.conversation.findUnique({
      where: { id: Number(id) },
      include: {
        candidate: true,
      },
    });

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// Process voice input
router.post("/process-voice", async (req, res) => {
  try {
    const { candidateId, audioBuffer, context } = req.body;

    if (!candidateId) {
      res
        .status(400)
        .json({ error: "Candidate ID is required" });
      return;
    }

    // If audioBuffer is provided, try to convert speech to text
    // Otherwise, use a default message
    let transcript = "I couldn't process the audio. Please use text input instead.";
    if (audioBuffer) {
      try {
        transcript = await voiceAgentService.speechToText(
          Buffer.from(audioBuffer)
        );
      } catch (error) {
        console.error("Error processing speech to text:", error);
      }
    }

    // Process dialogue
    const { response, entities, nextStage } = await voiceAgentService.processDialogue(
      Number(candidateId),
      transcript,
      context
    );

    // Save conversation
    await voiceAgentService.saveConversation(
      Number(candidateId),
      transcript,
      entities
    );

    // Book appointment if available date and time are provided
    let appointment = null;
    if (
      context.stage === "availability" &&
      entities.availableDate &&
      entities.availableTime &&
      context.jobId
    ) {
      // Parse date and time
      const dateTimeStr = `${entities.availableDate} ${entities.availableTime}`;
      const dateTime = new Date(dateTimeStr);

      if (!isNaN(dateTime.getTime())) {
        appointment = await voiceAgentService.bookAppointment(
          Number(context.jobId),
          Number(candidateId),
          dateTime
        );
      }
    }

    res.json({
      transcript,
      response,
      entities,
      appointment,
      nextStage,
    });
  } catch (error) {
    console.error("Error processing voice input:", error);
    res.status(500).json({ error: "Failed to process voice input" });
  }
});

// Process text input (core endpoint)
router.post("/process-text", async (req, res) => {
  try {
    const { candidateId, text, context } = req.body;
    if (!candidateId || !text) {
      res.status(400).json({ error: "Candidate ID and text are required" });
      return;
    }
    // Load context: candidate, job
    const candidate = await prisma.candidate.findUnique({ where: { id: Number(candidateId) } });
    const job = context.jobId ? await prisma.job.findUnique({ where: { id: Number(context.jobId) } }) : null;
    const enhancedContext = {
      ...context,
      candidateName: candidate?.name,
      jobDescription: job?.description,
      companyName: "YourCompany"
    };
    // Process dialogue
    const { response, entities, nextStage } = await voiceAgentService.processDialogue(
      Number(candidateId),
      text,
      enhancedContext
    );
    res.json({ text, response, entities, nextStage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process text input" });
  }
});

export default router;
