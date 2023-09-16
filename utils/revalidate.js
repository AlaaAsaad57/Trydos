"use server"
import { revalidatePath } from 'next/cache'

export default async function Revalidate() {
  revalidatePath('/test') // Update cached posts
}