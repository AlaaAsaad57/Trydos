function Logo({ animated, style }: { animated: boolean; style: boolean }) {
  return (
    <div className="logo-container">
      <img fetchPriority="high" loading="eager" src="/svg/Logo.svg" />
    </div>
  );
}

export default Logo;
