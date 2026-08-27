import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import neo4j from 'neo4j-driver';
import { checkConnection, getDriver, toNative, isFallbackMode } from './db.js';
import { runSeed } from './seed.js';

function getNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (neo4j.isInt(val)) {
    return val.toNumber();
  }
  return Number(val);
}
import {
  people,
  cities,
  companies,
  communities,
  interests,
  skills,
  livesInLinks,
  worksAtLinks,
  memberOfLinks,
  hasInterestLinks,
  hasSkillLinks,
  knowsLinks
} from './mockData.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper middleware to check connectivity. If offline, log and permit fallback mode.
const checkDbConnection = async (req: Request, res: Response, next: Function) => {
  const status = await checkConnection();
  if (!status.connected && !status.fallback) {
    res.status(503).json({
      error: "Database is unreachable. Please ensure that CognoDB environment variables are set correctly in the backend .env file.",
      details: status.error
    });
    return;
  }
  next();
};

// 1. Health & Connection check
app.get('/api/health', async (req: Request, res: Response) => {
  const status = await checkConnection();
  res.json({
    ...status,
    fallback: isFallbackMode()
  });
});

// 2. Network Statistics (Query 10 / Fallback Mode)
app.get('/api/stats', checkDbConnection, async (req: Request, res: Response) => {
  if (isFallbackMode()) {
    const topConnected = [...people]
      .map(p => {
        const degree = knowsLinks.filter(k => k.p1 === p.id || k.p2 === p.id).length;
        return { id: p.id, name: p.name, connections: degree };
      })
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 5);

    const interestCounts: Record<string, number> = {};
    hasInterestLinks.forEach(link => {
      const intNode = interests.find(i => i.id === link.interestId);
      if (intNode) {
        interestCounts[intNode.name] = (interestCounts[intNode.name] || 0) + 1;
      }
    });
    const topInterests = Object.entries(interestCounts)
      .map(([name, count]) => ({ id: `interest_${name.toLowerCase().replace(/\s+/g, '_')}`, name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      people: people.length,
      interests: interests.length,
      skills: skills.length,
      companies: companies.length,
      cities: cities.length,
      communities: communities.length,
      connections: knowsLinks.length,
      topConnectedPeople: topConnected,
      topInterests
    });
    return;
  }

  const driver = getDriver();
  const session = driver.session();
  try {
    const pCount = await session.run("MATCH (p:Person) RETURN count(p) AS count");
    const iCount = await session.run("MATCH (i:Interest) RETURN count(i) AS count");
    const sCount = await session.run("MATCH (s:Skill) RETURN count(s) AS count");
    const cCount = await session.run("MATCH (c:Company) RETURN count(c) AS count");
    const cityCount = await session.run("MATCH (c:City) RETURN count(c) AS count");
    const commCount = await session.run("MATCH (c:Community) RETURN count(c) AS count");
    const knowsCount = await session.run("MATCH ()-[r:KNOWS]->() RETURN count(r) AS count");

    // Most connected people
    const topPeopleRes = await session.run(`
      MATCH (p:Person)-[:KNOWS]-(other:Person)
      RETURN p.id AS id, p.name AS name, count(DISTINCT other) AS degree
      ORDER BY degree DESC
      LIMIT 5
    `);
    const topConnectedPeople = topPeopleRes.records.map(rec => ({
      id: rec.get('id'),
      name: rec.get('name'),
      connections: rec.get('degree').toNumber()
    }));

    // Most popular interests
    const topInterestsRes = await session.run(`
      MATCH (i:Interest)<-[:HAS_INTEREST]-(p:Person)
      RETURN i.id AS id, i.name AS name, count(p) AS count
      ORDER BY count DESC
      LIMIT 5
    `);
    const topInterests = topInterestsRes.records.map(rec => ({
      id: rec.get('id'),
      name: rec.get('name'),
      count: getNumber(rec.get('count'))
    }));

    res.json(toNative({
      people: getNumber(pCount.records[0]?.get('count')),
      interests: getNumber(iCount.records[0]?.get('count')),
      skills: getNumber(sCount.records[0]?.get('count')),
      companies: getNumber(cCount.records[0]?.get('count')),
      cities: getNumber(cityCount.records[0]?.get('count')),
      communities: getNumber(commCount.records[0]?.get('count')),
      connections: getNumber(knowsCount.records[0]?.get('count')),
      topConnectedPeople,
      topInterests
    }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// 3. People Directory Search (Query 1 / Fallback Mode)
app.get('/api/people', checkDbConnection, async (req: Request, res: Response) => {
  const { name = '', skill = '', interest = '', company = '', city = '', community = '' } = req.query;

  if (isFallbackMode()) {
    const filtered = people.filter(p => {
      const matchName = !name || p.name.toLowerCase().includes((name as string).toLowerCase());
      const matchCompany = !company || p.company.toLowerCase().includes((company as string).toLowerCase());
      const matchCity = !city || p.city.toLowerCase().includes((city as string).toLowerCase());
      const matchCommunity = !community || p.community.toLowerCase().includes((community as string).toLowerCase());
      const matchSkill = !skill || p.skills.some((s: string) => s.toLowerCase().includes((skill as string).toLowerCase()));
      const matchInterest = !interest || p.interests.some((i: string) => i.toLowerCase().includes((interest as string).toLowerCase()));
      return matchName && matchCompany && matchCity && matchCommunity && matchSkill && matchInterest;
    });
    res.json(filtered.slice(0, 100));
    return;
  }

  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (p:Person)
       WHERE ($name = "" OR toLower(p.name) CONTAINS toLower($name))
       OPTIONAL MATCH (p)-[:WORKS_AT]->(co:Company)
       OPTIONAL MATCH (p)-[:LIVES_IN]->(ci:City)
       OPTIONAL MATCH (p)-[:MEMBER_OF]->(comm:Community)
       OPTIONAL MATCH (p)-[:HAS_SKILL]->(sk:Skill)
       OPTIONAL MATCH (p)-[:HAS_INTEREST]->(int:Interest)
       WITH p, co, ci, comm, collect(DISTINCT sk.name) AS skills, collect(DISTINCT int.name) AS interests
       WHERE ($company = "" OR toLower(co.name) CONTAINS toLower($company))
         AND ($city = "" OR toLower(ci.name) CONTAINS toLower($city))
         AND ($community = "" OR toLower(comm.name) CONTAINS toLower($community))
         AND ($skill = "" OR any(s IN skills WHERE toLower(s) CONTAINS toLower($skill)))
         AND ($interest = "" OR any(i IN interests WHERE toLower(i) CONTAINS toLower($interest)))
       RETURN p {.*, company: co.name, city: ci.name, community: comm.name, skills: skills, interests: interests} AS person
       ORDER BY p.name ASC
       LIMIT 100`,
      { name, skill, interest, company, city, community }
    );

    const peopleResult = result.records.map(rec => rec.get('person'));
    res.json(toNative(peopleResult));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// 4. Person Detail (Query 2, 3, 6 / Fallback Mode)
app.get('/api/people/:id', checkDbConnection, async (req: Request, res: Response) => {
  const { id } = req.params;

  if (isFallbackMode()) {
    const person = people.find(p => p.id === id);
    if (!person) {
      res.status(404).json({ error: "Person not found" });
      return;
    }
    const direct = knowsLinks
      .filter(k => k.p1 === id || k.p2 === id)
      .map(k => {
        const otherId = k.p1 === id ? k.p2 : k.p1;
        const other = people.find(p => p.id === otherId);
        return {
          id: other?.id,
          name: other?.name,
          role: other?.role,
          company: other?.company,
          city: other?.city,
          relSince: k.since,
          relStrength: k.strength,
          relType: k.relType
        };
      });
    res.json({ person, connections: direct });
    return;
  }

  const driver = getDriver();
  const session = driver.session();
  try {
     const personRes = await session.run(
      `MATCH (p:Person {id: $id})
       OPTIONAL MATCH (p)-[:WORKS_AT]->(co:Company)
       OPTIONAL MATCH (p)-[:LIVES_IN]->(ci:City)
       OPTIONAL MATCH (p)-[:MEMBER_OF]->(comm:Community)
       OPTIONAL MATCH (p)-[:HAS_SKILL]->(sk:Skill)
       OPTIONAL MATCH (p)-[:HAS_INTEREST]->(int:Interest)
       WITH p, co, ci, comm, collect(DISTINCT sk.name) AS skills, collect(DISTINCT int.name) AS interests
       RETURN p {.*, company: co.name, city: ci.name, community: comm.name, skills: skills, interests: interests} AS person`,
      { id }
     );
     const person = personRes.records[0]?.get('person');
     if (!person) {
       res.status(404).json({ error: "Person not found" });
       return;
     }

    // Get direct connections
    const connRes = await session.run(
      `MATCH (p:Person {id: $id})-[r:KNOWS]-(other:Person)
       OPTIONAL MATCH (other)-[:WORKS_AT]->(co:Company)
       OPTIONAL MATCH (other)-[:LIVES_IN]->(ci:City)
       RETURN other {.*, company: co.name, city: ci.name, relSince: r.since, relStrength: r.strength, relType: r.relationship_type} AS connection
       ORDER BY other.name ASC`,
      { id }
    );
    const connections = connRes.records.map(rec => rec.get('connection'));

    res.json(toNative({
      person,
      connections
    }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// 5. Mutual Connections (Query 3 / Fallback Mode)
app.get('/api/people/:id/mutuals/:otherId', checkDbConnection, async (req: Request, res: Response) => {
  const { id, otherId } = req.params;

  if (isFallbackMode()) {
    const direct1 = new Set(knowsLinks.filter(k => k.p1 === id || k.p2 === id).map(k => k.p1 === id ? k.p2 : k.p1));
    const direct2 = new Set(knowsLinks.filter(k => k.p1 === otherId || k.p2 === otherId).map(k => k.p1 === otherId ? k.p2 : k.p1));
    const mutualIds = [...direct1].filter(x => direct2.has(x));
    const mutuals = people.filter(p => mutualIds.includes(p.id));
    res.json(mutuals);
    return;
  }

  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (p1:Person {id: $id})-[r1:KNOWS]-(m:Person)-[r2:KNOWS]-(p2:Person {id: $otherId})
       OPTIONAL MATCH (m)-[:WORKS_AT]->(co:Company)
       OPTIONAL MATCH (m)-[:LIVES_IN]->(ci:City)
       OPTIONAL MATCH (m)-[:HAS_SKILL]->(sk:Skill)
       OPTIONAL MATCH (m)-[:HAS_INTEREST]->(int:Interest)
       WITH m, co, ci, collect(DISTINCT sk.name) AS skills, collect(DISTINCT int.name) AS interests
       RETURN m {.*, company: co.name, city: ci.name, skills: skills, interests: interests} AS mutual`,
      { id, otherId }
    );
    const mutuals = result.records.map(rec => rec.get('mutual'));
    res.json(toNative(mutuals));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// 6. Similar People Recommendations (Query 6 / Fallback Mode)
app.get('/api/people/:id/recommendations', checkDbConnection, async (req: Request, res: Response) => {
  const { id } = req.params;

  if (isFallbackMode()) {
    const p = people.find(x => x.id === id);
    if (!p) {
      res.json([]);
      return;
    }
    const directIds = new Set(knowsLinks.filter(k => k.p1 === id || k.p2 === id).map(k => k.p1 === id ? k.p2 : k.p1));
    const recs = people
      .filter(other => other.id !== id && !directIds.has(other.id))
      .map(other => {
        const companyScore = p.company === other.company ? 3 : 0;
        const communityScore = p.community === other.community ? 2 : 0;
        const sharedInterests = p.interests.filter((i: string) => other.interests.includes(i));
        const interestScore = sharedInterests.length * 5;
        const sharedSkills = p.skills.filter((s: string) => other.skills.includes(s));
        const skillScore = sharedSkills.length * 3;
        
        const otherDirectIds = new Set(knowsLinks.filter(k => k.p1 === other.id || k.p2 === other.id).map(k => k.p1 === other.id ? k.p2 : k.p1));
        const mutualNames = [...directIds].filter(x => otherDirectIds.has(x)).map(x => people.find(z => z.id === x)?.name).filter(Boolean);
        const mutualScore = mutualNames.length * 4;

        const rawScore = companyScore + communityScore + interestScore + skillScore + mutualScore;
        return {
          person: other,
          sharedInterests,
          sharedSkills,
          mutualConnections: mutualNames,
          score: rawScore > 100 ? 100 : rawScore
        };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    res.json(recs);
    return;
  }

  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (p:Person {id: $id})
       MATCH (other:Person)
       WHERE other.id <> $id
       AND NOT (p)-[:KNOWS]-(other)
       
       OPTIONAL MATCH (p)-[:WORKS_AT]->(co:Company)<-[:WORKS_AT]-(other)
       WITH p, other, CASE WHEN co IS NOT NULL THEN 3 ELSE 0 END AS companyScore
       
       OPTIONAL MATCH (p)-[:MEMBER_OF]->(comm:Community)<-[:MEMBER_OF]-(other)
       WITH p, other, companyScore, CASE WHEN comm IS NOT NULL THEN 2 ELSE 0 END AS communityScore
       
       OPTIONAL MATCH (p)-[:HAS_INTEREST]->(i:Interest)<-[:HAS_INTEREST]-(other)
       WITH p, other, companyScore, communityScore, collect(DISTINCT i.name) AS sharedInterests, count(DISTINCT i) * 5 AS interestScore
       
       OPTIONAL MATCH (p)-[:HAS_SKILL]->(s:Skill)<-[:HAS_SKILL]-(other)
       WITH p, other, companyScore, communityScore, sharedInterests, interestScore, collect(DISTINCT s.name) AS sharedSkills, count(DISTINCT s) * 3 AS skillScore
       
       OPTIONAL MATCH (p)-[:KNOWS]-(m:Person)-[:KNOWS]-(other)
       WITH p, other, companyScore, communityScore, sharedInterests, interestScore, sharedSkills, skillScore, collect(DISTINCT m.name) AS mutualConnections, count(DISTINCT m) * 4 AS mutualScore
       
       WITH other, sharedInterests, sharedSkills, mutualConnections,
            (companyScore + communityScore + interestScore + skillScore + mutualScore) AS rawScore
       WHERE rawScore > 0
       
       RETURN other {.*} AS person, 
              sharedInterests, 
              sharedSkills, 
              mutualConnections,
              rawScore,
              CASE WHEN rawScore > 100 THEN 100 ELSE rawScore END AS score
       ORDER BY score DESC
       LIMIT 6`,
      { id }
    );
    const recommendations = result.records.map(rec => ({
      person: rec.get('person'),
      sharedInterests: rec.get('sharedInterests'),
      sharedSkills: rec.get('sharedSkills'),
      mutualConnections: rec.get('mutualConnections'),
      score: getNumber(rec.get('score'))
    }));
    res.json(toNative(recommendations));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// 7. Multi-hop Introduction Path (Query 5 / Fallback Mode)
app.get('/api/path', checkDbConnection, async (req: Request, res: Response) => {
  const { from, to } = req.query;
  if (!from || !to) {
    res.status(400).json({ error: "Missing 'from' or 'to' query parameters" });
    return;
  }

  if (isFallbackMode()) {
    const adj: Record<string, string[]> = {};
    people.forEach(p => adj[p.id] = []);
    knowsLinks.forEach(k => {
      adj[k.p1]?.push(k.p2);
      adj[k.p2]?.push(k.p1);
    });

    const queue: string[][] = [[from as string]];
    const visited = new Set<string>([from as string]);
    let foundPath: string[] | null = null;

    while (queue.length > 0) {
      const currPath = queue.shift()!;
      const node = currPath[currPath.length - 1]!;
      if (node === to) {
        foundPath = currPath;
        break;
      }
      if (currPath.length > 4) continue;
      const neighbors = adj[node] || [];
      for (const nextNode of neighbors) {
        if (!visited.has(nextNode)) {
          visited.add(nextNode);
          queue.push([...currPath, nextNode]);
        }
      }
    }

    if (!foundPath) {
      res.json({ pathFound: false, path: [] });
      return;
    }

    const pathNodes = foundPath.map(id => people.find(p => p.id === id));
    const pathEdges = [];
    for (let i = 0; i < foundPath.length - 1; i++) {
      const u1Id = foundPath[i]!;
      const u2Id = foundPath[i+1]!;
      const link = knowsLinks.find(k => (k.p1 === u1Id && k.p2 === u2Id) || (k.p2 === u1Id && k.p1 === u2Id));
      const u1 = people.find(p => p.id === u1Id);
      const u2 = people.find(p => p.id === u2Id);
      const sharedInterests = u1?.interests.filter((x: string) => u2?.interests.includes(x)) || [];
      const sharedSkills = u1?.skills.filter((x: string) => u2?.skills.includes(x)) || [];

      pathEdges.push({
        from: u1Id,
        to: u2Id,
        relationshipType: link?.relType || "KNOWS",
        strength: link?.strength || 5,
        since: link?.since || 2022,
        sharedInterests,
        sharedSkills
      });
    }

    res.json({ pathFound: true, nodes: pathNodes, edges: pathEdges });
    return;
  }

  const driver = getDriver();
  const session = driver.session();
  try {
    const pathRes = await session.run(
      `MATCH (start:Person {id: $from})
       MATCH (target:Person {id: $to})
       MATCH path = shortestPath((start)-[:KNOWS*..4]-(target))
       RETURN path`,
      { from, to }
    );

    const pathRecord = pathRes.records[0]?.get('path');
    if (!pathRecord) {
      res.json(toNative({ pathFound: false, path: [] }));
      return;
    }
    const segments = pathRecord.segments;

    // Load full details for all node IDs in the path to calculate overlaps and metadata
    const nodeIds = [pathRecord.start.properties.id, ...segments.map((seg: any) => seg.end.properties.id)];

    const detailsRes = await session.run(
      `MATCH (p:Person)
       WHERE p.id IN $nodeIds
       OPTIONAL MATCH (p)-[:WORKS_AT]->(co:Company)
       OPTIONAL MATCH (p)-[:LIVES_IN]->(ci:City)
       OPTIONAL MATCH (p)-[:HAS_SKILL]->(sk:Skill)
       OPTIONAL MATCH (p)-[:HAS_INTEREST]->(int:Interest)
       WITH p, co, ci, collect(DISTINCT sk.name) AS skills, collect(DISTINCT int.name) AS interests
       RETURN p {.*, company: co.name, city: ci.name, skills: skills, interests: interests} AS person`,
      { nodeIds }
    );

    const personMap = new Map();
    detailsRes.records.forEach(rec => {
      const p = rec.get('person');
      personMap.set(p.id, p);
    });

    const nodes = nodeIds.map(id => personMap.get(id));
    const edges = segments.map((seg: any) => {
      const u1 = personMap.get(seg.start.properties.id);
      const u2 = personMap.get(seg.end.properties.id);

      // Find shared interests/skills
      const sharedInterests = u1.interests.filter((i: string) => u2.interests.includes(i));
      const sharedSkills = u1.skills.filter((s: string) => u2.skills.includes(s));

      return {
        from: seg.start.properties.id,
        to: seg.end.properties.id,
        relationshipType: seg.relationship.properties.relationship_type || "Knows",
        strength: getNumber(seg.relationship.properties.strength) || 5,
        since: seg.relationship.properties.since || "",
        sharedInterests,
        sharedSkills
      };
    });

    res.json(toNative({
      pathFound: true,
      nodes,
      edges
    }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// 8. List Interests (Fallback Mode supported)
app.get('/api/interests', checkDbConnection, async (req: Request, res: Response) => {
  if (isFallbackMode()) {
    const list = interests.map(i => {
      const count = hasInterestLinks.filter(l => l.interestId === i.id).length;
      return { id: i.id, name: i.name, count };
    }).sort((a, b) => a.name.localeCompare(b.name));
    res.json(list);
    return;
  }

  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (i:Interest)
       OPTIONAL MATCH (i)<-[:HAS_INTEREST]-(p:Person)
       RETURN i.id AS id, i.name AS name, count(p) AS count
       ORDER BY name ASC`
    );
    const interestsResult = result.records.map(rec => ({
      id: rec.get('id'),
      name: rec.get('name'),
      count: getNumber(rec.get('count'))
    }));
    res.json(toNative(interestsResult));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// 9. Interest Detail (Query 7 / Fallback Mode)
app.get('/api/interests/:id/people', checkDbConnection, async (req: Request, res: Response) => {
  const { id } = req.params;

  if (isFallbackMode()) {
    const matchingIds = hasInterestLinks.filter(l => l.interestId === id).map(l => l.personId);
    const matchingPeople = people.filter(p => matchingIds.includes(p.id));
    res.json(matchingPeople);
    return;
  }

  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (i:Interest {id: $id})<-[:HAS_INTEREST]-(p:Person)
       OPTIONAL MATCH (p)-[:WORKS_AT]->(co:Company)
       OPTIONAL MATCH (p)-[:LIVES_IN]->(ci:City)
       RETURN p {.*, company: co.name, city: ci.name} AS person`,
      { id }
    );
    const peopleResult = result.records.map(rec => rec.get('person'));
    res.json(toNative(peopleResult));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// 10. Unified Graph Visualization Data (Full or ego-network filter / Fallback Mode)
app.get('/api/graph', checkDbConnection, async (req: Request, res: Response) => {
  const { personId, interestId } = req.query;

  if (isFallbackMode()) {
    const nodesMap = new Map();
    const addNode = (id: string, label: string, type: string, props: any = {}) => {
      if (!nodesMap.has(id)) {
        nodesMap.set(id, { id, label, type, ...props });
      }
    };
    if (personId) {
      const p = people.find(x => x.id === personId);
      if (p) {
        addNode(p.id, p.name, 'Person', p);
        const peers = knowsLinks
          .filter(k => k.p1 === personId || k.p2 === personId)
          .map(k => k.p1 === personId ? k.p2 : k.p1);
        peers.forEach(peerId => {
          const peer = people.find(x => x.id === peerId);
          if (peer) addNode(peer.id, peer.name, 'Person', peer);
        });
        const co = companies.find(c => c.name === p.company);
        if (co) addNode(co.id, co.name, 'Company');
        const ci = cities.find(c => c.name === p.city);
        if (ci) addNode(ci.id, ci.name, 'City');
      }
    } else if (interestId) {
      const iNode = interests.find(x => x.id === interestId);
      if (iNode) {
        addNode(iNode.id, iNode.name, 'Interest');
        const matches = hasInterestLinks.filter(l => l.interestId === interestId).map(l => l.personId);
        matches.forEach(pid => {
          const p = people.find(x => x.id === pid);
          if (p) {
            addNode(p.id, p.name, 'Person', p);
            const co = companies.find(c => c.name === p.company);
            if (co) addNode(co.id, co.name, 'Company');
          }
        });
      }
    } else {
      people.slice(0, 35).forEach(p => {
        addNode(p.id, p.name, 'Person', p);
        const co = companies.find(c => c.name === p.company);
        if (co) addNode(co.id, co.name, 'Company');
      });
    }

    const nodeIds = Array.from(nodesMap.keys());
    const edges = knowsLinks
      .filter(k => nodeIds.includes(k.p1) && nodeIds.includes(k.p2))
      .map((k, idx) => ({
        id: `rel_${idx}`,
        source: k.p1,
        target: k.p2,
        type: "KNOWS"
      }));

    res.json({ nodes: Array.from(nodesMap.values()), edges });
    return;
  }

  const driver = getDriver();
  const session = driver.session();

  try {
    let nodesQuery = '';
    let params: any = {};

    if (personId) {
      nodesQuery = `
        MATCH (p:Person {id: $personId})
        OPTIONAL MATCH (p)-[r:KNOWS]-(other:Person)
        OPTIONAL MATCH (p)-[:WORKS_AT]->(co:Company)
        OPTIONAL MATCH (p)-[:LIVES_IN]->(ci:City)
        OPTIONAL MATCH (p)-[:MEMBER_OF]->(comm:Community)
        RETURN p, collect(DISTINCT other) AS peers, collect(DISTINCT co) AS companies, collect(DISTINCT ci) AS cities, collect(DISTINCT comm) AS communities
      `;
      params.personId = personId;
    } else if (interestId) {
      nodesQuery = `
        MATCH (i:Interest {id: $interestId})<-[:HAS_INTEREST]-(p:Person)
        OPTIONAL MATCH (p)-[:WORKS_AT]->(co:Company)
        RETURN i, collect(DISTINCT p) AS people, collect(DISTINCT co) AS companies
      `;
      params.interestId = interestId;
    } else {
      nodesQuery = `
        MATCH (p:Person)
        WITH p LIMIT 35
        OPTIONAL MATCH (p)-[:WORKS_AT]->(co:Company)
        OPTIONAL MATCH (p)-[:MEMBER_OF]->(comm:Community)
        RETURN collect(DISTINCT p) AS people, collect(DISTINCT co) AS companies, collect(DISTINCT comm) AS communities
      `;
    }

    const nodesResult = await session.run(nodesQuery, params);

    const nodesMap = new Map();
    const addNode = (id: string, label: string, type: string, props: any = {}) => {
      if (!nodesMap.has(id)) {
        nodesMap.set(id, { id, label, type, ...props });
      }
    };

    const rec = nodesResult.records[0];
    if (personId && rec) {
      const p = rec.get('p');
      if (p) addNode(p.properties.id, p.properties.name, 'Person', p.properties);

      rec.get('peers').forEach((peer: any) => {
        if (peer) addNode(peer.properties.id, peer.properties.name, 'Person', peer.properties);
      });
      rec.get('companies').forEach((co: any) => {
        if (co) addNode(co.properties.id, co.properties.name, 'Company');
      });
      rec.get('cities').forEach((ci: any) => {
        if (ci) addNode(ci.properties.id, ci.properties.name, 'City');
      });
      rec.get('communities').forEach((comm: any) => {
        if (comm) addNode(comm.properties.id, comm.properties.name, 'Community');
      });
    } else if (interestId && rec) {
      const iNode = rec.get('i');
      if (iNode) addNode(iNode.properties.id, iNode.properties.name, 'Interest');

      rec.get('people').forEach((p: any) => {
        if (p) addNode(p.properties.id, p.properties.name, 'Person', p.properties);
      });
      rec.get('companies').forEach((co: any) => {
        if (co) addNode(co.properties.id, co.properties.name, 'Company');
      });
    } else if (rec) {
      rec.get('people')?.forEach((p: any) => {
        if (p) addNode(p.properties.id, p.properties.name, 'Person', p.properties);
      });
      rec.get('companies')?.forEach((co: any) => {
        if (co) addNode(co.properties.id, co.properties.name, 'Company');
      });
      rec.get('communities')?.forEach((comm: any) => {
        if (comm) addNode(comm.properties.id, comm.properties.name, 'Community');
      });
    }

    const nodeIds = Array.from(nodesMap.keys());

    // Get relationships between these loaded nodes
    const edgeRes = await session.run(
      `MATCH (n)-[r]->(m)
       WHERE n.id IN $nodeIds AND m.id IN $nodeIds
       RETURN id(r) AS relId, n.id AS source, m.id AS target, type(r) AS type`,
      { nodeIds }
    );

    const edges = edgeRes.records.map(rec => ({
      id: rec.get('relId').toString(),
      source: rec.get('source'),
      target: rec.get('target'),
      type: rec.get('type')
    }));

    res.json(toNative({
      nodes: Array.from(nodesMap.values()),
      edges
    }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// Seed database endpoint
app.post('/api/seed', checkDbConnection, async (req: Request, res: Response) => {
  if (isFallbackMode()) {
    res.json({ message: "Seeding mock mode. Seeding mock mode in-memory resets automatically." });
    return;
  }
  const result = await runSeed();
  if (result.success) {
    res.json({ message: "Database seeded successfully!" });
  } else {
    res.status(500).json({ error: "Failed to seed database", details: result.error });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
