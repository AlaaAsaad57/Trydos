"use client";
import { Provider } from "react-redux";
import { store } from "./store";
import TranslationsMenu from '../components/global/TranslationsMenu'
import Navbar from '../components/Home/Navbar'
import CategoriesBar from "../components/Home/CategoriesBar";
import ChatModal from '../components/Chat/ChatModal'
export default function Providers({ children }) {
  return <Provider store={store}>
    <div className='site-container'>
    <div className='home-page-container'>
    <TranslationsMenu/>
           <Navbar/>
           <ChatModal/>
      {children}
    </div>
    </div>
    </Provider>;
}