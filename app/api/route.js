import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
export async function GET(req){
  try {
    revalidatePath("/test")
    return NextResponse.json({ message: 'revalidated' })
  } catch (err) {
    return NextResponse.json({ message: 'Internal server error' })
  }
}