export interface Gate {
    name: string;
    description: string;
    lines: Record<string, string>;
    crosses: string[];
    center?: string;
    across?: number;
    fear?: string;
    sexuality?: string;
    love?: string;
    business?: string;
}

export interface Channel {
    name?: string;
    description: string;
}

export interface MetaObject {
    name: string;
    description: string;
}

export interface Center extends MetaObject {
    normal: string;
    distorted: string;
}

export interface PHSBlock {
    colors: Record<string, string>;
    tones: Record<string, string>;
}

export interface GatesDatabase {
    gates: Record<string, Gate>;
    channels: Record<string, Channel>;
    centers: Record<string, Center>;
    types: Record<string, MetaObject>;
    profiles: Record<string, MetaObject>;
    authorities: Record<string, MetaObject>;
    crosses: Record<string, MetaObject>;
    diet: PHSBlock;
    motivation: PHSBlock;
    vision: PHSBlock;
    environment: PHSBlock;
}
