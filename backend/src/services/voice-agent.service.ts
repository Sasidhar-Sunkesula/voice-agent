import { prisma } from "../client";

interface EntityExtraction {
  noticePeriod?: number;
  currentCtc?: number;
  expectedCtc?: number;
  availableDate?: string;
  availableTime?: string;
  isInterested?: boolean;
}

class VoiceAgentService {
  // Text-to-Speech simplified implementation
  async textToSpeech(text: string): Promise<Buffer> {
    // This is a placeholder implementation that returns a simple buffer
    // In a real implementation, you would use a TTS service or library
    console.log('TTS requested for text:', text);
    // Return an empty buffer as placeholder
    return Buffer.from(text);
  }

  // Speech-to-Text simplified implementation
  async speechToText(audioBuffer: Buffer): Promise<string> {
    // This is a placeholder implementation
    // In a real implementation, you would use an STT service or library
    console.log('STT requested with buffer size:', audioBuffer.length);
    // Return a placeholder message
    return "I couldn't process the audio. Please use text input instead.";
  }

  // Dialogue management using NLP
  async processDialogue(
    candidateId: number,
    text: string,
    context: { stage: string; entities?: EntityExtraction; jobId?: number; candidateName?: string; companyName?: string; jobDescription?: string } = { stage: 'greeting', entities: {} }
  ): Promise<{ response: string; entities: EntityExtraction; nextStage: string }> {
    // New state machine implementation
    const stage = context.stage;
    let response = '';
    const prevEntities = context.entities || {};
    const newEntities = this.extractEntities(text);
    const entities: EntityExtraction = { ...prevEntities, ...newEntities };
    let nextStage = stage;

    // Helper to reprompt on missing entity
    const reprompt = (message: string) => { response = message; nextStage = stage; };

    switch (stage) {
      case 'greeting':
        response = `Hello ${context.candidateName || ''}, this is ${context.companyName || ''} regarding a ${context.jobDescription || ''} opportunity. Are you interested in this role?`;
        nextStage = 'interest';
        break;
      case 'interest':
        if (entities.isInterested === undefined) {
          reprompt('Did you get that? Are you interested? Yes or No?');
        } else if (entities.isInterested) {
          response = 'Great! What is your current notice period in days?';
          nextStage = 'notice_period';
        } else {
          response = 'Thank you. We will keep your profile. Goodbye.';
          nextStage = 'end';
        }
        break;
      case 'notice_period':
        if (entities.noticePeriod === undefined) {
          reprompt('Could you please specify your notice period in days?');
        } else {
          response = 'Can you share your current CTC and expected CTC?';
          nextStage = 'ctc';
        }
        break;
      case 'ctc':
        if (!entities.currentCtc || !entities.expectedCtc) {
          reprompt('Please tell me your current and expected CTC.');
        } else {
          response = 'When are you available for an interview next week? Please give date and time.';
          nextStage = 'availability';
        }
        break;
      case 'availability':
        if (!entities.availableDate && !entities.availableTime) {
          reprompt('Could you repeat a specific date and time for next week?');
        } else if (entities.availableDate && !entities.availableTime) {
          response = `Got the date: ${entities.availableDate}. At what time?`;
          nextStage = 'availability';
        } else if (!entities.availableDate && entities.availableTime) {
          response = `Got the time: ${entities.availableTime}. On which day?`;
          nextStage = 'availability';
        } else {
          response = `We’ve scheduled your interview on ${entities.availableDate} at ${entities.availableTime}. Is that correct?`;
          nextStage = 'confirmation';
        }
        break;
      case 'confirmation':
        if (entities.isInterested === undefined) {
          reprompt('Please confirm. Is the scheduled date and time correct?');
        } else if (entities.isInterested) {
           // Manual parse date and time
           const year = new Date().getFullYear();
           // Parse date string, e.g. '2nd June' or 'June 2'
           const dateParts = entities.availableDate.trim().split(/\s+/);
           let dayNum = parseInt(dateParts[0], 10);
           let monthName = dateParts[1]?.toLowerCase();
           if (isNaN(dayNum)) {
             // maybe reversed 'June 2'
             monthName = dateParts[0].toLowerCase();
             dayNum = parseInt(dateParts[1], 10);
           }
           const months: Record<string, number> = { january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11 };
           const monthIdx = monthName && months[monthName] !== undefined ? months[monthName] : new Date().getMonth();
           // Parse 'HH:MM AM'
           const [timeStr, period] = entities.availableTime.split(' ');
           const [hStr, mStr] = timeStr.split(':');
           let hr = parseInt(hStr, 10);
           const mi = parseInt(mStr, 10);
           const pm = period.toLowerCase() === 'pm';
           if (pm && hr < 12) hr += 12;
           if (!pm && hr === 12) hr = 0;
           const dt = new Date(year, monthIdx, dayNum, hr, mi);
           const jobId = context.jobId ?? 1;
           try {
             await this.bookAppointment(jobId, candidateId, dt);
           } catch (bookingError) {
             console.error('Booking failed:', bookingError);
           }
           response = 'Perfect! Your interview is booked. Do you have any questions about the role?';
           nextStage = 'questions';
        } else {
          response = 'Okay, please suggest another date and time.';
          nextStage = 'availability';
        }
        break;
      case 'questions':
        // FAQ from jobDescription
        const q = text.toLowerCase();
        if (q.includes('role')) response = context.jobDescription || '';
        else if (q.includes('salary')) response = 'Salary is based on experience.';
        else if (q.includes('location')) response = 'Location details can be found in the job description.';
        else response = 'Thank you for your questions. We look forward to speaking with you.';
        nextStage = 'end';
        break;
      default:
        response = 'Sorry, I did not understand. Could you repeat?';
        nextStage = stage;
    }

    // Save conversation
    await this.saveConversation(candidateId, text, entities);

    return { response, entities, nextStage };
  }

  // Entity extraction using regex patterns
  private extractEntities(text: string): EntityExtraction {
    const entities: EntityExtraction = {};

    // Extract notice period (e.g., "30 days", "2 months")
    const noticePeriodMatch = text.match(
      /\b(\d+)\s*(day|days|month|months)\b/i
    );
    if (noticePeriodMatch) {
      const value = parseInt(noticePeriodMatch[1]);
      const unit = noticePeriodMatch[2].toLowerCase();
      entities.noticePeriod = unit.includes("month") ? value * 30 : value; // Convert to days
    }
    // Fallback: if user responds with pure number, treat it as notice period in days
    if (entities.noticePeriod === undefined) {
      const numOnlyMatch = text.match(/^\s*(\d+)\s*$/);
      if (numOnlyMatch) {
        entities.noticePeriod = parseInt(numOnlyMatch[1], 10);
      }
    }

    // Extract CTC (e.g., "10 lakh", "15 LPA", "10,00,000")
    const ctcMatch = text.match(
      /\b(\d+(?:\.\d+)?)\s*(lakh|lakhs|lpa)\b|\b(\d+(?:,\d+)*)\b/i
    );
    if (ctcMatch) {
      if (
        ctcMatch[1] &&
        (ctcMatch[2]?.toLowerCase().includes("lakh") ||
          ctcMatch[2]?.toLowerCase().includes("lpa"))
      ) {
        // Convert lakh to absolute value
        entities.currentCtc = parseFloat(ctcMatch[1]) * 100000;
      } else if (ctcMatch[3]) {
        // Remove commas and convert to number
        entities.currentCtc = parseFloat(ctcMatch[3].replace(/,/g, ""));
      }
    }

    // Extract expected CTC (looking for patterns like "expecting X" or "expected X")
    const expectedCtcMatch = text.match(
      /expect(?:ing|ed)\s*(?:is\s*)?(?:a\s*)?(?:ctc\s*(?:of\s*)?)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lpa)\b|expect(?:ing|ed)\s*(?:is\s*)?(?:a\s*)?(?:ctc\s*(?:of\s*)?)?\s*(\d+(?:,\d+)*)/i
    );
    if (expectedCtcMatch) {
      if (
        expectedCtcMatch[1] &&
        (expectedCtcMatch[2]?.toLowerCase().includes("lakh") ||
          expectedCtcMatch[2]?.toLowerCase().includes("lpa"))
      ) {
        entities.expectedCtc = parseFloat(expectedCtcMatch[1]) * 100000;
      } else if (expectedCtcMatch[3]) {
        entities.expectedCtc = parseFloat(
          expectedCtcMatch[3].replace(/,/g, "")
        );
      }
    }
    // Fallback: if expected CTC still missing, use second numeric value in text
    if (entities.expectedCtc === undefined) {
      const allNums = text.match(/\d+(?:\.\d+)?/g);
      if (allNums && allNums.length >= 2) {
        // First number likely currentCtc, second is expectedCtc
        entities.expectedCtc = parseFloat(allNums[1].replace(/,/g, ''));
      }
    }

    // Extract date (e.g., "next Monday", "on the 15th", "May 20th")
    const dateMatch = text.match(
      /\b(tomorrow|next\s+\w+|\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?\w+|\w+\s+\d{1,2}(?:st|nd|rd|th)?)\b/i
    );
    if (dateMatch) {
      entities.availableDate = dateMatch[1];
    }
    // Date fallback: numeric day-only
    if (!entities.availableDate) {
      const dayOnly = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
      if (dayOnly) {
        entities.availableDate = dayOnly[1];
      }
    }

    // Extract time (e.g., "10 AM", "2:30 PM")
    const timeMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(?:a\.?m\.?|p\.?m\.?)\b/i);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const rawPeriod = timeMatch[0].match(/(am|pm)/i);
      const period = rawPeriod ? rawPeriod[1].toLowerCase() : 'am';
      entities.availableTime = `${hour}:${minute
        .toString()
        .padStart(2, "0")} ${period.toUpperCase()}`;
    }
    // Time fallback: first HH:MM or HH MM
    if (!entities.availableTime) {
      const altTime = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(\d{2})?\b/);
      if (altTime) {
        const hr = parseInt(altTime[1]);
        const min = altTime[2] ? parseInt(altTime[2]) : (altTime[3]? parseInt(altTime[3]):0);
        entities.availableTime = `${hr}:${min.toString().padStart(2,'0')} AM`;
      }
    }

    // Combined date-time fallback (e.g., "5th June at 11:00 AM" or "29 at 11:00")
    if ((!entities.availableDate || !entities.availableTime)) {
      const dtMatch = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?(?:\s+\w+)?\s*(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(?:a\.?m\.?|p\.?m\.?)\b/i);
      if (dtMatch) {
        const day = dtMatch[1];
        const hr = parseInt(dtMatch[2]);
        const min = dtMatch[3] ? parseInt(dtMatch[3]) : 0;
        const rawPeriod = dtMatch[0].match(/(am|pm)/i);
        const period = rawPeriod ? rawPeriod[1].toLowerCase() : 'am';
        if (!entities.availableDate) entities.availableDate = day;
        entities.availableTime = `${hr}:${min.toString().padStart(2,'0')} ${period.toUpperCase()}`;
      }
    }
    // Fallback for 'time then date' (e.g., '11:00 AM on 7th June')
    if (!entities.availableTime) {
      const timeFirst = text.match(/(\d{1,2})(?::(\d{2}))?\s*(?:a\.?m\.?|p\.?m\.?)(?=[^\d]*on)/i);
      if (timeFirst) {
        const hr = parseInt(timeFirst[1]);
        const min = timeFirst[2] ? parseInt(timeFirst[2]) : 0;
        const period = timeFirst[0].match(/(am|pm)/i)?.[1].toLowerCase() || 'am';
        entities.availableTime = `${hr}:${min.toString().padStart(2,'0')} ${period.toUpperCase()}`;
      }
    }
    if (!entities.availableDate) {
      const dateAfter = text.match(/on\s+(\d{1,2})(?:st|nd|rd|th)?\s*(\w+)?/i);
      if (dateAfter) {
        entities.availableDate = dateAfter[1] + (dateAfter[2] ? ' ' + dateAfter[2] : '');
      }
    }

    // Extract interest (yes/no)
    const interestMatch = text.match(
      /\b(yes|yeah|sure|definitely|interested|no|nope|not interested)\b/i
    );
    if (interestMatch) {
      const response = interestMatch[1].toLowerCase();
      entities.isInterested = !["no", "nope", "not interested"].includes(
        response
      );
    }

    return entities;
  }

  // Save conversation to database
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
      throw new Error("Failed to save conversation");
    }
  }

  // Book appointment based on extracted entities
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
