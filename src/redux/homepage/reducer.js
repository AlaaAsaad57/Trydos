const initialState = {language:"ar"}

const HomeReducer=(state = initialState, { type, payload }) => {
  switch (type) {

case "APP-LANGUAGE":{
    return{...state,language:payload}
}
  default:
    return state
  }
}
export default  HomeReducer