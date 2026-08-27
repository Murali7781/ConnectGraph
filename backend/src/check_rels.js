import { getDriver } from './db.js';
async function runCheck() {
    const driver = getDriver();
    const session = driver.session();
    try {
        const res = await session.run('MATCH (a)-[r]->(b) RETURN type(r) AS type, count(r) AS count');
        res.records.forEach(rec => {
            console.log(rec.get('type'), rec.get('count').toNumber());
        });
    }
    catch (err) {
        console.error(err);
    }
    finally {
        await session.close();
        await driver.close();
    }
}
runCheck();
