export interface PersonSeed {
    id: string;
    name: string;
    username: string;
    email: string;
    bio: string;
    role: string;
    xp: any;
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
    start_year: any;
}
export interface MemberOfLink {
    personId: string;
    commId: string;
}
export interface HasInterestLink {
    personId: string;
    interestId: string;
    level: any;
}
export interface HasSkillLink {
    personId: string;
    skillId: string;
    level: any;
    years: any;
}
export interface KnowsLink {
    p1: string;
    p2: string;
    since: any;
    strength: any;
    relType: string;
}
export declare function runSeed(): Promise<{
    success: boolean;
    error?: never;
} | {
    success: boolean;
    error: any;
}>;
//# sourceMappingURL=seed.d.ts.map