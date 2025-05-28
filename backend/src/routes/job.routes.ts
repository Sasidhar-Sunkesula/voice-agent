import { Router } from "express";
import { prisma } from "../client";

const router = Router();

// Get all jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await prisma.job.findMany();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// Get job by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const job = await prisma.job.findUnique({
      where: { id: Number(id) },
      include: { appointments: true },
    });

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

// Create a new job
router.post("/", async (req, res) => {
  try {
    const { title, description, requirements } = req.body;

    if (!title || !description || !requirements) {
      res
        .status(400)
        .json({ error: "Title, description, and requirements are required" });
      return;
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        requirements,
      },
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: "Failed to create job" });
  }
});

// Update a job
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, requirements } = req.body;

    const job = await prisma.job.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        requirements,
      },
    });

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: "Failed to update job" });
  }
});

// Delete a job
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.job.delete({
      where: { id: Number(id) },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete job" });
  }
});

export default router;
