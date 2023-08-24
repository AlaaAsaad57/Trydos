import userImage from 'statics/assets/images/user.png'
export const Login =(pin,mobile)=>{
    if(pin==='111111'){
        return({type:"LOGIN_SUCCESS",payload:{name:"Mohamad",avatar:userImage}})
    }
    else{
        return({type:"LOGIN_FAILED"})
    }
}
export const ReInitialise=()=>{
    return {type:"RE-INITILIASE"}
}
export const CheckPhone=(value,step)=>{
    if(value.includes('1')){
        step(282)
        return({type:"WRONG-NUMBER"})
    }
    else{
        step(277)
        return ReInitialise()
    }
}
