import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { API_URL } from "@/constants";

interface Candidate {
  id: number;
  name: string;
  phone: string;
  currentCtc: number;
  expectedCtc: number;
  noticePeriod: number;
  experience: string;
}

export function Candidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentCtc, setCurrentCtc] = useState("");
  const [expectedCtc, setExpectedCtc] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [experience, setExperience] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  async function fetchCandidates() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/candidates`);
      setCandidates(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCandidate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/candidates`, {
        name,
        phone,
        currentCtc: Number(currentCtc),
        expectedCtc: Number(expectedCtc),
        noticePeriod: Number(noticePeriod),
        experience,
      });
      setName("");
      setPhone("");
      setCurrentCtc("");
      setExpectedCtc("");
      setNoticePeriod("");
      setExperience("");
      fetchCandidates();
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCandidate(id: number) {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/api/candidates/${id}`);
      fetchCandidates();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add a New Candidate</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4 md:flex-row"
            onSubmit={handleCreateCandidate}
          >
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              type="tel"
            />
            <Input
              placeholder="Current CTC"
              value={currentCtc}
              onChange={(e) => setCurrentCtc(e.target.value)}
              required
            />
            <Input
              placeholder="Expected CTC"
              value={expectedCtc}
              onChange={(e) => setExpectedCtc(e.target.value)}
              required
            />
            <Input
              placeholder="Notice Period (days)"
              value={noticePeriod}
              onChange={(e) => setNoticePeriod(e.target.value)}
              required
            />
            <Input
              placeholder="Experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading}>
              Add
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>All Candidates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Phone</th>
                  <th className="px-4 py-2 text-left">Current CTC</th>
                  <th className="px-4 py-2 text-left">Expected CTC</th>
                  <th className="px-4 py-2 text-left">Notice Period</th>
                  <th className="px-4 py-2 text-left">Experience</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{candidate.name}</td>
                    <td className="px-4 py-2">{candidate.phone}</td>
                    <td className="px-4 py-2">{candidate.currentCtc}</td>
                    <td className="px-4 py-2">{candidate.expectedCtc}</td>
                    <td className="px-4 py-2">{candidate.noticePeriod}</td>
                    <td className="px-4 py-2">{candidate.experience}</td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCandidate(candidate.id)}
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
