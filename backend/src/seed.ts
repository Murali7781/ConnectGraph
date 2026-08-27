import { getDriver } from './db.js';
import neo4j from 'neo4j-driver';

// Type definitions for data elements
export interface PersonSeed {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  role: string;
  xp: any; // Neo4j Integer
  profile_image: string;
  location: string;
  created_at: string;
}

export interface CitySeed {
  id: string;
  name: string;
}

export interface CompanySeed {
  id: string;
  name: string;
}

export interface CommunitySeed {
  id: string;
  name: string;
}

export interface InterestSeed {
  id: string;
  name: string;
  commId: string;
}

export interface SkillSeed {
  id: string;
  name: string;
  commId: string;
}

export interface LivesInLink {
  personId: string;
  cityName: string;
}

export interface WorksAtLink {
  personId: string;
  compName: string;
  role: string;
  start_year: any; // Neo4j Integer
}

export interface MemberOfLink {
  personId: string;
  commId: string;
}

export interface HasInterestLink {
  personId: string;
  interestId: string;
  level: any; // Neo4j Integer
}

export interface HasSkillLink {
  personId: string;
  skillId: string;
  level: any; // Neo4j Integer
  years: any; // Neo4j Integer
}

export interface KnowsLink {
  p1: string;
  p2: string;
  since: any; // Neo4j Integer
  strength: any; // Neo4j Integer
  relType: string;
}

// Deterministic pseudo-random number generator to ensure reproducibility
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  choice<T>(arr: T[]): T {
    const val = arr[Math.floor(this.next() * arr.length)];
    if (val === undefined) {
      throw new Error("SeededRandom.choice: array is empty or selection out of bounds");
    }
    return val;
  }
  shuffle<T>(arr: T[]): T[] {
    const res = [...arr];
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const temp = res[i]!;
      res[i] = res[j]!;
      res[j] = temp;
    }
    return res;
  }
  sample<T>(arr: T[], n: number): T[] {
    return this.shuffle(arr).slice(0, n);
  }
}

export async function runSeed() {
  console.log("Starting bulk database seeding...");
  const driver = getDriver();
  const session = driver.session();
  const rng = new SeededRandom(42); // Deterministic seed

  try {
    // 1. Clear database and create constraints
    console.log("Clearing existing data...");
    await session.run("MATCH (n) DETACH DELETE n");

    console.log("Setting up database constraints...");
    const constraints = [
      "CREATE CONSTRAINT person_id_idx IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE",
      "CREATE CONSTRAINT interest_id_idx IF NOT EXISTS FOR (i:Interest) REQUIRE i.id IS UNIQUE",
      "CREATE CONSTRAINT skill_id_idx IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE",
      "CREATE CONSTRAINT company_id_idx IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE",
      "CREATE CONSTRAINT city_id_idx IF NOT EXISTS FOR (c:City) REQUIRE c.id IS UNIQUE",
      "CREATE CONSTRAINT community_id_idx IF NOT EXISTS FOR (c:Community) REQUIRE c.id IS UNIQUE"
    ];
    for (const constraint of constraints) {
      await session.run(constraint);
    }

    // Define data arrays
    const citiesList: string[] = [
      "San Francisco", "New York", "London", "Tokyo", "Berlin", 
      "Sydney", "Bengaluru", "Seattle", "Austin", "Paris"
    ];
    const cities: CitySeed[] = citiesList.map(name => ({
      id: `city_${name.toLowerCase().replace(/\s+/g, '_')}`,
      name
    }));

    const companiesList: string[] = [
      "Google", "Meta", "Wexa AI", "Stripe", "OpenAI", 
      "Vercel", "Microsoft", "Amazon", "Figma", "Apple", 
      "Netflix", "Uber", "Snowflake", "Databricks", "Unity"
    ];
    const companies: CompanySeed[] = companiesList.map(name => ({
      id: `company_${name.toLowerCase().replace(/\s+/g, '_')}`,
      name
    }));

    const communities: CommunitySeed[] = [
      { id: "comm_tech", name: "Technology & Engineering" },
      { id: "comm_ai", name: "Data Science & AI" },
      { id: "comm_design", name: "UI/UX & Product Design" },
      { id: "comm_startup", name: "Startups & Entrepreneurship" },
      { id: "comm_gaming", name: "Game Development & Esports" }
    ];

    const interestsData: Record<string, string[]> = {
      comm_tech: ["Cloud Computing", "Cybersecurity", "DevOps", "Open Source", "Web3", "Distributed Systems"],
      comm_ai: ["Machine Learning", "Artificial Intelligence", "Data Engineering", "Deep Learning", "Natural Language Processing", "Computer Vision"],
      comm_design: ["UI/UX Design", "Graphic Design", "Branding", "Motion Graphics", "Design Systems", "Typography"],
      comm_startup: ["Entrepreneurship", "Venture Capital", "Product Strategy", "Growth Hacking", "Angel Investing", "SaaS Marketing"],
      comm_gaming: ["Game Development", "Virtual Reality", "Esports", "Game Design", "Interactive Storytelling", "3D Modeling"]
    };

    const allInterests: InterestSeed[] = [];
    for (const [commId, list] of Object.entries(interestsData)) {
      for (const name of list) {
        allInterests.push({
          id: `interest_${name.toLowerCase().replace(/\s+/g, '_')}`,
          name,
          commId
        });
      }
    }

    const skillsData: Record<string, string[]> = {
      comm_tech: ["Go", "Rust", "Docker", "Kubernetes", "TypeScript", "Linux Shell"],
      comm_ai: ["Python", "SQL", "PyTorch", "Pandas", "Scikit-Learn", "TensorFlow"],
      comm_design: ["Figma", "Adobe Illustrator", "Prototyping", "Branding Guidelines", "CSS & HTML", "Framer"],
      comm_startup: ["Product Management", "Scrum & Agile", "Business Development", "Pitching", "Public Speaking", "SEO Strategy"],
      comm_gaming: ["Unity", "Unreal Engine", "C#", "C++", "Shader Programming", "Blender"]
    };

    const allSkills: SkillSeed[] = [];
    for (const [commId, list] of Object.entries(skillsData)) {
      for (const name of list) {
        allSkills.push({
          id: `skill_${name.toLowerCase().replace(/\s+/g, '_')}`,
          name,
          commId
        });
      }
    }

    const firstNames = [
      "Aarav", "Aditi", "Amit", "Ananya", "Arjun", "Dev", "Divya", "Ganesh", "Isha", "Kabir",
      "Karan", "Kavita", "Krishna", "Meera", "Nikhil", "Pooja", "Rahul", "Rohan", "Sanjay", "Shreya",
      "Vikram", "Aishwarya", "Alok", "Anjali", "Deepak", "Gaurav", "Harish", "Jyoti", "Kiran", "Madhav",
      "Neha", "Pranav", "Priyanka", "Rajesh", "Ritu", "Sameer", "Sandeep", "Seema", "Siddharth", "Sunita",
      "Tarun", "Uday", "Varun", "Vijay", "Yash", "Avani", "Kunal", "Riya", "Vivek", "Tanvi"
    ];
    const lastNames = [
      "Sharma", "Patel", "Verma", "Gupta", "Mehta", "Kumar", "Singh", "Joshi", "Rao", "Nair",
      "Iyer", "Reddy", "Choudhury", "Bose", "Das", "Sen", "Banerjee", "Chatterjee", "Mishra", "Pandey",
      "Dubey", "Trivedi", "Saksena", "Deshmukh", "Kulkarni", "Patil", "Pillai", "Menon", "Shenoy", "Bhat",
      "Hegde", "Naidu", "Shetty", "Gowda", "Raman", "Narayanan", "Subramanian", "Krishnan", "Aiyar", "Chopra",
      "Malhotra", "Kapoor", "Johar", "Bhasin", "Sareen", "Khanna", "Anand", "Oberoi", "Roy", "Dutta"
    ];

    const rolesByCommunity: Record<string, string[]> = {
      comm_tech: ["Staff Software Engineer", "DevOps Engineer", "Solutions Architect", "Backend Engineer", "Infrastructure Engineer", "Security Analyst"],
      comm_ai: ["ML Engineer", "Data Scientist", "Research Scientist", "Data Architect", "AI Engineer", "NLP specialist"],
      comm_design: ["Senior UI/UX Designer", "Product Designer", "Visual Designer", "Brand Specialist", "Design Systems Lead"],
      comm_startup: ["Founder & CEO", "VP of Product", "Venture Partner", "Growth Lead", "Product Manager", "Tech Co-founder"],
      comm_gaming: ["Game Developer", "Graphics Engineer", "Game Designer", "Creative Director", "Gameplay Programmer"]
    };

    const biosByCommunity: Record<string, string[]> = {
      comm_tech: [
        "Building scalable systems, loving open source and systems programming.",
        "Infrastructure lover. Keeping servers happy and automated.",
        "Passionate about secure architectures, web standards, and high performance.",
        "Writing robust tools in Rust and Go. Devops practitioner."
      ],
      comm_ai: [
        "Exploring neural networks, generative AI models, and deep learning architectures.",
        "Turning raw logs into actionable intelligence. ML developer.",
        "NLP and computer vision enthusiast. Transforming the future with data.",
        "Passionate about data engineering pipelines and statistical algorithms."
      ],
      comm_design: [
        "Crafting beautiful, functional user interfaces and design systems.",
        "Human-centered design advocate. Making products delightful and accessible.",
        "Pixel-perfect artist. Branding, motion graphics, and design workflows.",
        "Bridging the gap between engineering and visual aesthetics."
      ],
      comm_startup: [
        "Scaling startups from zero to one. Always looking for innovative founders.",
        "Product strategist. Aligning customer needs with business goals.",
        "Growth hacker and angel investor. Building the future of SaaS.",
        "Serial entrepreneur, team builder, and product visionary."
      ],
      comm_gaming: [
        "Developing real-time 3D experiences, virtual realities, and multiplayer game loops.",
        "Graphics programmer. Tinkering with shaders and engine rendering pipelines.",
        "Crafting immersive game mechanics and interactive storytelling flows.",
        "Indie game builder, esports follower, and Unity/Unreal enthusiast."
      ]
    };

    // Generate Person nodes in memory
    const people: PersonSeed[] = [];
    const livesInLinks: LivesInLink[] = [];
    const worksAtLinks: WorksAtLink[] = [];
    const memberOfLinks: MemberOfLink[] = [];
    const hasInterestLinks: HasInterestLink[] = [];
    const hasSkillLinks: HasSkillLink[] = [];

    // Deterministic dates: use a fixed reference date of 2026-01-01
    const refDateMs = new Date("2026-01-01").getTime();

    console.log("Preparing 120 Person nodes and local linkages...");
    for (let i = 1; i <= 120; i++) {
      const fName = rng.choice(firstNames);
      const lName = rng.choice(lastNames);
      const name = i === 1 ? "Murali Mahi" : `${fName} ${lName}`;
      const username = i === 1 ? "murali_mahi" : `${fName.toLowerCase()}_${lName.toLowerCase()}_${i}`;
      const email = i === 1 ? "murali_mahi@example.com" : `${username}@example.com`;
      
      const comm = communities[i % communities.length];
      if (!comm) {
        throw new Error(`Invalid community index: ${i % communities.length}`);
      }
      const commId = comm.id;
      
      const roles = rolesByCommunity[commId];
      const bios = biosByCommunity[commId];
      if (!roles || !bios) {
        throw new Error(`Invalid configuration for community: ${commId}`);
      }
      const role = rng.choice(roles);
      const bio = rng.choice(bios);
      const xp = rng.nextInt(1, 20);
      const city = rng.choice(citiesList);
      const company = rng.choice(companiesList);
      const id = `person_${i}`;
      
      // Calculate created_at from the fixed reference date
      const daysBack = xp * 365;
      const createdAtDate = new Date(refDateMs - daysBack * 24 * 3600 * 1000);
      const created_at = createdAtDate.toISOString().split('T')[0] || "2026-01-01";

      people.push({
        id,
        name,
        username,
        email,
        bio,
        role,
        xp: neo4j.int(xp),
        profile_image: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`,
        location: city,
        created_at
      });

      // LIVES_IN
      livesInLinks.push({ personId: id, cityName: city });

      // WORKS_AT
      worksAtLinks.push({
        personId: id,
        compName: company,
        role,
        start_year: neo4j.int(2026 - xp)
      });

      // MEMBER_OF
      memberOfLinks.push({ personId: id, commId });

      // HAS_INTEREST
      const primaryInterests = allInterests.filter(int => int.commId === commId);
      const secondaryInterests = allInterests.filter(int => int.commId !== commId);
      const chosenInterests = [
        ...rng.sample(primaryInterests, rng.nextInt(2, 3)),
        ...rng.sample(secondaryInterests, rng.nextInt(0, 2))
      ];
      for (const interest of chosenInterests) {
        hasInterestLinks.push({
          personId: id,
          interestId: interest.id,
          level: neo4j.int(rng.nextInt(1, 5))
        });
      }

      // HAS_SKILL
      const primarySkills = allSkills.filter(s => s.commId === commId);
      const secondarySkills = allSkills.filter(s => s.commId !== commId);
      const chosenSkills = [
        ...rng.sample(primarySkills, rng.nextInt(2, 3)),
        ...rng.sample(secondarySkills, rng.nextInt(0, 1))
      ];
      for (const skill of chosenSkills) {
        hasSkillLinks.push({
          personId: id,
          skillId: skill.id,
          level: neo4j.int(rng.nextInt(1, 5)),
          years: neo4j.int(rng.nextInt(1, Math.max(1, xp)))
        });
      }
    }

    // Connect People together (KNOWS relationships) in memory
    const knowsLinks: KnowsLink[] = [];
    const knowsKeys = new Set<string>();

    // Group people by community
    const peopleGroups: Record<string, PersonSeed[]> = {};
    for (const p of people) {
      const link = memberOfLinks.find(l => l.personId === p.id);
      const commId = link ? link.commId : "comm_tech";
      if (!peopleGroups[commId]) peopleGroups[commId] = [];
      peopleGroups[commId].push(p);
    }

    // Intra-community links
    for (const commPeople of Object.values(peopleGroups)) {
      for (let i = 0; i < commPeople.length; i++) {
        const currentPerson = commPeople[i];
        if (!currentPerson) continue;
        const targets = rng.sample(commPeople.filter(p => p.id !== currentPerson.id), rng.nextInt(3, 6));
        for (const t of targets) {
          // Sort keys lexicographically to prevent undirected relationship duplicates
          const p1Id = currentPerson.id < t.id ? currentPerson.id : t.id;
          const p2Id = currentPerson.id < t.id ? t.id : currentPerson.id;
          const key = `${p1Id}-${p2Id}`;
          
          if (!knowsKeys.has(key)) {
            const since = rng.nextInt(2015, 2026);
            const strength = rng.nextInt(1, 10);
            const relType = rng.choice(["Colleague", "Friend", "Co-founder", "Mentor", "Acquaintance"]);
            
            knowsLinks.push({
              p1: p1Id,
              p2: p2Id,
              since: neo4j.int(since), // Numeric properties stored as integers
              strength: neo4j.int(strength),
              relType
            });
            knowsKeys.add(key);
          }
        }
      }
    }

    // Cross-community bridge links
    const bridgePeople = rng.sample(people, 20);
    for (const bp of bridgePeople) {
      const bpLink = memberOfLinks.find(l => l.personId === bp.id);
      const bpCommId = bpLink ? bpLink.commId : "comm_tech";
      const otherComms = communities.filter(c => c.id !== bpCommId);
      
      for (const oc of otherComms) {
        const potentialTargets = peopleGroups[oc.id] || [];
        if (potentialTargets.length > 0) {
          const target = rng.choice(potentialTargets);
          
          // Sort keys lexicographically to prevent undirected relationship duplicates
          const p1Id = bp.id < target.id ? bp.id : target.id;
          const p2Id = bp.id < target.id ? target.id : bp.id;
          const key = `${p1Id}-${p2Id}`;
          
          if (!knowsKeys.has(key)) {
            const since = rng.nextInt(2018, 2026);
            const strength = rng.nextInt(1, 8);
            const relType = rng.choice(["Collaborator", "Friend", "Client", "Advisor"]);
            
            knowsLinks.push({
              p1: p1Id,
              p2: p2Id,
              since: neo4j.int(since), // Numeric properties stored as integers
              strength: neo4j.int(strength),
              relType
            });
            knowsKeys.add(key);
          }
        }
      }
    }

    // 2. Perform BULK imports
    console.log("Executing bulk database writes...");
    
    console.log("- Importing Cities...");
    await session.run("UNWIND $cities AS c CREATE (:City {id: c.id, name: c.name})", { cities });
    
    console.log("- Importing Companies...");
    await session.run("UNWIND $companies AS c CREATE (:Company {id: c.id, name: c.name})", { companies });

    console.log("- Importing Communities...");
    await session.run("UNWIND $communities AS c CREATE (:Community {id: c.id, name: c.name})", { communities });

    console.log("- Importing Interests...");
    await session.run("UNWIND $interests AS i CREATE (:Interest {id: i.id, name: i.name})", { interests: allInterests });

    console.log("- Importing Skills...");
    await session.run("UNWIND $skills AS s CREATE (:Skill {id: s.id, name: s.name})", { skills: allSkills });

    console.log("- Importing People...");
    await session.run(`
      UNWIND $people AS p
      CREATE (:Person {
        id: p.id,
        name: p.name,
        username: p.username,
        email: p.email,
        bio: p.bio,
        role: p.role,
        experience_years: p.xp,
        profile_image: p.profile_image,
        location: p.location,
        created_at: p.created_at
      })
    `, { people });

    console.log("- Linking LIVES_IN...");
    await session.run(`
      UNWIND $links AS link
      MATCH (p:Person {id: link.personId})
      MATCH (c:City {name: link.cityName})
      CREATE (p)-[:LIVES_IN]->(c)
    `, { links: livesInLinks });

    console.log("- Linking WORKS_AT...");
    await session.run(`
      UNWIND $links AS link
      MATCH (p:Person {id: link.personId})
      MATCH (c:Company {name: link.compName})
      CREATE (p)-[:WORKS_AT {role: link.role, start_year: link.start_year}]->(c)
    `, { links: worksAtLinks });

    console.log("- Linking MEMBER_OF...");
    await session.run(`
      UNWIND $links AS link
      MATCH (p:Person {id: link.personId})
      MATCH (c:Community {id: link.commId})
      CREATE (p)-[:MEMBER_OF]->(c)
    `, { links: memberOfLinks });

    console.log("- Linking HAS_INTEREST...");
    await session.run(`
      UNWIND $links AS link
      MATCH (p:Person {id: link.personId})
      MATCH (i:Interest {id: link.interestId})
      CREATE (p)-[:HAS_INTEREST {level: link.level}]->(i)
    `, { links: hasInterestLinks });

    console.log("- Linking HAS_SKILL...");
    await session.run(`
      UNWIND $links AS link
      MATCH (p:Person {id: link.personId})
      MATCH (s:Skill {id: link.skillId})
      CREATE (p)-[:HAS_SKILL {level: link.level, years: link.years}]->(s)
    `, { links: hasSkillLinks });

    console.log("- Linking KNOWS...");
    await session.run(`
      UNWIND $links AS link
      MATCH (p1:Person {id: link.p1})
      MATCH (p2:Person {id: link.p2})
      CREATE (p1)-[:KNOWS {since: link.since, strength: link.strength, relationship_type: link.relType}]->(p2)
    `, { links: knowsLinks });

    // Print summary stats
    console.log("Verifying seeded counts...");
    const countPeople = await session.run("MATCH (p:Person) RETURN count(p) AS count");
    const countInterests = await session.run("MATCH (i:Interest) RETURN count(i) AS count");
    const countSkills = await session.run("MATCH (s:Skill) RETURN count(s) AS count");
    const countCompanies = await session.run("MATCH (c:Company) RETURN count(c) AS count");
    const countCities = await session.run("MATCH (c:City) RETURN count(c) AS count");
    const countCommunities = await session.run("MATCH (c:Community) RETURN count(c) AS count");
    const countKnows = await session.run("MATCH ()-[r:KNOWS]->() RETURN count(r) AS count");

    console.log("-----------------------------------------");
    console.log("Bulk Seeding complete! Database status:");
    console.log(`- People: ${countPeople.records[0]?.get('count').toNumber()}`);
    console.log(`- Interests: ${countInterests.records[0]?.get('count').toNumber()}`);
    console.log(`- Skills: ${countSkills.records[0]?.get('count').toNumber()}`);
    console.log(`- Companies: ${countCompanies.records[0]?.get('count').toNumber()}`);
    console.log(`- Cities: ${countCities.records[0]?.get('count').toNumber()}`);
    console.log(`- Communities: ${countCommunities.records[0]?.get('count').toNumber()}`);
    console.log(`- KNOWS connections: ${countKnows.records[0]?.get('count').toNumber()}`);
    console.log("-----------------------------------------");

    return { success: true };
  } catch (error: any) {
    console.error("Seeding failed with error:", error);
    return { success: false, error: error.message };
  } finally {
    await session.close();
  }
}

if (process.argv[1] && (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'))) {
  runSeed()
    .then((result) => {
      if (result.success) {
        process.exit(0);
      } else {
        console.error("Seeding execution failed:", result.error);
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error("Fatal error during seeding:", err);
      process.exit(1);
    });
}
