export declare const citiesList: string[];
export declare const cities: {
    id: string;
    name: string;
}[];
export declare const companiesList: string[];
export declare const companies: {
    id: string;
    name: string;
}[];
export declare const communities: {
    id: string;
    name: string;
}[];
export declare const interests: {
    id: string;
    name: string;
    commId: string;
}[];
export declare const skills: {
    id: string;
    name: string;
    commId: string;
}[];
export declare const people: any[];
export declare const livesInLinks: {
    personId: string;
    cityName: string;
}[];
export declare const worksAtLinks: {
    personId: string;
    compName: string;
    role: string;
    start_year: number;
}[];
export declare const memberOfLinks: {
    personId: string;
    commId: string;
}[];
export declare const hasInterestLinks: {
    personId: string;
    interestId: string;
    level: number;
}[];
export declare const hasSkillLinks: {
    personId: string;
    skillId: string;
    level: number;
    years: number;
}[];
export declare const knowsLinks: {
    p1: string;
    p2: string;
    since: number;
    strength: number;
    relType: string;
}[];
//# sourceMappingURL=mockData.d.ts.map