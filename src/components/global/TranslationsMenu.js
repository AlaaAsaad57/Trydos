import React from 'react'
import TranslationsIcon from "statics/assets/svg/translations.svg"
import UKIcon from "statics/assets/svg/uk.svg"
import UAEIcon from "statics/assets/svg/uae.svg"
import { useDispatch, useSelector } from 'react-redux'
import { changeAppLanguage } from '@/redux/homepage/actions'
function TranslationsMenu() {
    const language=useSelector((state)=>state.homepage.language)
    const dispatch=useDispatch()
  return (
    <div className='translations-container'>
       <div className='translations-container-inner'> 
       <div className='translation-icon'>
            <TranslationsIcon/>
        </div>
        <div className={`translation-icon en-icon ${(language==='en'&&'selected-language')}`} onClick={()=>dispatch(changeAppLanguage('en'))}>
            <UKIcon width={30} height={20} />
        </div>
        <div className={`translation-icon ar-icon ${(language==='ar'&&'selected-language')}`} onClick={()=>dispatch(changeAppLanguage('ar'))}>
        <UAEIcon />
        </div>
       </div>

    </div>
  )
}

export default TranslationsMenu