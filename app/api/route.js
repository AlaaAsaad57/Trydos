import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
export  const GET=(req)=>{
  try {
    revalidatePath("/test")
    return NextResponse.json({ revalidated: true });
  } catch (err) {
    return NextResponse.json({ message: 'Internal server error' })
  }
}