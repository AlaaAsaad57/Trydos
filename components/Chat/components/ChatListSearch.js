import { useParams } from "next/navigation";
import Mignifier from "../svg/Mignifier.svg";
import { useDispatch, useSelector } from "react-redux";
import { SearchContact } from "store/chat/actions";
import { translateFunction } from "utils/functions";
function ChatListSearch(props) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  let filterTimeout;
  let dispatch = useDispatch();
  const SearchContacts = (query) => {
    props.setSearch(query);
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
      SearchContact(query);
    }, 500);
  };
  const language = useSelector((state) => state.homepage.language);

  return (
    <div className="chat-window-search-holder">
      <label htmlFor="search" className="no-label">
        Search
      </label>
      <input
        aria-label="Search"
        data-cy="SearchInputChat"
        id="search"
        value={props.search}
        onChange={(e) => SearchContacts(e.target.value)}
        placeholder={translate(
          "Search, Chat, Contact, Start New Chat",
          language
        )}
      />
      <Mignifier></Mignifier>
    </div>
  );
}

export default ChatListSearch;
