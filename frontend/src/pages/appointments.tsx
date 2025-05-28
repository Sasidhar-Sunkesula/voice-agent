import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { API_URL } from "@/constants";

interface Appointment {
  id: number;
  job: { id: number; title: string };
  candidate: { id: number; name: string };
  dateTime: string;
}

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/appointments`);
      setAppointments(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAppointment(id: number) {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/api/appointments/${id}`);
      fetchAppointments();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Job</th>
                  <th className="px-4 py-2 text-left">Candidate</th>
                  <th className="px-4 py-2 text-left">Scheduled At</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{appt.id}</td>
                    <td className="px-4 py-2">{appt.job?.title}</td>
                    <td className="px-4 py-2">{appt.candidate?.name}</td>
                    <td className="px-4 py-2">
                      {new Date(appt.dateTime).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAppointment(appt.id)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
