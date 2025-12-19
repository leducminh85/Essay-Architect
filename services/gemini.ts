import { GoogleGenAI, Type } from "@google/genai";
import { GenerationConfig, OutlineItem } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// --- SINGLE ITEM GENERATION (Legacy/Manual usage) ---

const createPrompt = (
  point: string,
  level: number,
  fullContext: string,
  accumulatedText: string,
  nextPoints: string[],
  config: GenerationConfig,
  isLastItem: boolean
): string => {
  const nextContext = nextPoints.slice(0, 3).join("; ");

  let roleInstruction = "";
  if (level === 0) {
    roleInstruction = "This is the MAIN TITLE. Task: Write a brief introductory paragraph (about 3-4 sentences) to evoke the issue, create curiosity, and transition smoothly to the detailed points below.";
  } else if (level > 0) {
    roleInstruction = "This is a DETAILED ARGUMENT. Task: Analyze deeply, dissect the issue from many angles.";
  }

  // Determine length instruction based on config
  let lengthInstruction = "";
  if (config.detailLevel === 'detailed') {
    lengthInstruction = "VERY LONG AND DETAILED (150 - 250 words). Write a full-bodied paragraph. Expand the idea to the maximum by: giving real-world examples, data (reasonable assumptions), comparisons, or counter-arguments. Absolutely do not write skimpily.";
  } else if (config.detailLevel === 'brief') {
    lengthInstruction = "Concise (50-80 words), go straight to the point.";
  } else {
    lengthInstruction = "Medium (100-150 words). Analyze fully, concise sentences.";
  }

  // Join tones if it's an array
  const toneString = Array.isArray(config.tone) ? config.tone.join(', ') : config.tone;

  return `
You are a professional writer writing a Long-form Essay.
Linear writing process.

FULL OUTLINE:
${fullContext}

PREVIOUSLY WRITTEN CONTENT (Context):
"""
${accumulatedText ? accumulatedText.slice(-2000) : "[None yet]"}
"""

CURRENT TASK: Write for the section "${point}"
CONTEXT OF THIS SECTION: ${roleInstruction}

AVOID REPETITION: Do not write the ideas of: "${nextContext}..."
OUTPUT LANGUAGE: ${config.language}.
TONE: ${toneString}.
REQUIRED LENGTH: ${lengthInstruction}
${isLastItem ? "This is the final part. Write a complete and profound conclusion." : "The essay is not finished, DO NOT write a summary conclusion."}
`;
};

export const generateParagraph = async (
  point: string,
  level: number,
  fullContext: string,
  accumulatedText: string,
  nextPoints: string[],
  config: GenerationConfig,
  isLastItem: boolean
): Promise<string> => {
  try {
    const prompt = createPrompt(point, level, fullContext, accumulatedText, nextPoints, config, isLastItem);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// --- BATCH GENERATION (Optimized for Rate Limits) ---

export const generateBatch = async (
  itemsToGenerate: OutlineItem[],
  fullContext: string,
  accumulatedText: string,
  nextPointsOutsideBatch: string[],
  config: GenerationConfig,
  isLastBatch: boolean
): Promise<{ id: string; content: string }[]> => {
  try {
    const pointsList = itemsToGenerate.map(i => `- [ID: ${i.id}] Idea: "${i.originalText}" (Level: ${i.level})`).join("\n");
    const nextContext = nextPointsOutsideBatch.slice(0, 3).join("; ");

    // Length instruction logic for batch
    let batchLengthInstruction = "";
    if (config.detailLevel === 'detailed') {
      batchLengthInstruction = "LEVEL: VERY LONG & IN-DEPTH. Each sub-item (Level > 0) must be written into a large paragraph (minimum 150-200 words/item). Dig deep, provide reasoning, evidence, illustrative examples. Do not be afraid to write long.";
    } else if (config.detailLevel === 'brief') {
      batchLengthInstruction = "LEVEL: Concise. Each item about 50-80 words.";
    } else {
      batchLengthInstruction = "LEVEL: Medium. Each item about 100-120 words, fully fleshed out.";
    }

    const toneString = Array.isArray(config.tone) ? config.tone.join(', ') : config.tone;

    const prompt = `
You are a professional writer writing a super long and extremely detailed essay.
Below is a group of consecutive points that need to be written into text.

1. FULL ESSAY CONTEXT:
${fullContext}

2. PREVIOUSLY WRITTEN CONTENT (Context for flow):
"""
${accumulatedText ? accumulatedText.slice(-2000) : "[Introduction]"}
"""

3. TASK (BATCH PROCESSING):
Write content for **each item** in the list below.

LIST TO WRITE:
${pointsList}

4. CONTENT TO WRITE LATER (DO NOT WRITE THIS):
"${nextContext}..."

IMPORTANT REQUIREMENTS:
- Output Language: ${config.language}.
- Tone: ${toneString}.
- **${batchLengthInstruction}**
- For Level 0 items (Title): Write a good, evocative introduction (about 3-5 sentences).
- Flow: Ensure the paragraph of the previous item leads naturally to the paragraph of the next item.
- ${isLastBatch ? "If the last item in the list is the conclusion, write a truly good and meaningful conclusion." : "Absolutely DO NOT write a concluding sentence (In conclusion, To sum up) at the end of this batch because the essay continues."}

OUTPUT FORMAT:
Return JSON strictly according to schema. Each item in the input list must have a corresponding output entry. Content in JSON must be plain text, no markdown.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  content: { type: Type.STRING },
                },
                required: ["id", "content"],
              },
            },
          },
          required: ["results"],
        },
      },
    });

    const json = JSON.parse(response.text || "{}");
    return json.results || [];
  } catch (error) {
    console.error("Gemini Batch Error:", error);
    throw error;
  }
};