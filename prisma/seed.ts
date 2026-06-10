import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: "org-bridge-to-thrive" },
    update: { name: "Bridge to Thrive" },
    create: {
      id: "org-bridge-to-thrive",
      name: "Bridge to Thrive",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@bridgetothrive.org" },
    update: { organizationId: organization.id },
    create: {
      email: "manager@bridgetothrive.org",
      name: "Program Manager",
      role: "MANAGER",
      organizationId: organization.id,
    },
  });

  const steve = await prisma.user.upsert({
    where: { email: "steve@thriveinmn.com" },
    update: {
      name: "Steve",
      role: "SUPER_ADMIN",
      organizationId: organization.id,
    },
    create: {
      email: "steve@thriveinmn.com",
      name: "Steve",
      role: "SUPER_ADMIN",
      organizationId: organization.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "participant@bridgetothrive.org" },
    update: { organizationId: organization.id },
    create: {
      email: "participant@bridgetothrive.org",
      name: "Demo Participant",
      role: "PARTICIPANT",
      managerId: steve.id,
      organizationId: organization.id,
    },
  });

  const resources = [
    {
      title: "Construction & Trades",
      category: "Career Paths",
      description:
        "Entry-level paths in carpentry, HVAC, electrical, and general labor — many employers offer on-the-job training.",
      content:
        "Minnesota has strong demand for skilled trades workers. Consider starting with a temp agency specializing in construction, or explore apprenticeships through local unions. OSHA-10 certification is often required and can be completed in a day.",
      url: "https://www.minnesotaworks.net/",
      sortOrder: 1,
    },
    {
      title: "Warehouse & Logistics",
      category: "Career Paths",
      description:
        "Distribution centers and logistics companies near St. Paul frequently hire with minimal experience requirements.",
      content:
        "Companies like Amazon, Target, and local 3PL providers operate warehouses in the Twin Cities metro. Forklift certification (obtainable in 1-2 days) significantly increases pay and opportunities.",
      sortOrder: 2,
    },
    {
      title: "Food Service & Hospitality",
      category: "Career Paths",
      description:
        "Restaurants, hotels, and catering companies offer flexible schedules and quick hiring cycles.",
      content:
        "Many establishments value reliability over experience. ServSafe food handler certification is inexpensive and makes you a stronger candidate. Consider starting as a prep cook or dishwasher and working up.",
      sortOrder: 3,
    },
    {
      title: "Building a Resume",
      category: "Job Search Skills",
      description:
        "How to highlight your strengths and address employment gaps honestly and positively.",
      content:
        "Focus on skills gained during recovery: discipline, commitment, teamwork. Use a functional or combination resume format. List any volunteer work, training, or certifications. Keep it to one page.",
      sortOrder: 4,
    },
    {
      title: "Interview Preparation",
      category: "Job Search Skills",
      description:
        "Practical tips for interviewing with confidence, including how to discuss your background.",
      content:
        "Practice common questions with your program manager. Be honest about your recovery journey if asked — many employers value second-chance hiring. Prepare 2-3 questions to ask the interviewer. Dress neatly; arrive 10 minutes early.",
      sortOrder: 5,
    },
    {
      title: "Second-Chance Employers",
      category: "Resources",
      description:
        "Organizations and employers in Minnesota known for fair-chance hiring practices.",
      content:
        "Resources include Minnesota Department of Employment and Economic Development (DEED), local staffing agencies specializing in reentry, and nonprofits like Better Futures Minnesota. Ask your program manager for current partner employer lists.",
      url: "https://mn.gov/deed/",
      sortOrder: 6,
    },
  ];

  for (const resource of resources) {
    await prisma.careerResource.upsert({
      where: { id: resource.title.toLowerCase().replace(/\s+/g, "-") },
      update: resource,
      create: {
        id: resource.title.toLowerCase().replace(/\s+/g, "-"),
        ...resource,
      },
    });
  }

  console.log("Seed completed.");
  console.log("Registered users (sign in with matching Google account):");
  console.log("  Super admin: steve@thriveinmn.com");
  console.log("  Manager:     manager@bridgetothrive.org");
  console.log("  Participant: participant@bridgetothrive.org");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
