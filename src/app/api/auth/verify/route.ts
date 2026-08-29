export const runtime = 'edge';
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { token } = await req.json() as { token?: string };
    
    const res = await fetch("https://aivur-worker.cesarmuniz0816.workers.dev/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    
    const data = await res.json() as { error?: string; userId?: string };
    if (!res.ok) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }
    
    // Set HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set("aivur_session", data.userId ?? '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
    
    return NextResponse.json({ success: true, userId: data.userId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
