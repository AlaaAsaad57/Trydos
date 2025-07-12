"use client";
import "styles/globals.css";
import StackedSlider from "utils/Slider";

const Page = () => {
  try {
    return (
      <div className="w-full flex-col">
        <div className="w-full h-full flex items-center justify-center">
          <StackedSlider
            slide_width={70}
            max_scale={1}
            min_scale={1}
            overlap_factor={1.1}
            max_drag={150}
            threshold={0.3}
            slidesArray={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
            initial_index={0}
            onSlideChange={(index) => {
              console.log(index);
            }}
          />
        </div>
      </div>
    );
  } catch (error) {
    throw error;
  }
};
export default Page;

// ---------------- Usage example below ----------------
