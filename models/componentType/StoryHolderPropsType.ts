import { StoryType } from "models/Genaral/Story"


export interface StoryHolderPropsType {
    active: boolean
    isPaused: boolean
    story: StoryType
}
