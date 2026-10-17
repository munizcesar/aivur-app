// Stub de teste de `next/server` (NextResponse e NextRequest).
export class NextResponse extends Response {
  static json(body, init) {
    return Response.json(body, init);
  }
}

export class NextRequest extends Request {}
