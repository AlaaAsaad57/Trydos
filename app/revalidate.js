"use server"
import { revalidatePath, revalidateTag } from 'next/cache'

export default async function Revalidate() {
  revalidateTag('stories') // Update cached posts
}