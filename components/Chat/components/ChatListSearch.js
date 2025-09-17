import { useParams } from "next/navigation";
import Mignifier from "../svg/Mignifier.svg";
import { SearchContact } from "store/chat/actions";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { pollinateInput } from "@/utils/tinyUtils";
function ChatListSearch(props) {
  const { language } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  let filterTimeout;
  const SearchContacts = (query) => {
    props.setSearch(query);
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
      SearchContact(query);
    }, 500);
  };

  return (
    <div className="chat-window-search-holder">
      <label htmlFor="search" className="hidden">
        Search
      </label>
      <input
        aria-label="Search"
        data-cy="SearchInputChat"
        id="search"
        value={props.search}
        onChange={(e) => SearchContacts(pollinateInput(e.target.value))}
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
