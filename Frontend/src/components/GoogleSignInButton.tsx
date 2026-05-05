import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useDispatch, useSelector } from "react-redux";
import { loginWithGoogle } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../app/store";

interface GoogleSignInButtonProps {
  onSuccess?: (credential: string) => void;
}

export const GoogleSignInButton = ({ onSuccess }: GoogleSignInButtonProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  // Select preferences from store to sync existing guest data
  const { semester, major, minor, department, selectedCourses } = useSelector((state: RootState) => state.preferences);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      if (onSuccess) {
        onSuccess(credentialResponse.credential);
      } else {
        try {
          const result = await dispatch(
            loginWithGoogle({ 
                idToken: credentialResponse.credential,
                semester: semester?.toString() || undefined,
                major: major || undefined,
                minor: minor || undefined,
                department: department || undefined,
                enrolledCourses: selectedCourses 
            })
          );

          if (loginWithGoogle.fulfilled.match(result)) {
            navigate("/dashboard");
          }
        } catch (error) {
          console.error("Google login error:", error);
        }
      }
    }
  };

  const handleError = () => {
    console.error("Google Login Failed");
  };

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      <div className="relative w-full group">
        {/* Decorative background glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        
        <div className="relative flex justify-center w-full bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm overflow-hidden border border-slate-200 dark:border-white/10">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap
            theme={document.documentElement.classList.contains('dark') ? "filled_black" : "outline"}
            shape="pill"
            width="100%"
            text="continue_with"
            logo_alignment="left"
          />
        </div>
      </div>
    </div>
  );
};
