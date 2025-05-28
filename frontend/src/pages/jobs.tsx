import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { API_URL } from "@/constants";

interface Job {
  id: number;
  title: string;
  description: string;
  requirements: string;
  createdAt: string;
}

export function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/jobs`);
      setJobs(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateJob(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/jobs`, { title, description, requirements });
      setTitle("");
      setDescription("");
      setRequirements("");
      fetchJobs();
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteJob(id: number) {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/api/jobs/${id}`);
      fetchJobs();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Post a New Job</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4 md:flex-row"
            onSubmit={handleCreateJob}
          >
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <Input
              placeholder="Requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading}>
              Create
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>All Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-left">Requirements</th>
                  <th className="px-4 py-2 text-left">Created</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{job.title}</td>
                    <td className="px-4 py-2">{job.description}</td>
                    <td className="px-4 py-2">{job.requirements}</td>
                    <td className="px-4 py-2">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteJob(job.id)}
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
