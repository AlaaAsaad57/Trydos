export interface ErrorPropsType {
    error: Error & { digest?: string };
    reset: () => void;
}