import os
from fastapi import FastAPI
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

from tasks import process_document


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

Analyze the document using only the provided chunks.

Return the analysis in this exact structure:

## Executive Summary
Briefly summarize the document.

## Key Points
List the most important points.

## Risks or Concerns
List any risks, concerns, gaps, or issues. If none are present, say "No major risks identified."

## Action Items
List practical next steps for the user.

## Suggested Follow-Up Questions
List useful questions the user may want to ask next.
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

Answer only using the provided retrieved document chunks.
Cite source numbers and document names when available.

If the answer is not in the retrieved chunks, say:
"I could not find that information in the document."
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
You are a research agent.

Use only the provided document evidence.

## Research Summary
Summarize the answer to the user's research question.

## Evidence
List the most relevant evidence from the provided sources.

## Key Themes
Identify recurring themes across the documents.

## Recommendations
Give practical recommendations based on the evidence.

## Conflicts or Gaps
Mention contradictions, missing information, or uncertainty

## Suggested Follow-Up Questions
List useful follow-up questions.
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

Compare the two documents using only the provided chunks.

Return the comparison in this exact structure:

## Overview
Briefly explain what each document appears to be about.

## Similarities
List important similarities between the two documents.

## Differences
List important differences between the two documents.

## Missing Information
Mention information present in one document but missing from the other.

## Risks or Concerns
Mention any contradictions, inconsistencies, risks, or unclear areas.

## Recommendations
Give practical recommendations based on the comparison.

## Suggested Follow-Up Questions
List useful questions the user may want to ask next.
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
    