import axios from 'axios'
import userImage from '../../public/images/profileNo.png'
import { CHAT_URL, CUSTOMER_INFO_URL, LOG_IN_CHAT, LOG_IN_STORIES, OTP_URL, SEND_OTP, STORIES_URL, VERFIY_OTP } from '../../utils/endpointConfig'
import { store } from '../store'
import { SSRDetect } from '../../utils/functions'
import { GetChats } from '../chat/actions'
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
        
        let response=await axios.get(OTP_URL+SEND_OTP+`?phone=+${mobilePhone}&is_via_whatsapp=${is_via_whatsapp}`)
        if(response.data.data.verificationId){
            store.dispatch({type:"SET-VERFICATION-ID",payload:response.data.data.verificationId})
        }
        
    }
    catch(e){
        
        step(282);
        store.dispatch({type:"WRONG-NUMBER",payload:'failed to send otp code please try again'})
    }

}
export const VerifyOtp=async (code,verficationID)=>{
    try{
        let response=await axios.get(OTP_URL+VERFIY_OTP+`?verificationId=${verficationID}&otp=${code}`)
        if(response.data?.isSuccessful===false){
            if(response.data.message==='please verify your number again'){

            }
            throw new Error('Wrong Code')
        }
        localStorage.setItem("ID-TOKEN",response.data.data.id_token)
        localStorage.setItem("MARKET-TOKEN",response.data.data.token)
        localStorage.setItem("USER",JSON.stringify(response.data.data.user))
        store.dispatch({type:"LOGIN_SUCCESS",payload:{id:response.data.data.user.id,idToken:response.data.data.id_token,name:response.data.data.user.name,avatar:userImage}})
        loginStories()
        loginChat()
    }
    catch(e){
        console.log(e)
        if(e.response.data.message==="user not found"){
            store.dispatch({type:"WRONG-NUMBER",payload:'user not found'})
        }
       else{
        store.dispatch({type:"LOGIN_FAILED"})
       }
        
    }
}
export const loginStories=async ()=>{
    try{
        let response=await axios.post(STORIES_URL+LOG_IN_STORIES,{
            'otp_id_token':localStorage.getItem('ID-TOKEN'),
            'mobile_phone':"+"+JSON.parse(localStorage.getItem('USER')).phone
        })
        localStorage.setItem('USER-STORIES',JSON.stringify(response.data.data))
        localStorage.setItem('STORIES-TOKEN',response.data.data.access_token)
    }
    catch(e){
        return({type:"WRONG-NUMBER",payload:'failed  please try again'})
    }
}
export const loginChat=async ()=>{
    try{
        let response=await axios.post(CHAT_URL+LOG_IN_CHAT,{
            'otp_id_token':localStorage.getItem('ID-TOKEN'),
            'mobile_phone':JSON.parse(localStorage.getItem('USER')).phone,
            "name": JSON.parse(localStorage.getItem("USER"))?.name,
            "original_user_id":JSON.parse(localStorage.getItem("USER")).id
        })
        localStorage.setItem('USER-CHAT',JSON.stringify(response.data.data))
        localStorage.setItem('CHAT-TOKEN',response.data.data.access_token)
    }
    catch(e){
        return({type:"WRONG-NUMBER",payload:'failed  please try again'})
    }
}

export const CheckLogin=()=>{
    if(SSRDetect()&&localStorage.getItem("USER")&&localStorage.getItem("ID-TOKEN")&&localStorage.getItem("MARKET-TOKEN")){
        store.dispatch({type:"LOGIN_SUCCESS",payload:{id:JSON.parse(localStorage.getItem("USER")).id,idToken:localStorage.getItem("ID-TOKEN"),name:JSON.parse(localStorage.getItem("USER")).name,avatar:JSON.parse(localStorage.getItem("USER")).avatar||userImage}})
        GetChats(false)
        setTimeout(()=>{
            getCustomerInfo()
        },7000)
    }
}
export const getCustomerInfo=async ()=>{
    try{
        let res=await axios.get(OTP_URL+CUSTOMER_INFO_URL,{headers:{
            Authorization:`Bearer ${localStorage.getItem('MARKET-TOKEN')}`
        }})
        store.dispatch({type:"UPDATE_USER_INFO",payload:res.data.data.customer_info})
    }
    catch(e){

    }
}