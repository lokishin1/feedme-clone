import { convertUrl } from "@/features/url-to-markdown/convert";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url : "";

  return Response.json(await convertUrl(url));
}
