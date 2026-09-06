import { handleFormGuideRequest } from "@/services/form-guide-route";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleFormGuideRequest(request);
}
