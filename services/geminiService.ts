
import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { SchemaField, ExtractedDocument, RiskAssessment, ExtractionValue, BatchInsight, FileWithPreview, RedlineSuggestion } from "../types";
import mammoth from "mammoth";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callGeminiWithRetry<T>(
  apiCall: () => Promise<T>, 
  retries = 3, 
  initialDelay = 2000
): Promise<T> {
  try {
    return await apiCall();
  } catch (error: any) {
    const isRateLimit = error?.status === 429 || error?.code === 429 || error?.message?.includes('429') || error?.message?.includes('quota');
    if (isRateLimit && retries > 0) {
      await wait(initialDelay);
      return callGeminiWithRetry(apiCall, retries - 1, initialDelay * 2);
    }
    throw error;
  }
}

export const processFile = async (file: File): Promise<{ base64: string, text?: string, mimeType: string }> => {
  const getBase64 = (): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

  const base64 = await getBase64();
  if (file.name.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return { base64, text: result.value, mimeType: 'text/plain' };
  }
  return { base64, mimeType: file.type };
};

export const extractDocumentData = async (
  fileData: { base64: string, text?: string, mimeType: string },
  fileName: string,
  fileId: string,
  schemaFields: SchemaField[]
): Promise<ExtractedDocument> => {
  const dataProperties: Record<string, Schema> = {};
  schemaFields.forEach(field => {
    dataProperties[field.key] = {
      type: Type.OBJECT,
      properties: {
        value: { type: Type.STRING },
        confidence: { type: Type.NUMBER },
        sourceQuote: { type: Type.STRING }
      },
      required: ["value", "sourceQuote"]
    };
  });

  const extractionSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      extractedData: { type: Type.OBJECT, properties: dataProperties, required: schemaFields.map(f => f.key) },
      riskAnalysis: {
        type: Type.OBJECT,
        properties: {
          level: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
          flags: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING }
        },
        required: ["level", "flags", "summary"]
      }
    },
    required: ["extractedData", "riskAnalysis"]
  };

  const contents = [];
  if (fileData.text) {
     contents.push({ text: `Analyze this text: \n\n${fileData.text}` });
  } else {
     contents.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.base64 } });
  }
  contents.push({ text: "Extract structured data based on the provided schema and perform risk analysis." });

  const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: contents },
    config: { responseMimeType: "application/json", responseSchema: extractionSchema }
  }));

  const result = JSON.parse(response.text);
  return { id: fileId, fileName, data: result.extractedData, risk: result.riskAnalysis, tags: [] };
};

export const suggestRedlines = async (file: FileWithPreview): Promise<RedlineSuggestion[]> => {
  const contents = [];
  if (file.type === 'docx') {
    const arrayBuffer = await file.file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    contents.push({ text: result.value });
  } else {
    contents.push({ inlineData: { mimeType: file.file.type, data: file.base64 || '' } });
  }

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      suggestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            current: { type: Type.STRING },
            suggested: { type: Type.STRING }
          },
          required: ["current", "suggested"]
        }
      }
    },
    required: ["suggestions"]
  };

  const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        ...contents,
        { text: "Review this contract and suggest 3-5 specific improvements to favor the client. Return pairs of current vs suggested text." }
      ]
    },
    config: { responseMimeType: "application/json", responseSchema: schema }
  }));

  return JSON.parse(response.text).suggestions;
};

export const generateBatchInsights = async (documents: ExtractedDocument[]): Promise<BatchInsight[]> => {
  const summary = documents.map(d => ({ id: d.id, name: d.fileName, risk: d.risk.level, data: Object.fromEntries(Object.entries(d.data).map(([k, v]) => [k, v.value])) }));
  const schema: Schema = { type: Type.OBJECT, properties: { insights: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['risk', 'financial', 'date', 'general'] }, text: { type: Type.STRING }, relatedDocIds: { type: Type.ARRAY, items: { type: Type.STRING } } } } } } };
  const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: `Analyze legal data and generate 3-5 batch insights: ${JSON.stringify(summary)}` }] },
    config: { responseMimeType: "application/json", responseSchema: schema }
  }));
  return JSON.parse(response.text).insights;
};

export const processNaturalLanguageQuery = async (query: string, documents: ExtractedDocument[]): Promise<string[]> => {
  const summary = documents.map(d => ({ id: d.id, name: d.fileName, data: Object.fromEntries(Object.entries(d.data).map(([k, v]) => [k, v.value])) }));
  const schema: Schema = { type: Type.OBJECT, properties: { matchingIds: { type: Type.ARRAY, items: { type: Type.STRING } } } };
  const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: `Query: "${query}". Return matching IDs from: ${JSON.stringify(summary)}` }] },
    config: { responseMimeType: "application/json", responseSchema: schema }
  }));
  return JSON.parse(response.text).matchingIds;
};

export const generateComparisonSummary = async (documents: ExtractedDocument[]): Promise<string> => {
  const summaryData = documents.map(d => ({ name: d.fileName, risk: d.risk.level, data: Object.fromEntries(Object.entries(d.data).map(([k, v]) => [k, v.value])) }));
  const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: `Compare these docs: ${JSON.stringify(summaryData)}` }] }
  }));
  return response.text || "Summary unavailable.";
};

export const generateExecutiveSummary = async (file: FileWithPreview): Promise<string> => {
  const contents = [];
  if (file.type === 'docx') {
    const arrayBuffer = await file.file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    contents.push({ text: result.value });
  } else {
    contents.push({ inlineData: { mimeType: file.file.type, data: file.base64 || '' } });
  }
  const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [...contents, { text: "Summarize the key terms in 3-4 sentences." }] }
  }));
  return response.text || "Summary unavailable.";
};

export const askDocumentQuestion = async (file: FileWithPreview, question: string): Promise<string> => {
  const contents = [];
  if (file.type === 'docx') {
    const arrayBuffer = await file.file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    contents.push({ text: result.value });
  } else {
    contents.push({ inlineData: { mimeType: file.file.type, data: file.base64 || '' } });
  }
  const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [...contents, { text: `Question: ${question}` }] }
  }));
  return response.text || "I couldn't find an answer.";
};
