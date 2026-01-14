function ThreePoints({ active }) {
  return (
    <>
      {active ? (
        <img src="/icons/activethreepoints.svg" />
      ) : (
        <img src="/icons/threepoints.svg" />
      )}
    </>
  );
}

export default ThreePoints;
