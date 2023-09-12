const initialState = {language:"ar",loading:true,selectedStory:null,storiesData:[]}

const HomeReducer=(state = initialState, { type, payload }) => {
  switch (type) {

case "APP-LANGUAGE":{
    return{...state,language:payload}
}
case "STORY-SELECTED":{
  return {...state,selectedStory:payload}
}
case "STORY-DATA":{
  return {...state,storiesData:payload}
}
  default:
    return state
  }
}
export default  HomeReducer