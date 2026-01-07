"use client";
import React, { useEffect, useState } from "react";
import Search from "public/svg/SearchIcon";
import "styles/search.css";
import {
  normalizeView,
  onClickSearchHistory,
  translateFunction,
} from "utils/functions";
import search from "services/search";
import { DisableScroll, EnableScroll } from "utils/tinyUtils";

import { GetSearchData } from "serverRequests/Search";
import SearchHistory from "./SearchHistory";
import SearchTrending from "./SearchTrending";
import ProductItem from "./Results/ProductItem";
import Spinner from "components/global/Spinner";
import BrandItem from "./Results/BrandItem";
import CategoryItem from "./Results/CategoryItem";
import BoutiqueItem from "./Results/BoutiqueItem";

import CloseIcon from "public/svg/CloseIcon";
import SearchVoice from "./SearchVoice";
import SearchImage from "./SearchImage";
import SearchCloseIcon from "public/svg/SearchCloseIcon";
function SearchIcon({ language, country }) {
  const isRtl = language === "ar" || language === "ku";
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [value, setValue] = useState("");
  const [filters, setFilters] = useState({
    categories: [],
    brands: [],
    boutiques: [],
    total_size: 0,
    products: [],
  });
  const [applied_filter, setAppliedFilters] = useState({
    categories: [],
    brands: [],
    boutiques: [],
  });

  const [focuse, setFocus] = useState(false);
  const EnableSearch = (e: boolean) => {
    setSearchEnabled(e);
  };
  const GetSearchDataFunc = async ({ noProducts }) => {
    try {
      setLoading(true);
      let res = await GetSearchData({
        language,
        country,
        filters: applied_filter,
        noProducts: noProducts,
        filters_offset: 1,
      });
      setFilters({
        boutiques: res.boutiques,
        brands: res.brands,
        categories: res.categories,
        products: [],
        total_size: res.total_size,
      });
      return;
    } catch (error) {
      setLoading(false);
    }
  };
  const GetInitialData = async () => {
    try {
      setLoading(true);
      let [search_res, trending_res] = await Promise.all([
        GetSearchDataFunc({ noProducts: true }),
        search.getTrendingSearch(),
      ]);
      setTrending(trending_res.popular_search_terms);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (localStorage.getItem("search-history")) {
      setSearchHistory(JSON.parse(localStorage.getItem("search-history")));
    } else {
      setSearchHistory([]);
    }
    if (searchEnabled) {
      GetInitialData();
    }
  }, [searchEnabled]);
  const getNextBoutiques = async () => {
    // we need offset startting from 1(initial gets 1 and when loadmore gets 2 ,3,4 ...)
    let res = await GetSearchData({
      language,
      country,
      filters: applied_filter,
      noProducts: true,
      filters_offset: 1,
    });
    setFilters({
      ...filters,
      boutiques: [...filters.boutiques, res.boutiques],
    });
  };
  const getNextBrands = async () => {
    // we need offset startting from 1(initial gets 1 and when loadmore gets 2 ,3,4 ...)
    let res = await GetSearchData({
      language,
      country,
      filters: applied_filter,
      noProducts: true,
      filters_offset: 1,
    });
    setFilters({
      ...filters,
      brands: [...filters.brands, res.brands],
    });
  };
  const getNextCategories = async () => {
    // we need offset startting from 1(initial gets 1 and when loadmore gets 2 ,3,4 ...)
    let res = await GetSearchData({
      language,
      country,
      filters: applied_filter,
      noProducts: true,
      filters_offset: 1,
    });
    setFilters({
      ...filters,
      brands: [...filters.categories, res.categories],
    });
  };
  return (
    <>
      <div
        className={`search-icon flex items-center h-full cursor-pointer duration-[0.4s] min-w-[50px] ${
          searchEnabled && "active-serach min-w-full"
        }`}
        data-cy="searchIcon_mainPage"
        onClick={() => {
          if (!searchEnabled) {
            DisableScroll();
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.HOME_SEARCH_BUTTON,
            // });
            normalizeView();
            EnableSearch(true);
          }
        }}
      >
        {/* <DataSourceLogger
          dataSourceString={`Main Categories Data Source Elastic in ${time} ms`}
        /> */}
        <Search
          id="search-icon"
          className={`absolute duration-[0.4s] ml-[10px]  z-50 ${
            focuse && "black-fill"
          }`}
        />
        <div className="search-component-container flex-row">
          <div className={`search-input-parent ${focus && "focuse"}`}>
            <input
              maxLength={90}
              data-cy="inputField"
              id="search-element"
              disabled={!searchEnabled}
              className="search-input"
              // @ts-ignore
              placeholder={translateFunction("Search", lang?.split("-")[1])}
              onFocus={() => setFocus(true)}
              onKeyUp={(e) => {
                onKeyDown(e);
              }}
              onBlur={() => {
                if (value.length === 0) {
                  setFocus(false);
                } else {
                  // Sendevent({
                  //   event: GA_EVENT_NAMES.CLICK,
                  //   value: GA_CLICK_EVENT_VALUES.ADD_FILTER_ITEM,
                  //   extra: {
                  //     filter: "search_text",
                  //     value: value,
                  //   },
                  // });
                }
              }}
              value={value.replace(/[<>/,:!@#$%^&*()]/g, "").slice(0, 90)}
              onChange={(e) => {
                onChange(e);
              }}
            />
          </div>

          {searchEnabled && (
            <>
              {focuse ? (
                <div className="input-icons flex-row close-search-icon">
                  <SearchCloseIcon
                    data-cy="SearchInputCloseIcon"
                    onClick={() => {
                      if (value.length > 0) {
                        // Sendevent({
                        //   event: GA_EVENT_NAMES.CLICK,
                        //   value: GA_CLICK_EVENT_VALUES.RESET_HOME_SEARCH_BUTTON,
                        // });
                        setLoading(true);
                        setValue("");
                      } else {
                        // Sendevent({
                        //   event: GA_EVENT_NAMES.CLICK,
                        //   value: GA_CLICK_EVENT_VALUES.SEARCH_CLOSE_ICON_BUTTON,
                        // });

                        close();
                        setValue("");
                        setFocus(false);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="input-icons flex-row h-full">
                  <SearchImage
                    setSearchValue={(e) => {
                      if (e?.length > 0) {
                        // Sendevent({
                        //   event: "button_clicked",
                        //   value: "search_with_image_button",
                        // });

                        setValue(e);
                        setLoading(true);
                      }
                    }}
                  />

                  <SearchVoice
                    setSearchValue={(e) => {
                      if (e?.length > 0) {
                        // Sendevent({
                        //   event: GA_EVENT_NAMES.CLICK,
                        //   value: GA_CLICK_EVENT_VALUES.SEARCH_WITH_VOICE_BUTTON,
                        // });

                        setValue(e);
                        setLoading(true);
                      }
                    }}
                  />
                </div>
              )}
              {!focuse && (
                <div className="search-colse-icon flex-row">
                  <CloseIcon
                    data-cy="closeIcon_searchPage"
                    onClick={() => {
                      // Sendevent({
                      //   event: GA_EVENT_NAMES.CLICK,
                      //   value: GA_CLICK_EVENT_VALUES.SEARCH_CLOSE_ICON_BUTTON,
                      // });
                      if (value.length > 0) {
                        setValue("");
                      } else {
                        close();
                        setValue("");
                      }
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {searchEnabled && (
        <SearchContainer
          products={filters.products}
          searchHistoryItems={searchHistory}
          setSearchHistory={setSearchHistory}
          setValue={setValue}
          trending={trending}
          value={value}
          EnableSearch={(e) => {
            setSearchEnabled(false);
          }}
          isRtl={isRtl}
          language={language}
          onClickSearchHistory={(e) => {
            let res = onClickSearchHistory(value);
            setSearchHistory(res);
          }}
          applied_filter={applied_filter}
          boutiques={filters.boutiques}
          brands={filters.brands}
          categories={filters.categories}
          loading={loading}
          getNextBrands={getNextBrands}
          getNextBoutiques={getNextBoutiques}
          getNextCategories={getNextCategories}
        />
      )}
    </>
  );
}

export default SearchIcon;

const SearchContainer = ({
  value,
  searchHistoryItems,
  setValue,
  setSearchHistory,
  trending,
  products,
  isRtl,
  language,
  onClickSearchHistory,
  EnableSearch,
  loading,
  brands,
  boutiques,
  categories,
  applied_filter,
  getNextCategories,
  getNextBoutiques,
  getNextBrands,
}) => {
  return (
    <div className="search-container pt-[12px]" data-cy="searchContainer">
      {value.length === 0 && (
        <>
          {searchHistoryItems.length > 0 && (
            <SearchHistory
              options={searchHistoryItems}
              setOptions={(e) => {
                setValue(e);
              }}
              deleteOption={(e) => {
                setSearchHistory(searchHistoryItems.filter((s) => s !== e));
              }}
            />
          )}
          <SearchTrending
            clearAll={() => {
              setValue("");
            }}
            setValue={(e) => setValue(e)}
            trending={trending}
          />
          <div
            className="search-results-container flex-col"
            data-cy="searchResults_body"
          >
            {value?.length > 0 && products?.length > 0 && (
              <div className="products-results flex-col max-h-[60%] overflow-auto">
                <div
                  className={`result-label flex-row  ${
                    isRtl ? "flex-row-reverse pr-2" : " "
                  }`}
                >
                  {translateFunction("Find Products", language)}{" "}
                </div>
                {products?.map((product, index) => {
                  return (
                    <ProductItem
                      product={product}
                      index={index + 1}
                      key={product?.product_id}
                      onClick={(e) => {
                        onClickSearchHistory(e);
                        EnableSearch(false);
                      }}
                    />
                  );
                })}
              </div>
            )}
            {(brands?.length > 0 || loading) && (
              <div
                className="products-results brand-results"
                data-cy="ContainerOfBrands"
              >
                <div
                  className={`result-label flex-row  ${
                    isRtl ? "flex-row-reverse pr-2" : " "
                  }`}
                >
                  {translateFunction("Find Brands", language)}{" "}
                  {loading && <Spinner className="ml-3" no />}
                </div>
                <div
                  className={`brands-results-row flex-row overflow-auto ${
                    isRtl ? "flex-row-reverse" : " "
                  }`}
                >
                  {brands?.map((brand, index) => (
                    <BrandItem
                      brand={brand}
                      key={brand?.slug}
                      onClick={() => {
                        // Sendevent({
                        //   event: GA_EVENT_NAMES.CLICK,
                        //   value: GA_CLICK_EVENT_VALUES.ADD_FILTER_ITEM,
                        //   extra: {
                        //     filter: "brand",
                        //     value: brand.name,
                        //   },
                        // });
                        setSearchBrand(brand);
                      }}
                      isActive={applied_filter?.brands.some(
                        (s) => s.slug === brand.slug
                      )}
                    />
                  ))}
                  {!isBrandsEnd && !loading && brands.length >= 10 && (
                    <LoadMoreComponent
                      loading={loading}
                      getNextFilters={() => {
                        getNextBrands();
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {(categories?.length > 0 || loading) && (
              <div
                className="products-results brand-results"
                data-cy="ContainerOfCategories"
              >
                <div
                  className={`result-label flex-row  ${
                    isRtl ? "flex-row-reverse pr-2" : " "
                  }`}
                >
                  {translateFunction("Find Categories", language)}{" "}
                  {loading && <Spinner className="ml-3" no />}
                </div>
                <div
                  className={`brands-results-row flex-row overflow-auto ${
                    isRtl ? "flex-row-reverse" : " "
                  }`}
                >
                  {categories?.map((category, index) => (
                    <CategoryItem
                      category={category}
                      key={category?.slug}
                      onClick={(e) => {
                        // Sendevent({
                        //   event: GA_EVENT_NAMES.CLICK,
                        //   value: GA_CLICK_EVENT_VALUES.ADD_FILTER_ITEM,
                        //   extra: {
                        //     filter: "category",
                        //     value: category.name,
                        //   },
                        // });
                        setSearchCategory(e);
                      }}
                      isActive={applied_filter?.categories.some(
                        (s) => s.slug === category.slug
                      )}
                    />
                  ))}
                  {!isCategoriesEnds && !loading && categories.length >= 10 && (
                    <LoadMoreComponent
                      loading={loading}
                      getNextFilters={() => {
                        getNextCategories();
                      }}
                    />
                  )}
                </div>
              </div>
            )}
            {(boutiques?.length > 0 || loading) && (
              <div
                className="products-results brand-results"
                data-cy="ContainerOfBoutiques"
              >
                <div
                  className={`result-label flex-row  ${
                    isRtl ? "flex-row-reverse pr-2" : " "
                  }`}
                >
                  {translateFunction("Find Boutiques", language)}{" "}
                  {loading && <Spinner className="ml-3" no />}
                </div>
                <div
                  className={`brands-results-row flex-row overflow-auto ${
                    isRtl ? "flex-row-reverse" : " "
                  }`}
                >
                  {boutiques?.map((boutique, index) => (
                    <BoutiqueItem
                      boutique={boutique}
                      key={boutique?.slug}
                      onClick={() => {
                        // Sendevent({
                        //   event: GA_EVENT_NAMES.CLICK,
                        //   value: GA_CLICK_EVENT_VALUES.ADD_FILTER_ITEM,
                        //   extra: {
                        //     filter: "boutique",
                        //     value: boutique.name,
                        //   },
                        // });
                        setSearchBoutique(boutique);
                      }}
                      isActive={applied_filter?.boutiques.some(
                        (s) => s.slug === boutique.slug
                      )}
                    />
                  ))}
                  {!isBoutiqueEnds && !loading && boutiques.length >= 10 && (
                    <LoadMoreComponent
                      loading={loading}
                      getNextFilters={() => {
                        getNextBoutiques();
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const LoadMoreComponent = ({ loading, getNextFilters }) => {
  return (
    <>
      {loading ? (
        <>
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="brand-item min-w-[81px] p-0 relative ml-2" key={i}>
              <Spinner />
            </div>
          ))}
        </>
      ) : (
        <div
          className="category-item brand-item whitespace-nowrap relative pr-4 z-10 text-[#1d1d1d]"
          onClick={getNextFilters}
        >
          {translateFunction("Load More")}
        </div>
      )}
    </>
  );
};
