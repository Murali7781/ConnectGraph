import { Driver } from 'neo4j-driver';
export declare function getDriver(): Driver;
export declare function isFallbackMode(): boolean;
export declare function setFallbackMode(active: boolean): void;
export declare function checkConnection(): Promise<{
    connected: boolean;
    error?: string;
    fallback?: boolean;
}>;
export declare function toNative(val: any): any;
//# sourceMappingURL=db.d.ts.map