function Logo({ animated, style }) {
  return (
    <div className="logo-container" data-cy="storeLogo">
      <img
        fetchPriority="high"
        alt="TryDos Logo"
        width={130}
        height={36}
        loading="eager"
        src="/icons/Logo.svg"
      />
    </div>
  );
}

export default Logo;
