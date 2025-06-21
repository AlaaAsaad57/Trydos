export interface MapPropsType {
    expanded: boolean;
    setExpanded: (e: boolean) => void;
    center: { lat: number; lng: number };
    setAddressDetails: (e: any) => void;
}