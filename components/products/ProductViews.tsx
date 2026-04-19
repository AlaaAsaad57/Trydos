function ProductViews({ views }) {
  return (
    <div className="view-count flex-row align-center">
      <img src="/icons/EyeIcon.svg" />
      <span>{views ?? "1"}</span>
    </div>
  );
}

export default ProductViews;
