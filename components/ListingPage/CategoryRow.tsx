"use client";
import React, { useEffect } from "react";
import CategoryCircle from "./CategoryCircle";
import { useSelector } from "react-redux";

function CategoryRow() {
  const filters = useSelector((state: StateInterface) => state.details.filters);

  return (
    <div className="category-row-container flex-row">
      {filters.categories.map((category, key) => (
        <CategoryCircle key={key} category={category} />
      ))}
    </div>
  );
}

export default CategoryRow;
