"use server"
import { revalidatePath, revalidateTag } from 'next/cache'

export default async function Revalidate() {
  revalidatePath('/') // Update cached posts
  revalidatePath('/listing') // Update cached posts
}