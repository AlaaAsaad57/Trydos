export const changeAppLanguage=(language)=>{
    return({type:"APP-LANGUAGE",payload:language})
}
export const SelectStory=(e)=>{
    return({type:"STORY-SELECTED",payload:e})
}
export const GetStoryData=(data)=>{
    return({type:"STORY-DATA",payload:data})
}
export const setNextStory=(storyId)=>{
    return({type:"NEXT-STORY",payload:storyId})
}
export const setPreviousStory=(storyId)=>{
    return({type:"PREV-STORY",payload:storyId})
}