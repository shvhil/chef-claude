import headerLogo from "../src/assets/chef.svg";

export default function Header() {
  return (
    <>
      <header>
        <img className="header-logo" src={headerLogo} alt="website logo" />
        <span className="header-text"> Chef Claude </span>
      </header>
    </>
  );
}
