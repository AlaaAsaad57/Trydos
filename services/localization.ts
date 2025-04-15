import { store } from "store";

class LocalizationService {
  GetAppLanguage() {
    return store.getState().homepage.language;
  }
  GetAppCountry() {
    return store.getState().homepage.country;
  }
}
let LocalizationServiceClass = new LocalizationService();
export default LocalizationServiceClass;
