// Stub de teste de `next/server` (a rota usa apenas NextResponse.json).
export class NextResponse extends Response {
  static json(body, init) {
    return Response.json(body, init);
  }
}
