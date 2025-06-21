import { StoryType } from "models/Genaral/Story"

export interface ContainerIndexPropsType {
props: {
    activeId: number
    id: number
    key: number
    isPaused: boolean
    preloadCount: number
    onStoryStart: (e: number) => void
    loader: React.ReactNode
    currentIndex: number
    onPrevious: () => void
    onNext: () => void
    stories: StoryType[]
    storyContainerStyles: React.CSSProperties
    storyStyles: React.CSSProperties
    width: string
    height: string
    onAllStoriesEnd: () => void
    onStoryEnd: () => void
    }
}