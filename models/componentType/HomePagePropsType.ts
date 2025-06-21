import React from "react";

export interface HortiznalScrollBarProps {
  className: string;
  children: React.ReactNode;
  id: string;
  dataCy?: string;
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
}

export interface HomePageProps {
  params: {
    lang: string;
    mainCategory?: string;
  };
}
