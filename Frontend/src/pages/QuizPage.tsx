import { useEffect, useState } from "react";
import {
  getAllQuestions,
  submitAnonymousTest,
  submitUserTest,
} from "../features/quiz/api";
import type { QuestionsDto, UserAnswerDto } from "../features/quiz/models";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";
import { Reorder } from "framer-motion";

import type { RootState } from "../app/store";
import { useSelector } from "react-redux";
import AppLayout from "../layouts/AppLayout";

type AnswerState = {
  answerIds?: number[];
  sliderValue?: number;
  ranking?: number[];
};

export default function QuizPage() {
  const [questions, setQuestions] = useState<QuestionsDto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [loading, setLoading] = useState(true);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllQuestions();
        setQuestions(data);
        const cached = localStorage.getItem("quizAnswers");
        if (cached) setAnswers(JSON.parse(cached));
      } catch (err) {
        console.error("Failed to load questions", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem("quizAnswers", JSON.stringify(answers));
  }, [answers]);

  const currentQuestion = questions[currentIndex];
  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (!currentQuestion) return <div>No questions found.</div>;

  const handleSelect = (answerId: number) => {
    if (currentQuestion.type === "multiple") {
      setAnswers((prev) => {
        const prevSelected = prev[currentQuestion.id]?.answerIds ?? [];
        const newSelected = prevSelected.includes(answerId)
          ? prevSelected.filter((id) => id !== answerId)
          : [...prevSelected, answerId];
        return {
          ...prev,
          [currentQuestion.id]: {
            ...prev[currentQuestion.id],
            answerIds: newSelected,
          },
        };
      });
    } else {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          ...prev[currentQuestion.id],
          answerIds: [answerId],
        },
      }));
      handleNext();
    }
  };

  const handleSliderChange = (value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        sliderValue: value,
      },
    }));
  };

  const handleRankingChange = (ranking: number[]) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        ranking,
      },
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1)
      setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const handleSubmit = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();

    const submission: UserAnswerDto[] = Object.entries(answers)
      .filter(
        ([, ans]) =>
          ans.answerIds?.length ||
          ans.sliderValue !== undefined ||
          ans.ranking?.length
      )
      .map(([qid, ans]) => ({
        QuestionId: Number(qid),
        AnswerIds: ans.answerIds ?? [],
        SliderValue: ans.sliderValue ?? null,
        Ranking: ans.ranking ?? null,
      }));

    try {
      let result;
      if (isAuthenticated) {

        result = await submitUserTest(submission);
      } else {


        result = await submitAnonymousTest(submission);
      }
      localStorage.removeItem("quizAnswers");
      navigate("/results", { state: { result, submission } });
    } catch (err) {
      console.error(err);
      alert("Failed to submit quiz. Please try again.");
    }
  };

  const currentAnswer = answers[currentQuestion.id];
  const currentRanking =
    currentAnswer?.ranking ??
    currentQuestion.answerOptions.map((ans) => ans.id);

  const isCurrentQuestionAnswered = (() => {
    switch (currentQuestion.type) {
      case "single":
      case "multiple":
        return (currentAnswer?.answerIds?.length ?? 0) > 0;
      case "slider":
        return currentAnswer?.sliderValue !== undefined;
      case "rank":
        return Array.isArray(currentAnswer?.ranking);
      default:
        return true;
    }
  })();

  return (
    <AppLayout>
      <div className="relative min-h-screen bg-white dark:bg-deep-navy text-slate-900 dark:text-white flex flex-col items-center justify-center px-6 transition-colors duration-300">
        <div className="max-w-2xl w-full text-center">
          <h2 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-white transition-colors">
            Question {currentIndex + 1} of {questions.length}
          </h2>
          <p className="text-lg mb-8 text-slate-700 dark:text-gray-300 transition-colors">{currentQuestion.text}</p>

          <div className="flex flex-col gap-3 mb-10">
            {/* Single / Multiple Choice */}
            {["single", "multiple"].includes(currentQuestion.type) &&
              currentQuestion.answerOptions.map((ans) => (
                <Button
                  key={ans.id}
                  onClick={() => handleSelect(ans.id)}
                  className={`py-3 rounded-lg transition-all border transition-colors ${
                    answers[currentQuestion.id]?.answerIds?.includes(ans.id)
                      ? "bg-ionian-blue text-white border-ionian-blue"
                      : "bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
                  }`}
                >
                  {ans.text}
                </Button>
              ))}

            {/* Slider */}
            {currentQuestion.type === "slider" && (
              <div className="flex flex-col gap-4">
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={answers[currentQuestion.id]?.sliderValue ?? 0}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm mt-1">
                  <span>0</span>
                  <span>{answers[currentQuestion.id]?.sliderValue ?? 0}</span>
                  <span>10</span>
                </div>
              </div>
            )}
          </div>

          {/* Ranking */}
          {currentQuestion.type === "rank" && (
            <div className="flex flex-col gap-6">
              <p className="text-sm mb-2 opacity-80">
                Drag the items to reorder them:
              </p>

              <Reorder.Group
                axis="y"
                values={currentRanking}
                onReorder={handleRankingChange}
                className="flex flex-col gap-3"
              >
                {currentRanking.map((answerId, index) => {
                  const answer = currentQuestion.answerOptions.find(
                    (x) => x.id === answerId
                  );
                  const isSelected =
                    answers[currentQuestion.id]?.answerIds?.includes(answerId);

                  return (
                    <Reorder.Item
                      key={answerId}
                      value={answerId}
                      transition={{
                        layout: { type: "spring", stiffness: 350, damping: 32 },
                      }}
                      whileDrag={{
                        scale: 1.02,
                        boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
                      }}
                      className={`py-3 px-4 rounded-lg border cursor-grab active:cursor-grabbing transition-colors ${
                        isSelected
                          ? "bg-ionian-blue text-white border-ionian-blue"
                          : "bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
                      }`}
                      style={{ zIndex: currentRanking.length - index }}
                    >
                      {answer?.text}
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-10 flex justify-between">
            <Button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white px-6 py-3 rounded-lg hover:bg-slate-300 dark:hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </Button>

            {currentIndex < questions.length - 1 ? (
              <Button
                onClick={handleNext}
                className="bg-ionian-blue hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                disabled={
                  ["single", "multiple"].includes(currentQuestion.type) &&
                  !isCurrentQuestionAnswered
                }
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isCurrentQuestionAnswered}
                className={`px-6 py-3 rounded-lg transition-colors shadow-lg ${
                  isCurrentQuestionAnswered
                    ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/20"
                    : "bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-white/30 cursor-not-allowed shadow-none"
                }`}
              >
                Submit ✅
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
