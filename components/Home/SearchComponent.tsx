import { useEffect, useRef, useState } from "react";
import SearchIcon from "public/svg/SearchIcon.svg";
import Divider from "public/svg/DividerIcon.svg";
import CloseIcon from "public/svg/CloseIcon.svg";
import { useSelector } from "react-redux";
import Animated from "react-mount-animation";

interface SearchComponentProps {
  searchEnabled: boolean;
  close: Function;
}
function SearchComponent({ searchEnabled, close }: SearchComponentProps) {
  const language = useSelector((state: any) => state.homepage.language);
  const [searchValue, setSearchValue] = useState(null);
  function useOutsideAlerter(ref: any) {
    useEffect(() => {
      /**
       * Alert if clicked on outside of element
       */
      function handleClickOutside(event) {
        const ref = document.querySelector(".search-component-container");

        if (ref && !ref?.contains(event.target)) {
          if (searchValue?.length === 0) {
            close();
          }
        }
      }
      // Bind the event listener
      document.addEventListener("click", handleClickOutside);
      return () => {
        // Unbind the event listener on clean up
        document.removeEventListener("click", handleClickOutside);
      };
    }, [ref, searchValue]);
  }
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  useOutsideAlerter(wrapperRef);
  useEffect(() => {
    setSearchValue("");
    if (searchEnabled) {
      inputRef?.current?.focus();
    }
  }, [searchEnabled]);
  return (
    <Animated.div
      show={searchEnabled}
      ref={wrapperRef}
      className={`search-component-container`}
    >
      <SearchIcon />
      <Divider style={{ marginLeft: "10px" }} />
      <label htmlFor="chats" style={{ opacity: 0, position: "absolute" }}>
        Search Chat
      </label>
      <input
        autoFocus
        id="chats"
        className={`${language + "-light"}`}
        ref={inputRef}
        value={searchValue || ""}
        onChange={(e) => setSearchValue(e.target.value)}
      />
      <CloseIcon
        style={{ cursor: "pointer" }}
        onClick={() => {
          setSearchValue("");
          close();
        }}
      />
    </Animated.div>
  );
}

export default SearchComponent;
