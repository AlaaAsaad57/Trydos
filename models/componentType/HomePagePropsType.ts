import React from "react";

export interface HortiznalScrollBarProps {
  className: string;
  children: React.ReactNode;
  id: string;
  dataCy?: string;
  time?: string;
  onClick?: () => void;
}

export interface CategoryNavMobileProps {
  name: string;
  icon: string;
  myKey: number;
  slug: string;
  active: boolean;
  params: any;
}

export interface NavbarServerProps {
  lang: string;
  mainCategory: string;
  categoriesData: any;
  time: any;
}

export interface HomePageProps {
  params: {
    lang: string;
    mainCategory?: string;
  };
}
