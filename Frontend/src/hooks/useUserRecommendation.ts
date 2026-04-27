import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getUserRecommendation } from "../features/quiz/api";
import type { RecommendationDto } from "../features/quiz/models";
import type { RootState } from "../app/store";

export function useUserRecommendation() {
  const userId = useSelector((state: RootState) => state.auth.user?.userId);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  const [recommendation, setRecommendation] =
    useState<RecommendationDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setRecommendation(null);
      setError("Sign in to view your personalized dashboard.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    let isMounted = true;

    getUserRecommendation(userId)
      .then((data) => {
        if (!isMounted) return;
        setRecommendation(data);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Unable to fetch latest recommendations.");
        setRecommendation(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, userId]);

  return { recommendation, isLoading, error };
}
