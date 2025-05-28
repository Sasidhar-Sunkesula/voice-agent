import { prisma } from "../client";

interface EntityExtraction {
  noticePeriod?: number;
  currentCtc?: number;
  expectedCtc?: number;
  availableDate?: string;
  availableTime?: string;
  isInterested?: boolean;
  isConfirmed?: boolean; // Added for schedule confirmation
}

class VoiceAgentService {
  // Text-to-Speech simplified implementation
  async textToSpeech(text: string): Promise<Buffer> {
    console.log("TTS requested for text:", text);
    return Buffer.from(text);
  }

  // Speech-to-Text simplified implementation
  async speechToText(audioBuffer: Buffer): Promise<string> {
    console.log("STT requested with buffer size:", audioBuffer.length);
    return "I couldn't process the audio. Please use text input instead.";
  }

  // Dialogue management using NLP
  async processDialogue(
    candidateId: number,
    text: string,
    context: {
      stage: string;
      entities?: EntityExtraction;
      jobId?: number;
      candidateName?: string;
      companyName?: string;
      jobDescription?: string;
    } = { stage: "greeting", entities: {} }
  ): Promise<{
    response: string;
    entities: EntityExtraction;
    nextStage: string;
  }> {
    // ***** DIAGNOSTIC LOG 1: Check what entities are coming INTO this function call *****
    console.log(
      `[${context.stage}] RAW context.entities received:`,
      JSON.stringify(context.entities)
    );

    const stage = context.stage;
    let response = "";
    // Defensive copy of context.entities to ensure prevEntities is not affected by external modifications to context.entities
    const prevEntities = context.entities ? { ...context.entities } : {};
    const newEntities = this.extractEntities(text, stage); // Pass stage for context

    // ***** DIAGNOSTIC LOG 2: Check prevEntities and newEntities before merge *****
    console.log(
      `[${stage}] prevEntities (after copy):`,
      JSON.stringify(prevEntities)
    );
    console.log(
      `[${stage}] newEntities from extractEntities:`,
      JSON.stringify(newEntities)
    );

    // Entity merging logic
    const entities: EntityExtraction = { ...prevEntities };
    Object.keys(newEntities).forEach((key) => {
      const entityKey = key as keyof EntityExtraction;
      if (newEntities[entityKey] !== undefined) {
        (entities as any)[entityKey] = newEntities[entityKey];
      }
    });

    // ***** DIAGNOSTIC LOG 3: Check entities after merge, before switch statement *****
    console.log(
      `[${stage}] Merged entities (before switch):`,
      JSON.stringify(entities)
    );

    let nextStage = stage;

    const reprompt = (message: string) => {
      response = message;
      nextStage = stage;
    };

    switch (stage) {
      case "greeting":
        response = `Hello ${context.candidateName || ""}, this is ${
          context.companyName || ""
        } regarding a ${
          context.jobDescription || ""
        } opportunity. Are you interested in this role?`;
        nextStage = "interest";
        break;

      case "interest":
        if (entities.isInterested === undefined) {
          reprompt("Did you get that? Are you interested? Yes or No?");
        } else if (entities.isInterested) {
          response = "Great! What is your current notice period in days?";
          nextStage = "notice_period";
        } else {
          response = "Thank you. We will keep your profile. Goodbye.";
          nextStage = "end";
        }
        break;

      case "notice_period":
        if (entities.noticePeriod === undefined) {
          reprompt("Could you please specify your notice period in days?");
        } else {
          response = "Can you share your current CTC and expected CTC?";
          nextStage = "ctc";
        }
        break;

      case "ctc":
        if (!entities.currentCtc || !entities.expectedCtc) {
          reprompt("Please tell me your current and expected CTC.");
        } else {
          response =
            "When are you available for an interview? Please give a date (e.g., June 5 2025).";
          nextStage = "availability";
        }
        break;

      case "availability":
        if (!entities.availableDate) {
          reprompt(
            "Please provide a date for your availability, e.g., June 5 2025."
          );
        } else {
          response = `Got the date: ${entities.availableDate}. At what time?`;
          nextStage = "availability_time";
        }
        break;

      case "availability_time":
        if (!entities.availableTime) {
          reprompt(
            "Please provide a time for your availability, e.g., 11:00 AM."
          );
        } else {
          // ***** DIAGNOSTIC LOG 4: Check availableDate just before formatting it *****
          console.log(
            `[${stage}] entities.availableDate for formatDateForConfirmation: "${entities.availableDate}"`
          );
          const confirmDate = this.formatDateForConfirmation(
            entities.availableDate
          );
          response = `We've scheduled your interview on ${confirmDate} at ${entities.availableTime}. Is that correct?`;
          nextStage = "confirmation";
        }
        break;

      case "confirmation":
        if (entities.isConfirmed === undefined) {
          reprompt(
            "Please confirm. Is the scheduled date and time correct? Yes or No?"
          );
        } else if (entities.isConfirmed) {
          console.log(
            "Before parsing - availableDate:", // Existing log
            entities.availableDate,
            "availableTime:",
            entities.availableTime
          );

          const appointmentDateTime = this.parseAppointmentDateTime(
            entities.availableDate,
            entities.availableTime
          );

          if (appointmentDateTime) {
            const jobId = context.jobId ?? 1;
            await this.bookAppointment(jobId, candidateId, appointmentDateTime);
            const formattedDateTime = appointmentDateTime.toLocaleString(
              "en-US",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              }
            );
            response = `Perfect! Your interview is booked on ${formattedDateTime}. Do you have any questions about the role?`;
            nextStage = "questions";
          } else {
            console.log(
              "Parsing failed, current entities:",
              JSON.stringify(entities)
            ); // Log full entities
            response =
              "I had trouble parsing the date and time. Could you please provide the date and time again?";
            nextStage = "availability";
            // Clear specific entities for re-entry
            entities.availableDate = undefined;
            entities.availableTime = undefined;
            entities.isConfirmed = undefined; // Also clear confirmation status
          }
        } else {
          // User said "No" to confirmation
          response = "Okay, please suggest another date and time.";
          nextStage = "availability";
          // Clear specific entities for re-entry
          entities.availableDate = undefined;
          entities.availableTime = undefined;
          entities.isConfirmed = undefined; // Also clear confirmation status
        }
        break;

      case "questions":
        const q = text.toLowerCase();
        if (q.includes("role"))
          response =
            context.jobDescription ||
            "Details about the role can be discussed during the interview.";
        else if (q.includes("salary"))
          response =
            "Salary is based on experience and will be discussed further.";
        else if (q.includes("location"))
          response =
            "Location details can be found in the job description or discussed during the interview.";
        else
          response =
            "Thank you for your questions. We look forward to speaking with you.";
        nextStage = "end";
        break;

      default:
        response = "Sorry, I did not understand. Could you repeat?";
        nextStage = stage;
    }

    // ***** DIAGNOSTIC LOG 5: Check entities being returned from this function call *****
    console.log(
      `[${stage}] Entities being returned:`,
      JSON.stringify(entities)
    );
    await this.saveConversation(candidateId, text, entities); // Save the final state of entities for this turn
    return { response, entities, nextStage };
  }

  // Helper method to format date for confirmation display
  private formatDateForConfirmation(dateStr?: string): string {
    if (!dateStr) return "the scheduled date";

    try {
      let cleanDateStr = dateStr.replace(/(\d+)(st|nd|rd|th)/g, "$1");

      let parsedDate = new Date(cleanDateStr);

      if (isNaN(parsedDate.getTime()) && !/\d{4}/.test(cleanDateStr)) {
        // If parsing failed and no year, try adding current year
        const yearSeparator = cleanDateStr.trim().includes(" ") ? " " : ""; // Add space if month and day already have one
        cleanDateStr = cleanDateStr + yearSeparator + new Date().getFullYear();
        parsedDate = new Date(cleanDateStr);
      }

      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    } catch (error) {
      console.error(
        "Date formatting error:",
        error,
        "Original date string:",
        dateStr
      );
    }
    // Fallback to a cleaned version of the original string if robust parsing fails
    return dateStr.replace(/(\d+)(st|nd|rd|th)/g, "$1");
  }

  // Helper method to parse appointment date and time into a Date object
  private parseAppointmentDateTime(
    dateStr?: string,
    timeStr?: string
  ): Date | null {
    if (!dateStr || !timeStr) {
      console.log("Missing date or time for parsing:", { dateStr, timeStr });
      return null;
    }

    try {
      let cleanDateStr = dateStr.replace(/(\d+)(st|nd|rd|th)/g, "$1");
      let cleanTimeStr = timeStr
        .replace(/\./g, "") // Remove all periods first
        .replace(/AM/i, " AM") // Standardize AM/PM with a leading space
        .replace(/PM/i, " PM")
        .trim(); // Trim whitespace

      // If no year in date, add current year (check if already has 4 digits for year)
      if (!/\d{4}/.test(cleanDateStr)) {
        const yearSeparator = cleanDateStr.trim().includes(" ") ? " " : "";
        cleanDateStr = cleanDateStr + yearSeparator + new Date().getFullYear();
      }

      const combinedStr = `${cleanDateStr} ${cleanTimeStr}`;
      console.log("Attempting to parse combined DateTime:", combinedStr);

      let parsedDate = new Date(combinedStr);

      if (!isNaN(parsedDate.getTime())) {
        console.log("Successfully parsed date:", parsedDate.toISOString());
        return parsedDate;
      }

      // Fallback for different orders or more flexible parsing if needed could go here
      // For example, trying common non-standard formats or libraries like date-fns or moment.js if complexity increases
      // For now, relying on Date constructor's flexibility.

      console.log(
        "Failed to parse date-time combination with Date constructor directly:",
        combinedStr
      );
    } catch (error) {
      console.error("DateTime parsing error:", error, "Originals:", {
        dateStr,
        timeStr,
      });
    }

    return null;
  }

  // Entity extraction with stage context
  private extractEntities(text: string, stage?: string): EntityExtraction {
    const entities: EntityExtraction = {}; // Initialize a new object for new entities

    // Extract notice period
    const noticePeriodMatch = text.match(
      /\b(\d+)\s*(day|days|month|months)\b/i
    );
    if (noticePeriodMatch) {
      const value = parseInt(noticePeriodMatch[1]);
      const unit = noticePeriodMatch[2].toLowerCase();
      entities.noticePeriod = unit.includes("month") ? value * 30 : value;
    }

    if (entities.noticePeriod === undefined && stage === "notice_period") {
      const numOnlyMatch = text.match(/^\s*(\d+)\s*$/);
      if (numOnlyMatch) {
        entities.noticePeriod = parseInt(numOnlyMatch[1], 10);
      }
    }

    // Extract CTC values
    const ctcMatches = text.match(/\b(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lpa)\b/gi);
    if (ctcMatches) {
      const extractNumericValue = (ctcStr: string) =>
        parseFloat(ctcStr.match(/\d+(?:\.\d+)?/)?.[0] || "0") * 100000;
      if (ctcMatches.length >= 1)
        entities.currentCtc = extractNumericValue(ctcMatches[0]);
      if (ctcMatches.length >= 2)
        entities.expectedCtc = extractNumericValue(ctcMatches[1]);
      // If only one CTC match and we expect two, try to assign based on keywords or order if possible
      // This part can be more sophisticated if needed
    }

    if (stage === "ctc" && (!entities.currentCtc || !entities.expectedCtc)) {
      const numbers = text.match(/\b\d+(?:\.\d+)?\b/g)?.map(Number);
      if (numbers) {
        if (numbers.length === 1) {
          // If only one number given
          if (
            !entities.currentCtc &&
            (text.toLowerCase().includes("current") ||
              !text.toLowerCase().includes("expected"))
          ) {
            entities.currentCtc = numbers[0] * 100000;
          } else if (
            !entities.expectedCtc &&
            text.toLowerCase().includes("expected")
          ) {
            entities.expectedCtc = numbers[0] * 100000;
          }
        } else if (numbers.length >= 2) {
          if (!entities.currentCtc) entities.currentCtc = numbers[0] * 100000;
          if (!entities.expectedCtc) entities.expectedCtc = numbers[1] * 100000;
        }
      }
    }

    // Only extract date/time if we're in the relevant stages
    // This ensures we don't accidentally overwrite previously extracted date/time
    // when processing text for other entity types (e.g., confirmation "yes")
    if (stage === "availability") {
      // Only extract date in availability stage
      this.extractDate(text, entities);
    } else if (stage === "availability_time") {
      // Only extract time in availability_time stage
      this.extractTime(text, entities);
      // Check if date was also provided along with time in this stage.
      // This handles cases where user says "June 5th at 10 AM" when asked only for time.
      if (!entities.availableDate) {
        // If extractTime didn't also get a date from a combined phrase
        this.extractDate(text, entities); // Try to extract date
      }
    }

    if (stage === "interest") {
      entities.isInterested = this.extractYesNo(text);
    } else if (stage === "confirmation") {
      entities.isConfirmed = this.extractYesNo(text);
    }

    console.log(
      "Extracted entities for stage",
      stage,
      ":",
      JSON.stringify(entities)
    ); // Log the NEWLY extracted entities for this turn
    return entities;
  }

  private extractDate(text: string, entities: EntityExtraction): void {
    // Pattern 1: Month Day Year (e.g., "June 5 2025", "June 5th 2025")
    let dateMatch = text.match(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}|\d{2}))?\b/i
    );
    if (dateMatch) {
      const month = dateMatch[1];
      const day = dateMatch[2];
      let year = dateMatch[3];
      if (year && year.length === 2) year = `20${year}`; // Convert YY to YYYY
      entities.availableDate = `${month} ${day}${year ? " " + year : ""}`; // Year is optional for now, parser will add current if missing
      console.log("Extracted date (Pattern 1):", entities.availableDate);
      return;
    }

    // Pattern 2: Day Month Year (e.g., "5 June 2025", "5th June 2025")
    dateMatch = text.match(
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+(\d{4}|\d{2}))?\b/i
    );
    if (dateMatch) {
      const day = dateMatch[1];
      const month = dateMatch[2];
      let year = dateMatch[3];
      if (year && year.length === 2) year = `20${year}`;
      entities.availableDate = `${month} ${day}${year ? " " + year : ""}`;
      console.log("Extracted date (Pattern 2):", entities.availableDate);
      return;
    }

    // Pattern 3: MM/DD/YYYY or MM-DD-YYYY (and variants with YY)
    dateMatch = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
    if (dateMatch) {
      const m = parseInt(dateMatch[1], 10);
      const d = parseInt(dateMatch[2], 10);
      let y = parseInt(dateMatch[3], 10);
      if (y < 100) y += 2000; // YY to YYYY

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      if (m >= 1 && m <= 12) {
        entities.availableDate = `${monthNames[m - 1]} ${d} ${y}`;
        console.log(
          "Extracted date (Pattern 3 - Slah/Dash):",
          entities.availableDate
        );
        return;
      }
    }

    // Pattern 4: Short month names (Jan, Feb, etc.)
    dateMatch = text.match(
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}|\d{2}))?\b/i
    );
    if (dateMatch) {
      const monthMap: { [key: string]: string } = {
        Jan: "January",
        Feb: "February",
        Mar: "March",
        Apr: "April",
        May: "May",
        Jun: "June",
        Jul: "July",
        Aug: "August",
        Sep: "September",
        Oct: "October",
        Nov: "November",
        Dec: "December",
      };
      const month =
        monthMap[
          dateMatch[1].charAt(0).toUpperCase() +
            dateMatch[1].slice(1).toLowerCase()
        ]; // Standardize case for map lookup
      const day = dateMatch[2];
      let year = dateMatch[3];
      if (year && year.length === 2) year = `20${year}`;
      entities.availableDate = `${month} ${day}${year ? " " + year : ""}`;
      console.log(
        "Extracted date (Pattern 4 - Short Month):",
        entities.availableDate
      );
      return;
    }

    // Pattern 5: Combined date-time like "June 5th 2025 at 10:00 a.m." - extract date part
    dateMatch = text.match(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}|\d{2}))?\s+(?:at|@)\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/i
    );
    if (dateMatch) {
      const month = dateMatch[1];
      const day = dateMatch[2];
      let year = dateMatch[3];
      if (year && year.length === 2) year = `20${year}`;
      entities.availableDate = `${month} ${day}${year ? " " + year : ""}`;
      // Time will be extracted by extractTime if called in the same pass
      console.log(
        "Extracted date (Pattern 5 - Combined):",
        entities.availableDate
      );
      // No return here, as extractTime might also need to run on the same text if called from extractEntities.
    }
  }

  private extractTime(text: string, entities: EntityExtraction): void {
    // Pattern: HH:MM AM/PM or HH AM/PM (more specific for start of word/after space)
    const timeMatch = text.match(
      /\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\b/i
    );
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3].replace(/\./g, "").toUpperCase(); // Standardize to AM/PM
      entities.availableTime = `${hour}:${minute
        .toString()
        .padStart(2, "0")} ${period}`;
      console.log("Extracted time:", entities.availableTime);
    }
  }

  private extractYesNo(text: string): boolean | undefined {
    const lowerText = text.toLowerCase().trim();
    const positiveWords = [
      "yes",
      "yeah",
      "yep",
      "sure",
      "definitely",
      "correct",
      "right",
      "ok",
      "okay",
      "ya",
      "confirm",
    ];
    const negativeWords = [
      "no",
      "nope",
      "not",
      "incorrect",
      "wrong",
      "don't",
      "do not",
    ];

    for (const word of positiveWords) {
      if (new RegExp(`\\b${word}\\b`).test(lowerText)) return true;
    }
    for (const word of negativeWords) {
      if (new RegExp(`\\b${word}\\b`).test(lowerText)) return false;
    }
    return undefined;
  }

  async saveConversation(
    candidateId: number,
    transcript: string,
    entities: EntityExtraction
  ): Promise<void> {
    try {
      await prisma.conversation.create({
        data: {
          candidateId,
          transcript,
          entitiesExtracted: JSON.stringify(entities),
        },
      });
    } catch (error) {
      console.error("Error saving conversation:", error);
      // Not throwing, as failing to save shouldn't break the agent's flow.
      // Consider a more robust error handling/logging strategy for production.
    }
  }

  async bookAppointment(
    jobId: number,
    candidateId: number,
    dateTime: Date
  ): Promise<any> {
    try {
      return await prisma.appointment.create({
        data: {
          jobId,
          candidateId,
          dateTime,
          status: "scheduled",
        },
        include: {
          job: true,
          candidate: true,
        },
      });
    } catch (error) {
      console.error("Error booking appointment:", error);
      throw new Error("Failed to book appointment");
    }
  }
}

export default new VoiceAgentService();
