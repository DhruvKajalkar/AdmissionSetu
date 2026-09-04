import { NextResponse } from "next/server";
import { DeterministicDemoAssistantProvider, getAssistantProvider } from "@/services/assistant-provider";
import { ASSISTANT_LIMITS, validateAssistantRequest } from "@/services/assistant-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > ASSISTANT_LIMITS.requestCharacters) {
    return NextResponse.json({ error: "Assistant request is too large." }, { status: 413 });
  }
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: "Could not read the request." }, { status: 400 });
  }
  if (raw.length > ASSISTANT_LIMITS.requestCharacters) {
    return NextResponse.json({ error: "Assistant request is too large." }, { status: 413 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Request body must contain valid JSON." }, { status: 400 });
  }
  const validation = validateAssistantRequest(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  try {
    return NextResponse.json(await getAssistantProvider().respond(validation.value));
  } catch {
    const fallback = await new DeterministicDemoAssistantProvider().respond(validation.value);
    return NextResponse.json({
      ...fallback,
      notice: "The configured AI service is temporarily unavailable. This answer comes from the clearly labelled deterministic demo responder.",
    });
  }
}
