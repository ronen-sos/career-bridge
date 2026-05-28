import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 12);

  const manager = await prisma.user.upsert({
    where: { email: "manager@bridgetothrive.org" },
    update: {},
    create: {
      email: "manager@bridgetothrive.org",
      passwordHash,
      name: "Program Manager",
      role: "MANAGER",
    },
  });

  await prisma.user.upsert({
    where: { email: "participant@bridgetothrive.org" },
    update: {},
    create: {
      email: "participant@bridgetothrive.org",
      passwordHash,
      name: "Demo Participant",
      role: "PARTICIPANT",
      managerId: manager.id,
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

  const jobs = [
    {
      title: "Warehouse Associate",
      company: "Target Distribution",
      location: "Shakopee, MN",
      description:
        "Pick, pack, and ship merchandise in a fast-paced warehouse environment. No experience required; training provided on-site.",
      requirements: "Ability to lift 40 lbs, reliable attendance",
      payRange: "$19–$22/hr",
      source: "Indeed",
    },
    {
      title: "General Laborer",
      company: "Ryan Companies",
      location: "St. Paul, MN",
      description:
        "Assist with construction site cleanup, material handling, and basic tasks on commercial building projects.",
      requirements: "OSHA-10 preferred but not required",
      payRange: "$18–$21/hr",
      source: "MinnesotaWorks",
    },
    {
      title: "Line Cook",
      company: "Keys Cafe & Bakery",
      location: "St. Paul, MN",
      description:
        "Prepare breakfast and lunch items in a busy cafe setting. Willing to train motivated candidates.",
      requirements: "Food handler certification within 30 days",
      payRange: "$16–$18/hr",
      source: "Company website",
    },
    {
      title: "Delivery Driver",
      company: "Schwan's Company",
      location: "Marshall, MN (St. Paul route)",
      description:
        "Deliver frozen food products to residential customers. Company vehicle provided.",
      requirements: "Valid MN driver's license, clean driving record",
      payRange: "$17–$20/hr + tips",
      source: "Schwan's Careers",
    },
    {
      title: "Janitorial Technician",
      company: "ServiceMaster Clean",
      location: "St. Paul, MN",
      description:
        "Clean and maintain commercial office spaces in the evening shift. Consistent hours and steady work.",
      requirements: "Background check required",
      payRange: "$16–$17/hr",
      source: "Indeed",
    },
    {
      title: "Production Worker",
      company: "3M Company",
      location: "Maplewood, MN",
      description:
        "Operate machinery and assemble products in a manufacturing facility. Multiple shifts available.",
      requirements: "High school diploma or GED",
      payRange: "$20–$24/hr",
      source: "3M Careers",
    },
  ];

  await prisma.jobOpportunity.deleteMany();
  for (const job of jobs) {
    await prisma.jobOpportunity.create({ data: job });
  }

  console.log("Seed completed.");
  console.log("Demo accounts (password: demo1234):");
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
