import { OutlineItem, GenerationStatus } from "../types";

export const parseOutline = (text: string): OutlineItem[] => {
  const lines = text.split('\n');
  const items: OutlineItem[] = [];
  
  lines.forEach((line) => {
    // Skip empty lines
    if (!line.trim()) return;

    // Calculate indentation level (2 spaces or 1 tab = 1 level)
    const leadingSpaces = line.search(/\S|$/);
    const level = Math.floor(leadingSpaces / 2); // Assuming 2 spaces per level, usually sufficient heuristic

    // Clean formatting characters like "- ", "* ", "1. "
    // We keep the original numbering if present in text, but trim whitespace
    const content = line.trim();

    items.push({
      id: crypto.randomUUID(),
      originalText: content,
      level: level,
      generatedText: '',
      status: GenerationStatus.IDLE,
      isSelected: true, // Default to selected for generation
    });
  });

  return items;
};
