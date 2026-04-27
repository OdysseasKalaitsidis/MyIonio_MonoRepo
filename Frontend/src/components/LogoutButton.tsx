import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import clsx from "clsx";
import { logout } from "../features/auth/authSlice";
import type { RootState, AppDispatch } from "../app/store";
import { Button } from "./Button";

interface LogoutButtonProps {
  className?: string;
  iconSize?: number;
}

export default function LogoutButton({ className, iconSize = 20 }: LogoutButtonProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <Button
      onClick={handleLogout}
      className={clsx(
        "flex items-center gap-2 transition-colors",
        "bg-transparent hover:bg-white/5 text-white/80 hover:text-white", // Default styles (can be overridden by className)
        className
      )}
      aria-label="Logout"
    >
      <LogOut size={iconSize} />
      <span>Sign Out</span>
    </Button>
  );
}
