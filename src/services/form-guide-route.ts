import type { FormGuideErrorResponse, FormGuideResponse } from "../types/index.ts";
import { mapDetectedFormFields } from "./form-guide.ts";
import { getFormGuideProvider } from "./form-guide-provider.ts";
import {
  FORM_GUIDE_LIMITS,
  hasSupportedImageSignature,
  parseFormGuideContext,
  validateFormGuideMetadata,
} from "./form-guide-validation.ts";

function jsonResponse(body: FormGuideErrorResponse | FormGuideResponse, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function errorResponse(error: string, code: FormGuideErrorResponse["code"], status: number) {
  return jsonResponse({ error, code }, status);
}

export async function handleFormGuideRequest(
  request: Request,
  environment: NodeJS.ProcessEnv = process.env,
  fetcher: typeof fetch = fetch,
) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > FORM_GUIDE_LIMITS.requestBytes) {
    return errorResponse("Form-guide request is too large.", "IMAGE_TOO_LARGE", 413);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    return errorResponse("Request must contain one screenshot and form guidance context.", "INVALID_REQUEST", 400);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Could not read the screenshot request.", "INVALID_REQUEST", 400);
  }

  const imageValues = formData.getAll("image").filter((value): value is File => typeof value !== "string");
  const image = imageValues[0];
  const questionValue = formData.get("question");
  const metadata = validateFormGuideMetadata({
    imageCount: imageValues.length,
    imageType: image?.type,
    imageSize: image?.size,
    question: typeof questionValue === "string" ? questionValue : undefined,
  });
  if (!metadata.ok) return errorResponse(metadata.error, metadata.code, metadata.code === "IMAGE_TOO_LARGE" ? 413 : 400);

  const contextValue = formData.get("context");
  const context = typeof contextValue === "string" ? parseFormGuideContext(contextValue) : null;
  if (!context) return errorResponse("Admission context is malformed or too large.", "INVALID_CONTEXT", 400);

  const bytes = new Uint8Array(await image.arrayBuffer());
  if (!hasSupportedImageSignature(image.type, bytes)) {
    return errorResponse("The file contents do not match a supported PNG, JPEG or WebP screenshot.", "UNSUPPORTED_IMAGE", 400);
  }

  const provider = getFormGuideProvider(environment, fetcher);
  if (!provider) return errorResponse("Form analysis is temporarily unavailable.", "PROVIDER_UNAVAILABLE", 503);

  try {
    const detectedFields = await provider.detectFields({ imageType: image.type, imageBytes: bytes, question: metadata.question });
    const fields = mapDetectedFormFields(detectedFields, context);
    return jsonResponse({
      summary: fields.length
        ? `I can see ${fields.length} field${fields.length === 1 ? "" : "s"}. Review each suggestion before entering anything.`
        : "I could not confidently identify a form field in this screenshot.",
      fields,
      mode: "OPENAI_VISION",
      notice: "Guidance only. AdmissionSetu has not entered, uploaded or submitted anything.",
    });
  } catch {
    return errorResponse("Form analysis is temporarily unavailable.", "PROVIDER_UNAVAILABLE", 503);
  }
}
