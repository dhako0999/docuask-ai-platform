export async function graphqlRequest<T>(
    query: string,
    variables?: Record<string, unknown>
): Promise<T> {
    
    const res = await fetch("/api/graphql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            query,
            variables,
        }),
    });

    const json = await res.json();

    if(!res.ok || json.errors) {
        console.error("GraphQL error response:", json);

        throw new Error(
            json.errors?.[0]?.message || "GraphQL request failed"

        );
    }

    return json.data;
}