function Logo({ animated, style }: { animated: boolean; style: boolean }) {
  return (
    <div className="logo-container">
      <img
        fetchPriority="high"
        alt="TryDos Logo"
        width={130}
        height={36}
        loading="eager"
        src="/svg/Logo.svg"
      />
    </div>
  );
}

export default Logo;
