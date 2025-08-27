export interface RatingStarsPropsType {
  initialRating?: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
  color?: string;
}
