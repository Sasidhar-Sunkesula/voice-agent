const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create jobs
  const job1 = await prisma.job.create({ data: {
    title: 'Software Engineer',
    description: 'Develop backend RESTful services using Node.js and TypeScript.',
    requirements: 'Node.js, TypeScript, Prisma'
  }});
  const job2 = await prisma.job.create({ data: {
    title: 'Frontend Developer',
    description: 'Build interactive UIs using React and Next.js.',
    requirements: 'React, Next.js, CSS'
  }});

  // Create candidates
  const candidate1 = await prisma.candidate.create({ data: {
    name: 'Alice Johnson',
    phone: '1234567890',
    currentCtc: 500000,
    expectedCtc: 700000,
    noticePeriod: 30,
    experience: 24
  }});
  const candidate2 = await prisma.candidate.create({ data: {
    name: 'Bob Smith',
    phone: '0987654321',
    currentCtc: 800000,
    expectedCtc: 1000000,
    noticePeriod: 60,
    experience: 36
  }});

  // Create an appointment for Alice
  await prisma.appointment.create({ data: {
    jobId: job1.id,
    candidateId: candidate1.id,
    dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: 'scheduled'
  }});

  // Create a conversation entry for Alice
  await prisma.conversation.create({ data: {
    candidateId: candidate1.id,
    transcript: 'Yes, I am interested.',
    entitiesExtracted: JSON.stringify({ isInterested: true })
  }});

  console.log('Seeding completed.');
}

main()
  .catch(e => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
