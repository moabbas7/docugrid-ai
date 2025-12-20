
export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING_SCHEMA = 'ANALYZING_SCHEMA',
  EXTRACTING_DATA = 'EXTRACTING_DATA',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface FileWithPreview {
  file: File;
  id: string;
  previewUrl?: string; // Only for images
  base64?: string; // Stored for persistence
  type: 'pdf' | 'image' | 'docx';
}

export interface SchemaField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'currency' | 'party' | 'clause';
  description: string;
}

// Fixed Universal Schema Definition
export const UNIVERSAL_SCHEMA: SchemaField[] = [
  { key: 'documentType', label: 'Document Type', type: 'text', description: 'The specific type of legal document (e.g. Commercial Lease, NDA, Employment Contract).' },
  { key: 'partyA', label: 'Party A', type: 'party', description: 'The first primary party (e.g. Landlord, Employer, Disclosing Party).' },
  { key: 'partyB', label: 'Party B', type: 'party', description: 'The second primary party (e.g. Tenant, Employee, Receiving Party).' },
  { key: 'effectiveDate', label: 'Effective Date', type: 'date', description: 'The start date of the agreement.' },
  { key: 'endDate', label: 'End Date / Term', type: 'text', description: 'The expiration date or duration of the agreement.' },
  { key: 'renewalTerms', label: 'Renewal Terms', type: 'text', description: 'Auto-renewal status, period, and notice requirements.' },
  { key: 'terminationClause', label: 'Termination', type: 'clause', description: 'Early termination rights, fees, and conditions.' },
  { key: 'jurisdiction', label: 'Jurisdiction', type: 'text', description: 'Governing law and jurisdiction location.' },
  { key: 'keyValue', label: 'Key Value', type: 'currency', description: 'The main financial value (e.g. Rent, Salary, Contract Value, Liability Cap).' },
  { key: 'noticePeriod', label: 'Notice Period', type: 'text', description: 'Notice required for termination.' },
  { key: 'riskFlags', label: 'Risk Flags', type: 'text', description: 'Specific risk factors or unusual terms identified.' }
];

export interface ExtractionValue {
  value: string;
  confidence: number;
  sourceQuote: string;
}

export interface RiskAssessment {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
  summary: string;
}

export interface RedlineSuggestion {
  current: string;
  suggested: string;
}

export interface ExtractedDocument {
  id: string;
  fileName: string;
  data: Record<string, ExtractionValue>;
  risk: RiskAssessment;
  reviewed?: boolean;
  tags: string[];
  aiSummary?: string;
  redlines?: RedlineSuggestion[];
}

export interface BatchInsight {
  type: 'risk' | 'financial' | 'date' | 'general';
  text: string;
  relatedDocIds: string[];
}

export interface SavedFile {
  id: string;
  name: string;
  type: string;
  data: string;
  previewUrl?: string;
  docType: 'pdf' | 'image' | 'docx';
}

export interface SavedProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  files: SavedFile[];
  documents: ExtractedDocument[];
  insights: BatchInsight[];
  settings?: {
    darkMode: boolean;
  };
}

export interface AppState {
  status: AppStatus;
  statusMessage: string;
  schema: SchemaField[];
  documents: ExtractedDocument[];
  files: FileWithPreview[];
  insights: BatchInsight[];
  filteredDocIds: string[] | null;
  compareMode: boolean;
  selectedDocIds: string[];
  activeRiskFilter: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  activeTagFilter: string | null;
}
