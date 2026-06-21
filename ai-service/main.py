import os
from fastapi import FastAPI
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

from tasks import process_document

from fastapi.responses import StreamingResponse



load_dotenv()

app = FastAPI()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class AnalyzeDocumentRequest(BaseModel):
    documentName: str
    chunks: list[str]

class AnalyzeDocumentResponse(BaseModel):
    analysis: str

class AnswerQuestionRequest(BaseModel):
    question: str
    context: str
    mode: str = "selected"

class AnswerQuestionResponse(BaseModel):
    answer: str 

class ResearchRequest(BaseModel):
    question: str
    context: str

class ResearchResponse(BaseModel):
    report: str        

class CompareDocumentsRequest(BaseModel):
    documentAName: str
    documentBName: str
    documentAChunks: list[str]
    documentBChunks: list[str]


class CompareDocumentsResponse(BaseModel):
    comparison: str

class ProcessDocumentRequest(BaseModel):
    document_id: str



@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze-document", response_model=AnalyzeDocumentResponse) 
def analyze_document(request: AnalyzeDocumentRequest):
    context = "\n\n".join(
        f"Chunk {index + 1}:\n{chunk}"
        for index, chunk in enumerate(request.chunks)
    )   

    response = client.responses.create(
        model="gpt-5.5",
        instructions="""
You are an agentic document analysis assistant.

Analyze the document using ONLY the provided document chunks.
Do not invent information that is not present in the document.

Formatting Rules:
- Return valid markdown.
- Every section heading MUST begin with ##.
- Do not write section headings as plain text.
- Add a blank line after every heading.
- Use bullet points for lists.
- Every bullet point must start with "- ".
- Separate every major section with this exact horizontal rule: ---
- Never return large walls of text.
- Keep findings concise and actionable.

Source Rules:
- Cite sources whenever making factual claims.
- Example: (Source 2)
- Example: (Sources 1, 3)
- Do not invent source references.
- Only reference sources present in the provided chunks.

Return the analysis in this exact structure:

## Executive Summary

- Summarize what the document is about.
- Explain its primary purpose.
- State the most important takeaway.

---

## Key Points

- List the most important information from the document.
- Cite each factual point.

---

## Technologies, Skills, or Requirements

- List technologies, skills, qualifications, tools, or certifications if applicable.
- If not applicable, write: "No specific technologies or requirements identified."

---

## Risks or Concerns

- Identify missing information, ambiguities, contradictions, risks, unclear expectations, or gaps.
- If none exist, write: "No major risks identified."

---

## Action Items

- Provide practical next steps for the user.

---

## Suggested Follow-Up Questions

- Provide 5–10 useful follow-up questions.

Example output format:

## Overview

- The document discusses public attitudes toward life extension. (Source 1)
- It references survey findings and religious attitudes. (Sources 1, 5)

---

## Main Themes

- Many people support developing life-extension treatments. (Source 4)
- Fewer people say they would personally use them. (Source 4)

---

## Risks or Concerns

- Access may be limited to wealthy people. (Source 3)
- Longer lifespans may strain public systems. (Source 3)
        """,
        input=f"""
        Document name:
        {request.documentName}

        Document chunks:
        {context}
        """,
    )

    return {"analysis": response.output_text}


@app.post("/answer-question", response_model=AnswerQuestionResponse)
def answer_question(request: AnswerQuestionRequest):
    response = client.responses.create(
        model="gpt-5.5",
        instructions= """
You are a document Q&A assistant.

Answer ONLY using the provided retrieved document chunks.
Do not invent information that is not present in the retrieved chunks.

Formatting Rules:
- Return valid markdown.
- Every section heading MUST begin with ##.
- Do not write section headings as plain text.
- Add a blank line after every heading.
- Use bullet points for lists.
- Every bullet point must start with "- ".
- Separate major sections with this exact horizontal rule: ---
- Never return large walls of text.
- Prefer structured answers over long paragraphs.

Question-Specific Rules:

For questions about:
- Responsibilities
- Requirements
- Qualifications
- Skills
- Technologies
- Benefits
- Job Duties

Use this structure:

## Answer

- Point 1
- Point 2
- Point 3

---

## Key Takeaways

- Important takeaway 1
- Important takeaway 2

For summary questions, use:

## Summary

Brief summary.

---

## Key Points

- Point 1
- Point 2
- Point 3

For technology questions, use:

## Technologies

- Technology 1
- Technology 2
- Technology 3

---

## Context

Brief explanation.

Source Rules:
- Cite source numbers and document names when available.
- Example: (Source 1, "Document Name")
- Example: (Sources 1 and 3, "Document Name")
- Do not invent source numbers or document names.
- Only cite sources that appear in the provided chunks.

If the answer is not contained in the retrieved chunks, respond exactly with:

"I could not find that information in the document."

Example Output:

## Responsibilities

- Build and ship features across the stack. (Source 1, "Software Engineer - Full Stack")
- Develop AI agents and moderation workflows. (Source 2, "Software Engineer - Full Stack")
- Improve analytics dashboards. (Source 3, "Software Engineer - Full Stack")

---

## Key Takeaways

- The role requires strong full-stack experience.
- The company places significant emphasis on AI-enabled workflows.
        """,
        input=f"""
      Mode: {request.mode}
      Retrieved document chunks: {request.context}
      User question: {request.question}
        """,
    )

    return {"answer": response.output_text}

@app.post("/research", response_model=ResearchResponse) 
def research(request: ResearchRequest):
    response = client.responses.create(
        model="gpt-5.5",
        instructions="""
You are a document comparison agent.

Compare the two documents using ONLY the provided document chunks.
Do not invent information that is not present in the retrieved content.

Formatting Rules:
- Return valid markdown.
- Every section heading MUST begin with ##.
- Do not write section headings as plain text.
- Add a blank line after every heading.
- Use bullet points for lists.
- Every bullet point must start with "- ".
- Separate every major section with this exact horizontal rule: ---
- Never return large walls of text.
- Keep responses concise and easy to scan.
- Always use a markdown table in the Differences section.

Source Rules:
- Cite sources whenever making factual claims.
- Example: (Document A, Source 2)
- Example: (Document B, Source 4)
- Do not invent source references.
- Only cite sources that appear in the provided content.

Return the comparison in this exact structure:

## Overview

- Briefly explain what Document A is about.
- Briefly explain what Document B is about.
- Summarize the overall purpose of each document.

---

## Similarities

- List important similarities.
- Cite sources for each point.

---

## Differences

| Category | Document A | Document B |
|----------|------------|------------|
| Purpose | ... | ... |
| Technologies | ... | ... |
| Experience Level | ... | ... |
| Responsibilities | ... | ... |

Additional differences:

- Difference 1
- Difference 2
- Difference 3

---

## Missing Information

- Information present in Document A but not Document B.
- Information present in Document B but not Document A.

---

## Risks or Concerns

- Contradictions
- Ambiguities
- Missing requirements
- Potential risks
- Unclear expectations

If no risks are identified, write:

- No major risks identified.

---

## Recommendations

- Provide practical recommendations.
- Explain which document may be more suitable for different goals or scenarios.

---

## Suggested Follow-Up Questions

- Provide 5–10 useful follow-up questions.

Example:

## Overview

- Document A describes a Full Stack Engineering role. (Document A, Source 1)
- Document B describes a Backend Engineering role. (Document B, Source 2)

---

## Similarities

- Both roles require cloud experience. (Document A, Source 3) (Document B, Source 4)
- Both roles involve distributed systems. (Document A, Source 2) (Document B, Source 1)

---

## Differences

| Category | Document A | Document B |
|----------|------------|------------|
| Focus | Full Stack | Backend |
| Frontend | React | Minimal |
| Backend | Python | Go |

Additional differences:

- Document A emphasizes customer-facing features.
- Document B emphasizes infrastructure.

---

## Recommendations

- Document A is better for engineers who enjoy product work.
- Document B is better for engineers interested in systems engineering.

Keep the response concise, structured, highly readable, and easy to compare.
""",
        input=f"""

        Research question:
        {request.question}

        Retrieved evidence:
        {request.context}
        """,
    )   

    return {
        "report": response.output_text
    }


@app.post("/compare-documents", response_model=CompareDocumentsResponse)
def compare_documents(request: CompareDocumentsRequest):
    document_a_context = "\n\n".join(
        f"Document A - Chunk {index + 1}:\n{chunk}"
        for index, chunk in enumerate(request.documentAChunks)
    )

    document_b_context = "\n\n".join(
        f"Document B - Chunk {index + 1}:\n{chunk}"
        for index, chunk in enumerate(request.documentBChunks)
    )

    response = client.responses.create(
        model="gpt-5.5",
        instructions="""
You are a document comparison agent.

Compare the two documents using ONLY the provided document chunks.
Do not invent information that is not present in the retrieved content.

Formatting Rules:
- Return valid markdown.
- Every section heading MUST begin with ##.
- Do not write section headings as plain text.
- Add a blank line after every heading.
- Use bullet points for lists.
- Every bullet point must start with "- ".
- Separate every major section with this exact horizontal rule: ---
- Never return large walls of text.
- Keep responses concise and easy to scan.

Source Rules:
- Cite sources whenever making factual claims.
- Example: (Document A, Source 2)
- Example: (Document B, Source 4)
- Do not invent source references.
- Only cite sources that appear in the provided chunks.

Return the comparison in this exact structure:

## Overview

- Briefly explain what Document A appears to be about.
- Briefly explain what Document B appears to be about.
- Summarize the overall purpose of each document.

---

## Similarities

- List important similarities between the documents.
- Cite sources for each similarity.

---

## Differences

- List important differences between the documents.
- Cite sources for each difference.

---

## Missing Information

- Mention information present in one document but missing from the other.
- Mention information that would be useful but is absent from both documents.

---

## Risks or Concerns

- Identify contradictions.
- Identify ambiguities.
- Identify missing requirements.
- Identify potential risks.
- Identify unclear expectations.

If no risks are identified, write:

- No major risks identified.

---

## Recommendations

- Provide practical recommendations.
- Explain which document may be more suitable for different goals or situations.

---

## Suggested Follow-Up Questions

- Provide 5–10 useful follow-up questions.

Example Output:

## Overview

- Document A describes a Full Stack Engineering role. (Document A, Source 1)
- Document B describes a Backend Engineering role. (Document B, Source 2)

---

## Similarities

- Both roles require cloud experience. (Document A, Source 3) (Document B, Source 4)
- Both roles involve distributed systems. (Document A, Source 2) (Document B, Source 1)

---

## Differences

- Document A emphasizes frontend development. (Document A, Source 1)
- Document B emphasizes backend infrastructure. (Document B, Source 2)

---

## Recommendations

- Document A may be a better fit for engineers who enjoy product work.
- Document B may be a better fit for engineers interested in systems engineering.

Keep the response concise, structured, highly readable, and easy to compare.
        """,
        input=f"""
Document A name:
{request.documentAName}

Document A chunks:
{document_a_context}

Document B name:
{request.documentBName}

Document B chunks:
{document_b_context}
        """,
    )

    return {"comparison": response.output_text}


@app.post("/process-document")
def queue_process_document(request: ProcessDocumentRequest):
    task = process_document.delay(request.document_id)

    return {
        "message": "Document processing queued",
        "document_id": request.document_id,
        "task_id": task.id,
    }  
    

@app.post("/answer-question-stream")
def answer_question_stream(request: AnswerQuestionRequest):
    def generate():
        stream = client.responses.create(
            model="gpt-5.5",
            instructions="""
            You are a document Q&A assistant.

Answer ONLY using the provided document context.
Do not invent information that is not present in the retrieved chunks.

Formatting Rules:
- Use markdown formatting.
- Use H2 headings (##) for major sections.
- Use bullet points for lists.
- Every bullet point must start with "- ".
- Add a blank line between sections.
- Never return large walls of text.
- Prefer structured answers over long paragraphs.

Question-Specific Formatting:
- If the user asks about responsibilities, requirements, qualifications, skills, technologies, benefits, or job duties, use bullet points.
- If the user asks for a summary, organize the answer into sections with headings.
- If the user asks for a comparison, use a markdown table when appropriate.

Source Rules:
- Cite sources inline when relevant, for example:
  (Source 1)
  (Sources 1, 3)
- Do not invent source numbers.
- Only reference sources that appear in the provided context.

If the answer is not contained in the retrieved context, respond with:
"I could not find that information in the document."

Example:

## Responsibilities

- Build and ship features across the stack. (Source 1)
- Develop AI agents and moderation workflows. (Source 2)

## Technologies

- React
- TypeScript
- GraphQL
- Python
            """,
            input=f"""
            Mode:
            {request.mode}

            Retrieved context:
            {request.context}

            User question:
            {request.question}
            """,
            stream=True,
        )

        for event in stream:
            if event.type == "response.output_text.delta":
                yield event.delta

    return StreamingResponse(generate(), media_type="text/plain")          