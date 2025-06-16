

export interface ProductsInfiniteScrollPropsType {
    productIds: string[],
    activeColor: string,
    currency: Currency,
    offset: number,
    searchParams: any,
    boutiqueId: string,
    isFeatured?: boolean,
}
export interface Currency {
    id: number
    name: string
    symbol: string
    code: string
    exchange_rate: number
}