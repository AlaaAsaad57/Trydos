"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductInterface } from "models/product";
import {
  filterProducts,
  GetAppLanguage,
  searchProducts,
} from "utils/functions";
import AsyncSelect from "react-select/async"; // Assuming you're using a library for async select

const ComparePage: React.FC = () => {
  const searchParams = useSearchParams();
  const [product1, setProduct1] = useState(null);
  const [product2, setProduct2] = useState(null);
  const [searchText1, setSearchText1] = useState("");
  const [searchText2, setSearchText2] = useState("");

  useEffect(() => {
    const { slug1, slug2 } = {
      slug1: searchParams.get("slug1"),
      slug2: searchParams.get("slug2"),
    };

    if (slug1 && slug2) {
      // Fetch product data for the two slugs
      fetchProducts(slug1 as string, slug2 as string);
    }
  }, []);
  const [products, setProducts] = useState<any[]>([]);
  const fetchProducts = async (slug1: string, slug2: string) => {
    // Fetch product data based on slugs
    const productData1 = await fetchProductData(slug1);
    const productData2 = await fetchProductData(slug2);

    setProduct1(productData1);
    setProduct2(productData2);
  };

  const fetchProductData = async (slug: string) => {
    // Implement your fetch logic here, e.g., using filterProducts
    const products = await filterProducts({
      boutiqueId: null,
      lang: "en",
      offset: 0,
      callback: () => {},
      newFiltersCallback: () => {},
      sizesAttr: {},
      reset: true,
      storeCallback: () => {},
      searchText: slug,
    });
    return products[0]; // Assuming the first product matches the slug
  };

  const handleSearchChange1 = (selectedOption: any) => {
    setProduct1(selectedOption);
  };

  const handleSearchChange2 = (selectedOption: any) => {
    setProduct2(selectedOption);
  };
  const handleSearchChange = async (
    selectedOption: any,
    callback: (product: any) => void
  ) => {
    // @ts-ignore
    console.log(selectedOption);
  };
  const [loading, setLoading] = useState(false);
  const search = async (inputValue: string) => {
    setLoading(true);
    const productsVar = await searchProducts({
      searchText: inputValue,
    });

    setProducts(productsVar || []);
    setLoading(false);
  };
  const loadOptions = (m: string, callback: any) => {
    callback(products?.map((s) => ({ label: s.name, value: s.slug })) || []);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(products?.map((s) => ({ label: s.name, value: s.slug })) || []);
      }, 100);
    });
  };
  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };
  const debouncedChangeHandler = useCallback(
    debounce((value) => {
      search(value);
    }, 500), // Delay in milliseconds
    []
  );
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Compare Products</h1>
      {!product1 || !product2 ? (
        <div className="flex flex-row ">
          <AsyncSelect
            placeholder="Search for Product 2"
            onChange={(selectedOption: any) =>
              handleSearchChange(selectedOption, setProduct2)
            }
            loadOptions={(i, callback) => {
              loadOptions(i, callback);
            }}
            isLoading={loading}
            onInputChange={(n, action) => {
              if (n.length > 0) {
                setProducts([]);
                debouncedChangeHandler(n);
              }
            }}
            className="w-full !mt-0"

            // Implement loadOptions for async search
          />
          <AsyncSelect
            placeholder="Search for Product 2"
            onChange={(selectedOption: any) =>
              handleSearchChange(selectedOption, setProduct2)
            }
            loadOptions={(i, callback) => {
              loadOptions(i, callback);
            }}
            isLoading={loading}
            onInputChange={(n, action) => {
              if (n.length > 0) {
                setProducts([]);
                debouncedChangeHandler(n);
              }
            }}
            className="w-full !mt-0"

            // Implement loadOptions for async search
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border p-4 rounded shadow">
            <h2 className="text-lg font-semibold">{product1.name}</h2>
            <p className="text-sm text-gray-600">{product1.description}</p>
            {/* Render additional product details here */}
          </div>
          <div className="border p-4 rounded shadow">
            <h2 className="text-lg font-semibold">{product2.name}</h2>
            <p className="text-sm text-gray-600">{product2.description}</p>
            {/* Render additional product details here */}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparePage;
