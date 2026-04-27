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
                IdToken: credentialResponse.credential,
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
    <div className="flex justify-center w-full">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
        theme="filled_black"
        shape="pill"
      />
    </div>
  );
};
