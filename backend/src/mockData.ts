// In-memory static graph dataset simulating the seeded database structure deterministically
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
      throw new Error("SeededRandom.choice: array is empty");
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

const rng = new SeededRandom(42);

export const citiesList = [
  "San Francisco", "New York", "London", "Tokyo", "Berlin", 
  "Sydney", "Bengaluru", "Seattle", "Austin", "Paris"
];
export const cities = citiesList.map(name => ({
  id: `city_${name.toLowerCase().replace(/\s+/g, '_')}`,
  name
}));

export const companiesList = [
  "Google", "Meta", "Wexa AI", "Stripe", "OpenAI", 
  "Vercel", "Microsoft", "Amazon", "Figma", "Apple", 
  "Netflix", "Uber", "Snowflake", "Databricks", "Unity"
];
export const companies = companiesList.map(name => ({
  id: `company_${name.toLowerCase().replace(/\s+/g, '_')}`,
  name
}));

export const communities = [
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

export const interests: { id: string; name: string; commId: string }[] = [];
for (const [commId, list] of Object.entries(interestsData)) {
  for (const name of list) {
    interests.push({
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

export const skills: { id: string; name: string; commId: string }[] = [];
for (const [commId, list] of Object.entries(skillsData)) {
  for (const name of list) {
    skills.push({
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

export const people: any[] = [];
export const livesInLinks: { personId: string; cityName: string }[] = [];
export const worksAtLinks: { personId: string; compName: string; role: string; start_year: number }[] = [];
export const memberOfLinks: { personId: string; commId: string }[] = [];
export const hasInterestLinks: { personId: string; interestId: string; level: number }[] = [];
export const hasSkillLinks: { personId: string; skillId: string; level: number; years: number }[] = [];
export const knowsLinks: { p1: string; p2: string; since: number; strength: number; relType: string }[] = [];

// Initialize 120 People nodes
const refDateMs = new Date("2026-01-01").getTime();

for (let i = 1; i <= 120; i++) {
  const fName = rng.choice(firstNames);
  const lName = rng.choice(lastNames);
  const name = `${fName} ${lName}`;
  const username = `${fName.toLowerCase()}_${lName.toLowerCase()}_${i}`;
  const email = `${username}@example.com`;
  
  const comm = communities[i % communities.length];
  if (!comm) continue;
  const commId = comm.id;
  
  const roles = rolesByCommunity[commId];
  const bios = biosByCommunity[commId];
  if (!roles || !bios) continue;

  const role = rng.choice(roles);
  const bio = rng.choice(bios);
  const xp = rng.nextInt(1, 20);
  const city = rng.choice(citiesList);
  const company = rng.choice(companiesList);
  const id = `person_${i}`;
  
  const daysBack = xp * 365;
  const createdAtDate = new Date(refDateMs - daysBack * 24 * 3600 * 1000);
  const created_at = createdAtDate.toISOString().split('T')[0] || "2026-01-01";

  // Build person property object with company name, city, community resolved
  people.push({
    id,
    name,
    username,
    email,
    bio,
    role,
    experience_years: xp,
    profile_image: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`,
    location: city,
    created_at,
    // Pre-join helper properties for mock mode
    company,
    city,
    community: comm.name,
    skills: [],
    interests: []
  });

  livesInLinks.push({ personId: id, cityName: city });
  worksAtLinks.push({ personId: id, compName: company, role, start_year: 2026 - xp });
  memberOfLinks.push({ personId: id, commId });

  // Interests
  const primaryInterests = interests.filter(int => int.commId === commId);
  const secondaryInterests = interests.filter(int => int.commId !== commId);
  const chosenInterests = [
    ...rng.sample(primaryInterests, rng.nextInt(2, 3)),
    ...rng.sample(secondaryInterests, rng.nextInt(0, 2))
  ];
  for (const interest of chosenInterests) {
    hasInterestLinks.push({ personId: id, interestId: interest.id, level: rng.nextInt(1, 5) });
    // Push helper name
    const pNode = people[i - 1];
    if (pNode) pNode.interests.push(interest.name);
  }

  // Skills
  const primarySkills = skills.filter(s => s.commId === commId);
  const secondarySkills = skills.filter(s => s.commId !== commId);
  const chosenSkills = [
    ...rng.sample(primarySkills, rng.nextInt(2, 3)),
    ...rng.sample(secondarySkills, rng.nextInt(0, 1))
  ];
  for (const skill of chosenSkills) {
    hasSkillLinks.push({ personId: id, skillId: skill.id, level: rng.nextInt(1, 5), years: rng.nextInt(1, Math.max(1, xp)) });
    const pNode = people[i - 1];
    if (pNode) pNode.skills.push(skill.name);
  }
}

// KNOWS Connections
const knowsKeys = new Set<string>();
const peopleGroups: Record<string, any[]> = {};
for (const p of people) {
  const link = memberOfLinks.find(l => l.personId === p.id);
  const commId = link ? link.commId : "comm_tech";
  if (!peopleGroups[commId]) peopleGroups[commId] = [];
  peopleGroups[commId].push(p);
}

for (const commPeople of Object.values(peopleGroups)) {
  for (let i = 0; i < commPeople.length; i++) {
    const currentPerson = commPeople[i];
    if (!currentPerson) continue;
    const targets = rng.sample(commPeople.filter(p => p.id !== currentPerson.id), rng.nextInt(3, 6));
    for (const t of targets) {
      const p1Id = currentPerson.id < t.id ? currentPerson.id : t.id;
      const p2Id = currentPerson.id < t.id ? t.id : currentPerson.id;
      const key = `${p1Id}-${p2Id}`;
      
      if (!knowsKeys.has(key)) {
        const since = rng.nextInt(2015, 2026);
        const strength = rng.nextInt(1, 10);
        const relType = rng.choice(["Colleague", "Friend", "Co-founder", "Mentor", "Acquaintance"]);
        
        knowsLinks.push({ p1: p1Id, p2: p2Id, since, strength, relType });
        knowsKeys.add(key);
      }
    }
  }
}

// Bridge links
const bridgePeople = rng.sample(people, 20);
for (const bp of bridgePeople) {
  const bpLink = memberOfLinks.find(l => l.personId === bp.id);
  const bpCommId = bpLink ? bpLink.commId : "comm_tech";
  const otherComms = communities.filter(c => c.id !== bpCommId);
  
  for (const oc of otherComms) {
    const potentialTargets = peopleGroups[oc.id] || [];
    if (potentialTargets.length > 0) {
      const target = rng.choice(potentialTargets);
      const p1Id = bp.id < target.id ? bp.id : target.id;
      const p2Id = bp.id < target.id ? target.id : bp.id;
      const key = `${p1Id}-${p2Id}`;
      
      if (!knowsKeys.has(key)) {
        const since = rng.nextInt(2018, 2026);
        const strength = rng.nextInt(1, 8);
        const relType = rng.choice(["Collaborator", "Friend", "Client", "Advisor"]);
        
        knowsLinks.push({ p1: p1Id, p2: p2Id, since, strength, relType });
        knowsKeys.add(key);
      }
    }
  }
}
