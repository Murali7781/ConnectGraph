import neo4j, { Driver } from 'neo4j-driver';
import dotenv from 'dotenv';
import path from 'path';
console.log("CWD inside db.ts:", process.cwd());
const result = dotenv.config();
console.log("Dotenv config result:", result);
console.log("Env COGNODB_URI:", process.env.COGNODB_URI);
const uri = process.env.COGNODB_URI || '';
const password = process.env.COGNODB_PASSWORD || '';
const username = process.env.COGNODB_USERNAME || 'cognodb';
let driver;
export function getDriver() {
    if (!driver) {
        if (!uri || !password) {
            console.warn("WARNING: COGNODB_URI or COGNODB_PASSWORD environment variables are missing.");
        }
        driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
    }
    return driver;
}
let fallbackActive = false;
export function isFallbackMode() {
    return fallbackActive;
}
export function setFallbackMode(active) {
    fallbackActive = active;
}
let lastCheckTime = 0;
let cachedStatus = null;
export async function checkConnection() {
    const now = Date.now();
    if (cachedStatus && (now - lastCheckTime < 10000)) {
        return cachedStatus;
    }
    console.log("Inside checkConnection. uri:", uri, "password:", password ? "PROVIDED" : "MISSING");
    if (!uri || !password) {
        fallbackActive = true;
        cachedStatus = { connected: false, error: "Database URI or password not configured in environment variables. Running in static fallback mode.", fallback: true };
        lastCheckTime = now;
        return cachedStatus;
    }
    try {
        const drv = getDriver();
        const session = drv.session();
        await session.run('RETURN 1 AS num');
        await session.close();
        fallbackActive = false;
        cachedStatus = { connected: true };
        lastCheckTime = now;
        return cachedStatus;
    }
    catch (err) {
        console.error("CognoDB connection check failed:", err.message);
        fallbackActive = true;
        cachedStatus = { connected: false, error: err.message, fallback: true };
        lastCheckTime = now;
        return cachedStatus;
    }
}
export function toNative(val) {
    if (val === null || val === undefined) {
        return val;
    }
    if (neo4j.isInt(val)) {
        return val.toNumber();
    }
    if (Array.isArray(val)) {
        return val.map(toNative);
    }
    if (typeof val === 'object') {
        // If it's a Neo4j Node or Relationship, it has properties we need to extract/convert.
        // If it is a generic object, convert its keys.
        if ('properties' in val) {
            return toNative(val.properties);
        }
        const res = {};
        for (const key of Object.keys(val)) {
            res[key] = toNative(val[key]);
        }
        return res;
    }
    return val;
}
//# sourceMappingURL=db.js.map