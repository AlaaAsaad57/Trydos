import React from "react";

export interface HortiznalScrollBarProps {
  className: string;
  children: React.ReactNode;
  id: string;
  dataCy?: string;
  time?: string;
  onClick?: (e?: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export interface CategoryNavMobileProps {
  name: string;
  icon: string;
  myKey: number;
  slug: string;
  active: boolean;
  params: any;
  outline?: string;
}

export interface NavbarServerProps {
  lang: string;
  mainCategory: string;
  categoriesData: any;
  children: React.ReactNode;
}

export interface HomePageProps {
  params: {
    lang: string;
    mainCategory?: string;
  };
}
