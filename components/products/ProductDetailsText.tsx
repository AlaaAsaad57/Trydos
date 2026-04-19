function ProductDetailsText({ details, isRtl }) {
  return (
    <div className={`${isRtl ? "dir-rtl" : ""} product-details-text`}>
      <div
        id="details"
        className="have-arabic "
        dangerouslySetInnerHTML={{
          __html: details,
        }}
      />
    </div>
  );
}

export default ProductDetailsText;
