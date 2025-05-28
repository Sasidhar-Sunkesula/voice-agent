import { Layout } from "@/components/layout";
import { ThemeProvider } from "@/components/theme-provider";
import { Appointments } from "@/pages/appointments";
import { Candidates } from "@/pages/candidates";
import { Dashboard } from "@/pages/dashboard";
import { Jobs } from "@/pages/jobs";
import { VoiceAgent } from "@/pages/voice-agent";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="voice-agent-theme">
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/voice-agent" element={<VoiceAgent />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
