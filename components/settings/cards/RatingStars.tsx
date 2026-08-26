"use client";
import { useState } from "react";

const StarIcon = ({ fill = () => "#402CDD", isHalf = false, color, size }) => {
  let random = parseInt((Math.random() * 10000000)?.toString());
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 11.326 11.318"
    >
      <path
        id="Path_23396"
        data-name="Path 23396"
        d="M23.39,7.542,22.122,8.82l.3,1.81a1.47,1.47,0,0,1-.559,1.424,1.352,1.352,0,0,1-1.481.11l-1.564-.851-1.57.853a1.345,1.345,0,0,1-.654.17,1.368,1.368,0,0,1-.827-.28,1.479,1.479,0,0,1-.559-1.426l.3-1.81L14.244,7.542a1.483,1.483,0,0,1-.357-1.493,1.411,1.411,0,0,1,1.133-.992l1.753-.264.784-1.645a1.392,1.392,0,0,1,1.26-.812h0a1.4,1.4,0,0,1,1.26.814l.78,1.642,1.753.264a1.414,1.414,0,0,1,1.135.992,1.483,1.483,0,0,1-.357,1.493Z"
        transform="translate(-13.654 -2.186)"
        fill={fill()}
        // fill={isHalf ? `url(#halfGradient${random})` : fill()}
        stroke={color}
        strokeWidth="0.3"
      />
    </svg>
  );
};

function RatingStars({
  initialRating = 0,
  onRatingChange,
  readOnly = false,
  color = "#402CDD",
  size = 11.326,
}: any) {
  const [rating, setRating] = useState(initialRating);

  const handleClick = (index: number, isHalf: boolean) => {
    if (!readOnly) {
      // const newRating = isHalf ? index - 0.5 : index;
      const newRating = index;

      setRating(newRating);

      onRatingChange?.(newRating);
    }
  };

  const getStarFill = (index: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    if (rating === 0) return "transparent";

    if (index <= fullStars) return color; // full stars

    if (index === fullStars + 1 && hasHalfStar) return color; // this is your half star

    return "transparent"; // empty stars
  };

  return (
    <div className="flex flex-row gap-1" >
      {[1, 2, 3, 4, 5].map((index) => (
        <div
          key={index}
          className="cursor-pointer relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const isHalf = e.clientX - rect.left < rect.width / 2;
            handleClick(index, isHalf);
          }}
        >
          <StarIcon
            size={size}
            fill={() => getStarFill(index)}
            isHalf={index === Math.ceil(rating) && rating % 1 !== 0}
            color={color}
          />
        </div>
      ))}
    </div>
  );
}

export default RatingStars;
