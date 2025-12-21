interface Label {
  text: string;
  color: string;
}

interface Props {
  labels: Label[];
  displayDuration?: number; // Total time each label stays visible (including transition)
  transitionDuration?: number;
}

export const ProductLabelsAnimated = ({
  labels,
  displayDuration = 2000,
  transitionDuration = 500,
}: Props) => {
  // const [currentIndex, setCurrentIndex] = useState(0);
  // const currentLabel = labels[currentIndex];

  // useEffect(() => {
  //   if (labels.length <= 1) return;

  //   const interval = setInterval(() => {
  //     setCurrentIndex((i) => (i + 1) % labels.length);
  //   }, displayDuration);

  //   return () => clearInterval(interval);
  // }, [labels.length, displayDuration]);

  if (labels.length === 1) {
    return (
      <div className="relative h-6 min-w-[150px] overflow-hidden select-none">
        <span
          className="absolute text-[9px]"
          style={{
            color: "#388CFF",
            opacity: 1,
          }}
        >
          {labels?.[0]}
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative h-6 min-w-[150px] overflow-hidden select-none"
      style={{ height: "1.5rem" }}
    >
      <span
        key={0} // this forces re-animation on each label
        className="absolute will-change-transform text-[9px] transition-all"
        style={{
          color: "#388CFF",
          opacity: 1,
          transform: "translateY(0)",
          transition: `opacity ${transitionDuration}ms ease, transform ${transitionDuration}ms ease`,
          animation: `fadeSlide ${displayDuration}ms ease`,
        }}
      >
        {labels?.[0]}
      </span>
    </div>
  );
};
