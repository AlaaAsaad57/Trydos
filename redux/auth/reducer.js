const initialState = {user:null,failedLogin:false,attempts:4,wrongNumber:false}

const AuthReducer=(state = initialState, { type, payload }) => {
  switch (type) {

  case 'LOGIN_SUCCESS':
    return { ...state,user:payload,failedLogin:false }
  case "LOGIN_FAILED":{

    return {...state,failedLogin:true,attempts:state.attempts-1}
  }
  case 'RE-INITILIASE':{
    return {...state,failedLogin:false,wrongNumber:false}
  }
  case 'WRONG-NUMBER':{
    return{...state,wrongNumber:true}
  }
  default:
    return state
  }
}

export default  AuthReducer