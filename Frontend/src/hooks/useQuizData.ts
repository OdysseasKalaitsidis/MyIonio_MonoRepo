import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import type { RecommendationDto, UserAnswerDto } from "../features/quiz/models";

interface UseQuizDataReturn {
  quizRecommendation: RecommendationDto | null;
  quizUserAnswers: UserAnswerDto[] | null;
  clearQuizData: () => void;
}

export function useQuizData(): UseQuizDataReturn {
  const location = useLocation();
  const recommendationState = location.state?.recommendation;
  const userAnswersState = location.state?.userAnswers;

  const [quizRecommendation, setQuizRecommendation] =
    useState<RecommendationDto | null>(() => {
      if (recommendationState) return recommendationState;
      try {
        const stored = localStorage.getItem("quizRecommendation");
        return stored ? (JSON.parse(stored) as RecommendationDto) : null;
      } catch {
        return null;
      }
    });

  const [quizUserAnswers, setQuizUserAnswers] = useState<
    UserAnswerDto[] | null
  >(() => {
    if (userAnswersState) return userAnswersState;
    try {
      const stored = localStorage.getItem("quizUserAnswers");
      return stored ? (JSON.parse(stored) as UserAnswerDto[]) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (recommendationState) {
      setQuizRecommendation(recommendationState);
      localStorage.setItem(
        "quizRecommendation",
        JSON.stringify(recommendationState)
      );
    }
  }, [recommendationState]);

  useEffect(() => {
    if (userAnswersState) {
      setQuizUserAnswers(userAnswersState);
      localStorage.setItem("quizUserAnswers", JSON.stringify(userAnswersState));
    }
  }, [userAnswersState]);

  const clearQuizData = () => {
    localStorage.removeItem("quizRecommendation");
    localStorage.removeItem("quizUserAnswers");
    setQuizRecommendation(null);
    setQuizUserAnswers(null);
  };

  return { quizRecommendation, quizUserAnswers, clearQuizData };
}
