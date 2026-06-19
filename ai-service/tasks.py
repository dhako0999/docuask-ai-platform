import os
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse
from dotenv import load_dotenv

load_dotenv()

import psycopg
from celery_app import celery
from services.chunking import chunk_text
from services.embeddings import create_embedding


def clean_database_url(database_url: str):
    parsed = urlparse(database_url)

    query_params = dict(parse_qsl(parsed.query))
    query_params.pop("schema", None)

    cleaned_query = urlencode(query_params)

    return urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        parsed.params,
        cleaned_query,
        parsed.fragment,
    ))


DATABASE_URL = clean_database_url(os.getenv("DATABASE_URL"))

@celery.task
def test_task():
    print("Celery is working")

    return {"status": "success"}


@celery.task
def process_document(document_id: str):
    print(f"Starting background processing for document: {document_id}")

    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    'SELECT "content" FROM "Document" WHERE "id" = %s',
                    (document_id,),
                )

                row = cur.fetchone()

                if row is None:
                    raise Exception(f"Document not found: {document_id}")

                content = row[0]

                chunks = chunk_text(content)

                for chunk in chunks:
                    embedding = create_embedding(chunk["content"])
                    embedding_string = "[" + ",".join(map(str, embedding)) + "]"

                    cur.execute(
                        '''
                        INSERT INTO "DocumentChunk" (
                            "id",
                            "documentId",
                            "content",
                            "chunkIndex",
                            "embedding",
                            "createdAt"
                        )
                        VALUES (
                            gen_random_uuid(),
                            %s,
                            %s,
                            %s,
                            %s::vector,
                            NOW()
                        )
                        ''',
                        (
                            document_id,
                            chunk["content"],
                            chunk["chunk_index"],
                            embedding_string,
                        ),
                    )

                cur.execute(
                    'UPDATE "Document" SET "status" = %s WHERE "id" = %s',
                    ("ready", document_id),
                )

            conn.commit()

        print(f"Finished processing document: {document_id}")

        return {
            "status": "ready",
            "document_id": document_id,
            "chunks_created": len(chunks),
        }

    except Exception as error:
        print(f"Failed processing document {document_id}: {error}")

        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    'UPDATE "Document" SET "status" = %s WHERE "id" = %s',
                    ("FAILED", document_id),
                )
            conn.commit()

        raise error 


