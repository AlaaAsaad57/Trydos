"use client";
import React from "react";
import CategoryCircle from "./CategoryCircle";
import { useAppStore } from "store";

function CategoryRow() {
  const { filters } = useAppStore();

  return (
    <div className="category-row-container flex-row" data-cy="categoryBox">
      {filters.categories.map((category, key) => (
        <CategoryCircle key={key} category={category} />
      ))}
    </div>
  );
}

export default CategoryRow;
