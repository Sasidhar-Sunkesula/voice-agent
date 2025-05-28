import { Router } from 'express';
import { prisma } from '../client';

const router = Router();

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        job: true,
        candidate: true
      },
      orderBy: {
        dateTime: 'asc'
      }
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(id) },
      include: {
        job: true,
        candidate: true
      }
    });
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// Create a new appointment
router.post('/', async (req, res) => {
  try {
    const { jobId, candidateId, dateTime, status } = req.body;
    if (!jobId || !candidateId || !dateTime) {
      res.status(400).json({ error: 'jobId, candidateId, and dateTime are required' });
      return;
    }
    const appointment = await prisma.appointment.create({
      data: {
        jobId: Number(jobId),
        candidateId: Number(candidateId),
        dateTime: new Date(dateTime),
        status: status || 'scheduled',
      }
    });
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Update an appointment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { dateTime, status } = req.body;
    const appointment = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        ...(dateTime && { dateTime: new Date(dateTime) }),
        ...(status && { status }),
      }
    });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Delete an appointment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.appointment.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

export default router;
