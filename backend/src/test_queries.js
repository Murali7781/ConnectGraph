import { checkConnection, getDriver } from './db.js';
import neo4j from 'neo4j-driver';
function getNumber(val) {
    if (val === null || val === undefined)
        return 0;
    if (neo4j.isInt(val)) {
        return val.toNumber();
    }
    return Number(val);
}
async function runTests() {
    console.log("=== STARTING BACKEND QUERIES VERIFICATION ===");
    // 1. Test database connection
    const conn = await checkConnection();
    if (!conn.connected) {
        console.error("FAIL: CognoDB connection check failed!", conn.error);
        process.exit(1);
    }
    console.log("PASS: CognoDB connection verified successfully!");
    const driver = getDriver();
    const session = driver.session();
    try {
        // 2. Test Network Statistics
        console.log("\nTesting Query: Network Statistics...");
        const pCount = await session.run("MATCH (p:Person) RETURN count(p) AS count");
        const iCount = await session.run("MATCH (i:Interest) RETURN count(i) AS count");
        const knowsCount = await session.run("MATCH ()-[r:KNOWS]->() RETURN count(r) AS count");
        console.log(`- People Count: ${getNumber(pCount.records[0]?.get('count'))}`);
        console.log(`- Interest Count: ${getNumber(iCount.records[0]?.get('count'))}`);
        console.log(`- KNOWS Connections Count: ${getNumber(knowsCount.records[0]?.get('count'))}`);
        console.log("PASS: Network statistics queried successfully!");
        // 3. Test Person Search
        console.log("\nTesting Query: Person Search (by skill Python)...");
        const searchRes = await session.run(`
      MATCH (p:Person)-[:HAS_SKILL]->(s:Skill {name: $skill})
      RETURN p.name AS name, s.name AS skill
      LIMIT 3
    `, { skill: "Python" });
        searchRes.records.forEach(r => {
            console.log(`- Found: ${r.get('name')} (Skill: ${r.get('skill')})`);
        });
        console.log("PASS: Skill-based search queried successfully!");
        // 4. Test Direct Connections
        console.log("\nTesting Query: Direct Connections for person_1...");
        const directRes = await session.run(`
      MATCH (p:Person {id: $id})-[r:KNOWS]-(other:Person)
      RETURN other.name AS name, r.relationship_type AS type
      LIMIT 3
    `, { id: "person_1" });
        directRes.records.forEach(r => {
            console.log(`- Knows: ${r.get('name')} (Type: ${r.get('type')})`);
        });
        console.log("PASS: Direct connections queried successfully!");
        // 5. Test Mutual Connections
        console.log("\nTesting Query: Mutual Connections (person_1 and person_2)...");
        const mutualRes = await session.run(`
      MATCH (p1:Person {id: $id1})-[r1:KNOWS]-(m:Person)-[r2:KNOWS]-(p2:Person {id: $id2})
      RETURN m.name AS name
      LIMIT 3
    `, { id1: "person_1", id2: "person_2" });
        mutualRes.records.forEach(r => {
            console.log(`- Mutual connection: ${r.get('name')}`);
        });
        console.log("PASS: Mutual connections queried successfully!");
        // 6. Test Multi-hop Traversal
        console.log("\nTesting Query: Multi-Hop Introduction Path (person_1 to person_50)...");
        const pathRes = await session.run(`
      MATCH (start:Person {id: $id1})
      MATCH (target:Person {id: $id2})
      MATCH path = shortestPath((start)-[:KNOWS*..4]-(target))
      RETURN [n IN nodes(path) | n.name] AS names
    `, { id1: "person_1", id2: "person_50" });
        if (pathRes.records.length > 0) {
            console.log(`- Introduction path found: ${pathRes.records[0]?.get('names').join(' -> ')}`);
        }
        else {
            console.log("- No path found between person_1 and person_50 within 4 hops.");
        }
        console.log("PASS: Multi-hop traversal queried successfully!");
        // 7. Test Recommendations Scoring
        console.log("\nTesting Query: Smart Connection Recommendations for person_1...");
        const recsRes = await session.run(`
      MATCH (p:Person {id: $id})
      MATCH (other:Person)
      WHERE other.id <> $id
      AND NOT (p)-[:KNOWS]-(other)
      
      OPTIONAL MATCH (p)-[:WORKS_AT]->(co:Company)<-[:WORKS_AT]-(other)
      WITH p, other, CASE WHEN co IS NOT NULL THEN 3 ELSE 0 END AS companyScore
      
      OPTIONAL MATCH (p)-[:MEMBER_OF]->(comm:Community)<-[:MEMBER_OF]-(other)
      WITH p, other, companyScore, CASE WHEN comm IS NOT NULL THEN 2 ELSE 0 END AS communityScore
      
      OPTIONAL MATCH (p)-[:HAS_INTEREST]->(i:Interest)<-[:HAS_INTEREST]-(other)
      WITH p, other, companyScore, communityScore, count(DISTINCT i) * 5 AS interestScore
      
      OPTIONAL MATCH (p)-[:HAS_SKILL]->(s:Skill)<-[:HAS_SKILL]-(other)
      WITH p, other, companyScore, communityScore, interestScore, count(DISTINCT s) * 3 AS skillScore
      
      OPTIONAL MATCH (p)-[:KNOWS]-(m:Person)-[:KNOWS]-(other)
      WITH other, (companyScore + communityScore + interestScore + skillScore + count(DISTINCT m) * 4) AS score
      WHERE score > 0
      RETURN other.name AS name, score
      ORDER BY score DESC
      LIMIT 3
    `, { id: "person_1" });
        recsRes.records.forEach(r => {
            console.log(`- Recommended: ${r.get('name')} (Score: ${getNumber(r.get('score'))})`);
        });
        console.log("PASS: Smart recommendations queried successfully!");
        console.log("\n=== ALL TEST CASES PASSED SUCCESSFULLY ===");
    }
    catch (err) {
        console.error("FAIL: Error executing verification queries:", err.message);
        process.exit(1);
    }
    finally {
        await session.close();
        await driver.close();
    }
}
runTests();
//# sourceMappingURL=test_queries.js.map