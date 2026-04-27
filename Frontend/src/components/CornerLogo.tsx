import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import type { RootState } from "../app/store";
import MyIonioLogo from "../lib/MyIonio.png";

export function CornerLogo() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const navigate = useNavigate();
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsHidden(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate("/"); // home
    } else {
      navigate("/dashboard"); // dashboard
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        "fixed top-2 left-2 z-50 rounded-lg border border-border/30 bg-black/30",
        "backdrop-blur-lg shadow-sm px-2.5 py-1 transition-opacity duration-150",
        "hover:opacity-90 cursor-pointer",
        isHidden && "opacity-0 pointer-events-none"
      )}
      aria-label="Go to dashboard"
    >
      <img
        src={MyIonioLogo}
        alt="Ionio Portal"
        className="h-6 w-auto object-contain opacity-80"
        draggable={false}
      />
    </button>
  );
}

