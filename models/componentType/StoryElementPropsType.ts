export interface StoryElementPropsType {
    story: any,
    index: number,
}
export interface StoriesInterface {
  id: number
  name?: string
  photo_path?: any
  mobile_phone?: string
  stories: Story[]
}

export interface Story {
  created_at: string
  cut_video_name: any
  cut_video_path: any
  file: any
  full_video_name: any
  full_video_path: any
  id: number
  is_photo: number
  is_seen: boolean
  is_video: number
  link: string
  media: any[]
  order_detail_id: any
  photo_path: string
  product_id: any
  status: number
  storage_video_path: any
  user_id: number
  viewers_count: number

}
