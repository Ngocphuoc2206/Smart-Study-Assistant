//#region Intent Detect
export type IntentConfig = {
    name: string;
    description: string;
    keywords_any: string[];
    required?: string[];
    excluded?: string[];
    priority?: number;
}

export type RootConfig = {
    defaultIntent: string;
    minScore: number;
    intents: IntentConfig[];
}

//#endregion