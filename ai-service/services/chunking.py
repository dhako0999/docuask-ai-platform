import re


def chunk_text(text: str):
    chunk_size = 1200
    overlap = 200

    cleaned_text = re.sub(r"\s+", " ", text).strip()

    chunks = []
    start = 0
    chunk_index = 0

    while start < len(cleaned_text):
        end = min(start + chunk_size, len(cleaned_text))
        content = cleaned_text[start:end].strip()

        if len(content) > 0:
            chunks.append({
                "content": content,
                "chunk_index": chunk_index,
            })

        start += chunk_size - overlap
        chunk_index += 1

    return chunks 