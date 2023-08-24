import {translations} from "statics/assets/translations/translations.js"
export function translate(key,language){
return translations[language][key] || key
}