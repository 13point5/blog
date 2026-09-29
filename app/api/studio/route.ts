import { allowRequest, saveDocument } from "../../studio/store";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!allowRequest(request))
    return Response.json(
      {
        error: "File saves are available only in the local development studio.",
      },
      { status: 403 },
    );
  const reader = request.body?.getReader();
  if (!reader)
    return Response.json({ error: "Document required." }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1_000_000) {
        await reader.cancel();
        return Response.json(
          {
            error:
              "Keep documents under 1 MB. Use image URLs instead of embedded image data.",
          },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (
      typeof input.slug !== "string" ||
      typeof input.source !== "string" ||
      (input.revision !== null && typeof input.revision !== "string")
    )
      throw new Error("Invalid document.");
    const result = await saveDocument(input);
    return Response.json(result, { status: result.conflict ? 409 : 200 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save the document.",
      },
      { status: 400 },
    );
  }
}
