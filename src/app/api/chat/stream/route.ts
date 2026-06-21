export async function POST(req: Request) {
    const body = await req.json();
  
    const aiServiceUrl = process.env.AI_SERVICE_URL;
  
    if (!aiServiceUrl) {
      return new Response("AI_SERVICE_URL is not configured", {
        status: 500,
      });
    }
  
    const response = await fetch(`${aiServiceUrl}/answer-question-stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  
    if (!response.ok || !response.body) {
      return new Response("AI service stream failed", {
        status: 500,
      });
    }
  
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }