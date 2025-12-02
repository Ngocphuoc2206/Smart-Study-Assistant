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

export type VNIntentName = 'add_event' | 'find_event' | 'unknown' | 'error';

export type VNEntities = {
    title?: string;
    type?: 'exam' | 'assignment' | 'lecture' | 'other';
    date?: string; // YYYY-MM-DD
    timeStart?: string; // HH:mm
    timeEnd?: string;
    courseName?: string;
    location?: string;
    reminder?: number[];
    missingEntities?: string[];
}

export type DetectedIntent = {
    name: VNIntentName;
    confidence?: number;
    entities: VNEntities;
}

export function mapIntentName(raw: string): VNIntentName {
    const s = (raw || '').toLowerCase().trim()
      .replace(/\s+/g, '_')
      .replace(/[^\w]/g, '');

    if (
      /^(add|add_event|addevent|create|create_event|createevent)$/.test(s) ||
      /^(them|them_su_kien|tao|tao_su_kien)$/.test(s)
    ) return 'add_event';
    
    if (
      /^(find|find_event|findevent|search|search_event|searchevent|lookup)$/.test(s) ||
      /^(tim|tim_kiem|tim_su_kien|liet_ke|loc)$/.test(s)
    ) return 'find_event';
  
    if (/^(error|failed)$/.test(s)) return 'error';
  
    return 'unknown';
  }
//#endregion