import { configureStory } from "utils/functions"
const initialState = {language:"en",loading:true,selectedStory:null,storiesData:[],categories:[],settings:null}

const HomeReducer=(state = initialState, { type, payload }) => {
  switch (type) {

case "APP-LANGUAGE":{
    return{...state,language:payload}
}
case "STORY-SELECTED":{
  return {...state,selectedStory:payload}
}
case "STORY-DATA":{
  return {...state,
    storiesData:payload
  }
}
case "NEXT-STORY":{
  let index;
  state.storiesData.map((story,i)=>{
    if(story.id===payload)
    index=i
  })
  if(index<state.storiesData.length-1)
     return{...state,selectedStory:configureStory(state.storiesData.filter((story,i)=>i===index+1)[0])}
  else
     return{...state,selectedStory:null}
}
case "PREV-STORY":{
  let index;
  state.storiesData.map((story,i)=>{
    if(story.id===payload)
    index=i
     })
  if(index>0)
    return{...state,selectedStory:configureStory(state.storiesData.filter((story,i)=>i===index-1)[0])}
  else
   return{...state,selectedStory:null}
}
case "ADD-STORY":{
  let arr=[]
  state.storiesData.map((storyItem)=>{
    if(storyItem.id===payload.user_id){arr.push({...storyItem,stories:[payload,...storyItem.stories]})}
    else{
      arr.push(storyItem)
    }
  })
  return({...state,storiesData:[arr.filter((storyUser)=>storyUser.id===payload.user_id)[0],...arr.filter((storyUser)=>storyUser.id!==payload.user_id)]})
}
case "SITE-MAIN-DATA":{
  return({
    ...state,
    loading:false,
    ...payload
  })
}
case "GET_SETTINGS":{
  return({
    ...state,
    settings:payload.data
  })
}
  default:
    return state
  }
}
export default  HomeReducer