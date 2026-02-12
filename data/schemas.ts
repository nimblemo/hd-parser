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
    circuit?: string;
    subCircuit?: string;
}

export interface Channel {
    name?: string;
    description: string;
    circuit?: string;
    subCircuit?: string;
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
    circuits?: Record<string, CircuitGroup>;
}

export interface SubCircuit {
    name: string;
    description: string;
}

export interface CircuitGroup {
    name: string;
    description: string;
    sub_circuits: Record<string, SubCircuit>;
}

export interface CircuitMapping {
    circuits: Record<string, CircuitGroup>;
    gateMapping: Record<string, string>;
    channelMapping: Record<string, string>;
}
