import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_URL } from "@/constants";
import axios from "axios";
import { useEffect, useRef, useState } from "react";

export function VoiceAgent() {
  const [candidateId, setCandidateId] = useState("");
  const candidateIdRef = useRef<string>(candidateId);
  const [stage, setStage] = useState("greeting");
  const [entities, setEntities] = useState<Record<string, any>>({});
  // Preserve latest stage for callbacks
  const stageRef = useRef<string>(stage);
  useEffect(() => { stageRef.current = stage; }, [stage]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [log, setLog] = useState<
    { speaker: "user" | "agent"; message: string }[]
  >([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    candidateIdRef.current = candidateId;
  }, [candidateId]);

  useEffect(() => {
    const recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (recognition) {
      const recog = new recognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = "en-US";
      // Debug: trace recognition lifecycle
      recog.onstart = () => { console.log('SpeechRecognition started'); setListening(true); };
      recog.onspeechstart = () => console.log('SpeechRecognition speechstart');
      recog.onspeechend = () => console.log('SpeechRecognition speechend');
      recog.onend = () => { console.log('SpeechRecognition ended'); setListening(false); };
      recog.onresult = (event: any) => {
        const msg = event.results[0][0].transcript.trim();
        console.log('Recognized speech:', msg);
        handleSend(msg);
      };
      recog.onerror = (event: any) => {
        // Ignore no-speech errors
        if (event.error === 'no-speech') {
          console.warn('No speech detected');
          return;
        }
        console.error('Speech recognition error:', event.error); setListening(false);
        setLog((l) => [...l, { speaker: "agent", message: `Error: ${event.error}` }]);
      };
      recognitionRef.current = recog;
    }
  }, []);

  async function handleSend(text: string) {
    setLoading(true);
    setLog((l) => [...l, { speaker: "user", message: text }]);
    try {
      const res = await axios.post<{ response: string; nextStage: string; entities: Record<string, any> }>(
        `${API_URL}/api/conversations/process-text`,
        {
          candidateId: candidateIdRef.current,
          text,
          context: { stage: stageRef.current, entities },
        }
      );
      const resp = res.data.response;
      setLog((l) => [...l, { speaker: "agent", message: resp }]);
      // Speak response
      if (window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(resp);
        utter.lang = 'en-US';
        // After speech completes, restart recognition
        utter.onend = () => {
          recognitionRef.current?.start();
          setListening(true);
        };
        window.speechSynthesis.speak(utter);
      }
      setStage(res.data.nextStage);
      // Persist server entities
      setEntities(res.data.entities);
    } catch (error) {
      console.error('Error processing text:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setLog((l) => [...l, { speaker: "agent", message: `Sorry, there was an error processing your request: ${errorMessage}` }]);
    } finally {
      setLoading(false);
      // listening managed via TTS and controls
    }
  }

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      recognitionRef.current?.start();
      setListening(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice Agent Conversation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Candidate ID"
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            required
          />
        </div>
        <div className="space-x-2 mb-4">
          <Button
            onClick={toggleListening}
            disabled={!recognitionRef.current}
          >
            {listening ? 'Stop Recording' : loading ? 'Processing...' : 'Start Recording'}
          </Button>
        </div>
        <div className="space-y-2 border p-4 rounded h-[calc(100vh-16rem)] overflow-y-auto">
          {log.map((entry, idx) => (
            <div
              key={idx}
              className={entry.speaker === "user" ? "text-right" : "text-left"}
            >
              <strong>{entry.speaker === "user" ? "You:" : "Agent:"}</strong>{" "}
              {entry.message}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
