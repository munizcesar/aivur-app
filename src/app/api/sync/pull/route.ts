export const runtime = 'edge';
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("aivur_session");
    
    // Retorna 200 para não estourar erro vermelho no navegador
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, reason: "unauthorized" }, { status: 200 });
    }
    
    const body = await req.json() as Record<string, unknown>;
    (body as Record<string, string>).userId = sessionCookie.value;
    
    const res = await fetch("https://aivur-worker.cesarmuniz0816.workers.dev/api/sync/pull", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
