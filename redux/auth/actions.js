import axios from 'axios'
import userImage from '../../public/images/profileNo.png'
import { LOG_IN_STORIES, OTP_URL, SEND_OTP, STORIES_URL, VERFIY_OTP } from '../../utils/endpointConfig'
import { store } from '../store'
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
export const CheckPhone=async (value,step)=>{

    // if(value.includes('1')){
    //     step(282);
    //     return({type:"WRONG-NUMBER"})
    // }
    // else{
        step(277)
        store.dispatch( ReInitialise())
    
}
export const lodaingOTP=(val)=>{
    return({type:"LOADING-OTP",payload:val})
}
export const RegisterGuest=()=>{
    return({})
}
export const SendOtp=async (mobilePhone,is_via_whatsapp,step)=>{
    try{
        
        let response=await axios.get(OTP_URL+SEND_OTP+`?phone=${mobilePhone}&is_via_whatsapp=${is_via_whatsapp}`)
        if(response.data.data.verificationId){
            store.dispatch({type:"SET-VERFICATION-ID",payload:response.data.data.verificationId})
        }
        
    }
    catch(e){
        
        step(282);
        return({type:"WRONG-NUMBER",payload:'failed to send otp code please try again'})
    }

}
export const VerifyOtp=async (code,verficationID)=>{
    try{
        let response=await axios.get(OTP_URL+VERFIY_OTP+`?verificationId=${verficationID}&otp=${code}`)
        localStorage.setItem("ID-TOKEN",response.data.data.id_token)
        localStorage.setItem("TOKEN",response.data.data.token)
        localStorage.setItem("USER",JSON.stringify(response.data.data.user))
        store.dispatch({type:"LOGIN_SUCCESS",payload:{id:response.data.data.user.id,idToken:response.data.data.id_token,name:response.data.data.user.name||response.data.data.phone,avatar:userImage}})
    }
    catch(e){
        return({type:"WRONG-NUMBER",payload:'failed to send verify otp code please try again'})
    }
}
export const loginStories=async ()=>{
    try{
        let response=await axios.post(STORIES_URL+LOG_IN_STORIES,JSON.stringify({
            otp_id_token:localStorage.getItem('ID-TOKEN'),
            mobile_phone:JSON.parse(localStorage.getItem('USER')).mobilePhone
        }))
        localStorage.setItem('USER-STORIES',JSON.stringify(response.data.data))
        localStorage.setItem('STORIES-TOKEN',response.data.data.access_token)
    }
    catch(e){
        return({type:"WRONG-NUMBER",payload:'failed  please try again'})
    }
}