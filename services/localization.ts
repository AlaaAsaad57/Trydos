import { useAppStore } from "store";

class LocalizationService {
  GetAppLanguage() {
    const { language } = useAppStore.getState();
    return language;
  }
  GetAppCountry() {
    const { country } = useAppStore.getState();
    return country;
  }
}
let LocalizationServiceClass = new LocalizationService();
export default LocalizationServiceClass;
