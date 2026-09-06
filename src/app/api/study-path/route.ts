import { NextResponse } from "next/server";
import studyPathMock from "@/mocks/studyPathMock";

export async function GET() {
  // O Mock agora atua como nosso banco de dados serverless
  return NextResponse.json(studyPathMock.modulos);
}
