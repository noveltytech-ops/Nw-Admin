import { NextResponse } from 'next/server';
import { resetState } from '@/server/state';

export const runtime = 'nodejs';

export async function POST() {
  const next = await resetState();
  return NextResponse.json(next);
}
