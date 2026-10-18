import { revalidateTag } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

function secretOk(received: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** El API llama aquí al guardar contenido o catálogo: invalida la caché `content` de la landing. */
export async function POST(req: Request) {
  if (!secretOk(req.headers.get('x-revalidate-secret'))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  revalidateTag('content');
  return NextResponse.json({ ok: true, revalidated: 'content' });
}
