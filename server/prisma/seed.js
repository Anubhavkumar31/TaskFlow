const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const memberPassword = await bcrypt.hash('member123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@demo.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const member1 = await prisma.user.upsert({
    where: { email: 'alice@demo.com' },
    update: {},
    create: {
      name: 'Alice Smith',
      email: 'alice@demo.com',
      password: memberPassword,
      role: 'MEMBER',
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: 'bob@demo.com' },
    update: {},
    create: {
      name: 'Bob Jones',
      email: 'bob@demo.com',
      password: memberPassword,
      role: 'MEMBER',
    },
  });

  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      name: 'Website Redesign',
      description: 'Redesign the company website with modern UI',
      adminId: admin.id,
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: member1.id } },
    update: {},
    create: { projectId: project.id, userId: member1.id },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: member2.id } },
    update: {},
    create: { projectId: project.id, userId: member2.id },
  });

  const yesterday = new Date(Date.now() - 86400000);
  const nextWeek = new Date(Date.now() + 7 * 86400000);

  await prisma.task.createMany({
    data: [
      {
        title: 'Design homepage mockup',
        description: 'Create Figma mockup for new homepage',
        status: 'DONE',
        dueDate: yesterday,
        projectId: project.id,
        assigneeId: member1.id,
      },
      {
        title: 'Build navbar component',
        description: 'Implement responsive navbar in React',
        status: 'IN_PROGRESS',
        dueDate: nextWeek,
        projectId: project.id,
        assigneeId: member1.id,
      },
      {
        title: 'Write API documentation',
        description: 'Document all REST endpoints',
        status: 'TODO',
        dueDate: yesterday,
        projectId: project.id,
        assigneeId: member2.id,
      },
      {
        title: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for deployment',
        status: 'TODO',
        dueDate: nextWeek,
        projectId: project.id,
        assigneeId: member2.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed complete!');
  console.log('Demo accounts:');
  console.log('  Admin: admin@demo.com / admin123');
  console.log('  Member: alice@demo.com / member123');
  console.log('  Member: bob@demo.com / member123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
