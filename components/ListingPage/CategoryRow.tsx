"use client";
import React, { useEffect } from "react";
import CategoryCircle from "./CategoryCircle";
import { useSelector } from "react-redux";

function CategoryRow() {
  const filters = useSelector((state: any) => state.details.filters);
  const configureCategory = (category) => {
    let obj = { ...category, childes: [...(category?.childes || [])] };
    category.childes?.map((s) => {
      s.childes?.map((sub) => {
        obj.childes.push(sub);
      });
    });
    return obj;
  };
  return (
    <div className="category-row-container flex-row">
      {filters.categories.map((category, key) => (
        <CategoryCircle key={key} category={configureCategory(category)} />
      ))}
    </div>
  );
}

export default CategoryRow;
