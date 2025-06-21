export interface AnimatedComponentPropstype {
    show: boolean;
    children: React.ReactNode;
    style?: React.CSSProperties;
    mountAnim?: string;
    unmountAnim?: string;
    unmountTime?: number;
    role?: string;
    className?: string;
}