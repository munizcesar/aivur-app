export const runtime = 'edge';
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Somente disponível em ambiente de desenvolvimento." }, { status: 403 });
  }

  try {
    const cookieStore = await cookies();
    cookieStore.set("aivur_session", "cesa.muniz@gmail.com", {
      httpOnly: true,
      secure: false, // development is usually http
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30 // 30 dias
    });
    
    return NextResponse.json({ success: true, userId: "cesa.muniz@gmail.com" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
