export type TextChunk = {
    content: string;
    chunkIndex: number;
  };
  
  export function chunkText(text: string): TextChunk[] {
    const chunkSize = 1200;
    const overlap = 200;
  
    const cleanedText = text.replace(/\s+/g, " ").trim();
  
    const chunks: TextChunk[] = [];
  
    let start = 0;
    let chunkIndex = 0;
  
    while (start < cleanedText.length) {
      const end = Math.min(start + chunkSize, cleanedText.length);
  
      const content = cleanedText.slice(start, end).trim();
  
      if (content.length > 0) {
        chunks.push({
          content,
          chunkIndex,
        });
      }
  
      start += chunkSize - overlap;
      chunkIndex++;
    }
  
    return chunks;
  }