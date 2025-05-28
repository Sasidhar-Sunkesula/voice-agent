import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { API_URL } from "@/constants";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export function Dashboard() {
  const [counts, setCounts] = useState({ jobs: 0, candidates: 0, appointments: 0 });

  useEffect(() => {
    async function fetchCounts() {
      const [jobsRes, candidatesRes, appointmentsRes] = await Promise.all([
        axios.get(`${API_URL}/api/jobs`),
        axios.get(`${API_URL}/api/candidates`),
        axios.get(`${API_URL}/api/appointments`),
      ]);
      setCounts({
        jobs: jobsRes.data.length,
        candidates: candidatesRes.data.length,
        appointments: appointmentsRes.data.length,
      });
    }
    fetchCounts();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Jobs ({counts.jobs})</CardTitle>
        </CardHeader>
        <CardContent>
          <Link to="/jobs">
            <Button>Manage Jobs</Button>
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Candidates ({counts.candidates})</CardTitle>
        </CardHeader>
        <CardContent>
          <Link to="/candidates">
            <Button>Manage Candidates</Button>
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Appointments ({counts.appointments})</CardTitle>
        </CardHeader>
        <CardContent>
          <Link to="/appointments">
            <Button>View Appointments</Button>
          </Link>
        </CardContent>
      </Card>
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Voice Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <Link to="/voice-agent">
            <Button>Start Conversation</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
