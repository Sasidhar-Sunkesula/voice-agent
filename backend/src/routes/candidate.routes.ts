import { Router } from 'express';
import { prisma } from '../client';

const router = Router();

// Get all candidates
router.get('/', async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        appointments: true,
        conversations: true
      }
    });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// Get candidate by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await prisma.candidate.findUnique({
      where: { id: Number(id) },
      include: {
        appointments: true,
        conversations: true
      }
    });
    
    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }
    
    res.json(candidate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

// Create a new candidate
router.post('/', async (req, res) => {
  try {
    const { name, phone, currentCtc, expectedCtc, noticePeriod, experience } = req.body;
    
    if (!name || !phone) {
      res.status(400).json({ error: 'Name and phone are required' });
      return;
    }
    
    const candidate = await prisma.candidate.create({
      data: {
        name,
        phone,
        currentCtc: currentCtc ? Number(currentCtc) : null,
        expectedCtc: expectedCtc ? Number(expectedCtc) : null,
        noticePeriod: noticePeriod ? Number(noticePeriod) : null,
        experience: experience ? Number(experience) : null
      }
    });
    
    res.status(201).json(candidate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create candidate' });
  }
});

// Update a candidate
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, currentCtc, expectedCtc, noticePeriod, experience } = req.body;
    
    const candidate = await prisma.candidate.update({
      where: { id: Number(id) },
      data: {
        name,
        phone,
        currentCtc,
        expectedCtc,
        noticePeriod,
        experience
      }
    });
    
    res.json(candidate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

// Delete a candidate
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.candidate.delete({
      where: { id: Number(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

// Get candidate conversations
router.get('/:id/conversations', async (req, res) => {
  try {
    const { id } = req.params;
    const conversations = await prisma.conversation.findMany({
      where: { candidateId: Number(id) },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

export default router;