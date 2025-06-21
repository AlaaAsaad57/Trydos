import { LogoPropsType } from "models/componentType/LogoPropsType";

function Logo({ animated, style }: LogoPropsType) {
  return (
    <div className="logo-container" data-cy="storeLogo">
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
