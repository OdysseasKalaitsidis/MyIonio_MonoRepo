import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import type { RecommendationDto, UserAnswerDto } from "../features/quiz/models";
import { Button } from "../components/Button";
import { MajorsMap, ToolboxesMap } from "../data/UniData";
import { ReasoningModal } from "../components/ReasoningModal";
import type { RootState } from "../app/store";

import { getUserRecommendation } from "../features/quiz/api";
import {
  HighlightSection,
  type HighlightCard,
} from "../components/results/HighlightSection";
import { InsightsSection } from "../components/results/InsightsSection";
import { CallToAction } from "../components/results/CallToAction";
import { resolveLabel } from "../utils/resolveLabel";
import AppLayout from "../layouts/AppLayout";

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const [result, setResult] = useState<RecommendationDto | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswerDto[] | null>(null);
  const userId = useSelector((state: RootState) => state.auth.user?.userId);

  const [isReasoningOpen, setIsReasoningOpen] = useState(false);

  useEffect(() => {
    const state = location.state as {
      result?: RecommendationDto;
      submission?: UserAnswerDto[];
    };

    if (state?.result) {
      // Use passed state from navigation
      setResult(state.result);
      setIsReasoningOpen(true);
      setUserAnswers(state.submission ?? null);
      return;
    }

    // Otherwise, fetch recommendation if authenticated
    if (isAuthenticated && userId) {
      getUserRecommendation(userId)
        .then((r) => {
          if (r) {
            setResult(r);
            setIsReasoningOpen(true);
          } else {
            // If backend returned null, redirect to quiz
            navigate("/quiz");
          }
        })
        .catch(() => {
          navigate("/quiz");
        });
    } else {
      // Not authenticated or no userId
      navigate("/quiz");
    }
  }, [isAuthenticated, location, navigate, userId]);

  const majorPercentages = useMemo(() => {
    const userScores =
      result?.UserMajorScores ?? result?.UserMajorScores ?? null;
    const maxScores = result?.MaxMajorScores ?? result?.MaxMajorScores ?? null;

    if (!userScores) return [];

    return Object.entries(userScores)
      .map(([majorKey, userScore]) => {
        const maxScore = maxScores?.[majorKey] ?? 0;
        const percentage =
          maxScore > 0 ? Math.round((userScore / maxScore) * 100) : 0;

        return {
          name: MajorsMap[majorKey] ?? majorKey,
          accuracy: Math.min(100, Math.max(0, percentage)),
        };
      })
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 6);
  }, [result]);

  const toolboxPercentages = useMemo(() => {
    const userScores =
      result?.UserToolboxScores ?? result?.UserToolboxScores ?? null;
    const maxScores =
      result?.MaxToolboxScores ?? result?.MaxToolboxScores ?? null;

    if (!userScores) return [];

    return Object.entries(userScores)
      .map(([toolboxKey, userScore]) => {
        const maxScore = maxScores?.[toolboxKey] ?? 0;
        const percentage =
          maxScore > 0 ? Math.round((userScore / maxScore) * 100) : 0;

        return {
          name: ToolboxesMap[toolboxKey] ?? toolboxKey,
          accuracy: Math.min(100, Math.max(0, percentage)),
        };
      })
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 6);
  }, [result]);

  const majorComparisonData = useMemo(
    () =>
      majorPercentages.slice(0, 3).map((item) => ({
        name: item.name,
        score: item.accuracy,
      })),
    [majorPercentages]
  );

  const toolboxComparisonData = useMemo(
    () =>
      toolboxPercentages.slice(0, 3).map((item) => ({
        name: item.name,
        score: item.accuracy,
      })),
    [toolboxPercentages]
  );

  const confidencePercentage = useMemo(() => {
    if (!result?.confidenceLevel) return 60;

    const numericPortion = parseInt(
      result.confidenceLevel.replace(/[^\d]/g, ""),
      10
    );
    if (!Number.isNaN(numericPortion)) {
      return Math.min(100, Math.max(0, numericPortion));
    }

    const normalized = result.confidenceLevel.toLowerCase();
    const map: Record<string, number> = {
      low: 40,
      medium: 60,
      high: 80,
      "very high": 90,
      unsure: 50,
    };
    return map[normalized] ?? 65;
  }, [result?.confidenceLevel]);

  const handleSignup = () => {
    if (result) {
      localStorage.setItem("quizRecommendation", JSON.stringify(result));
    }
    if (userAnswers) {
      localStorage.setItem("quizUserAnswers", JSON.stringify(userAnswers));
    }
    navigate("/sign-up", {
      state: {
        fromResults: true,
        result,
        userAnswers,
      },
    });
  };
  if (!result) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-white dark:bg-deep-navy text-slate-900 dark:text-white flex items-center justify-center transition-colors duration-300">
          <div className="text-center">
            <p className="text-lg mb-4 text-slate-600 dark:text-gray-300">Loading results...</p>
            <Button
              className="bg-ionian-blue hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all shadow-lg shadow-blue-500/20"
              onClick={() => navigate("/quiz")}
            >
              Back to Quiz
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const primaryMajorName = resolveLabel(MajorsMap, result.primaryMajor);
  const secondaryMajorName = resolveLabel(MajorsMap, result.secondaryMajor);
  const primaryToolboxName = resolveLabel(ToolboxesMap, result.primaryToolbox);
  const secondaryToolboxName = resolveLabel(
    ToolboxesMap,
    result.secondaryToolbox
  );

  const summaryCards: HighlightCard[] = [
    {
      id: "primary-major",
      title: "Primary Major",
      code: result.primaryMajor,
      label: primaryMajorName ?? result.primaryMajor,
      tone: "text-primary border-primary/40 bg-primary/10",
    },
    {
      id: "secondary-major",
      title: "Secondary Major",
      code: result.secondaryMajor,
      label: secondaryMajorName ?? result.secondaryMajor,
      tone: "text-accent border-accent/40 bg-accent/10",
    },
  ];

  const toolboxCards: HighlightCard[] = [
    {
      id: "primary-toolbox",
      title: "Primary Toolbox",
      code: result.primaryToolbox,
      label: primaryToolboxName ?? result.primaryToolbox,
      tone: "text-success border-success/40 bg-success/10",
    },
    {
      id: "secondary-toolbox",
      title: "Secondary Toolbox",
      code: result.secondaryToolbox,
      label: secondaryToolboxName ?? result.secondaryToolbox,
      tone: "text-yellow-300 border-yellow-300/40 bg-yellow-300/10",
    },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-white dark:bg-deep-navy text-slate-900 dark:text-white transition-colors duration-300">
        <div className="relative max-w-6xl mx-auto px-6 py-16 space-y-12">
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-3 text-center"
          >
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-gray-400 font-medium">
              Recommendation Dashboard
            </p>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white">
              Your Personalized Study Path
            </h1>
            <p className="text-slate-600 dark:text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              We analyzed your responses and built a snapshot of the majors,
              toolboxes, and skills that fit you best. Explore the cards and
              charts below like a real data dashboard.
            </p>
          </motion.header>

          <HighlightSection
            eyebrow="Suggested majors"
            title="Program lineup"
            helper="Ranked by compatibility score"
            cards={summaryCards}
          />

          <HighlightSection
            eyebrow="Suggested toolboxes"
            title="Skill focus areas"
            helper="Balance technical & creative strengths"
            cards={toolboxCards}
          />

          {/* Data Visualizations */}
          <InsightsSection
            majorComparisonData={majorComparisonData}
            toolboxComparisonData={toolboxComparisonData}
            confidencePercentage={confidencePercentage}
            confidenceLabel={result.confidenceLevel}
            primaryMajorKey={result.primaryMajor}
            primaryToolboxKey={result.primaryToolbox}
          />

          <CallToAction
            isAuthenticated={isAuthenticated}
            onPrimaryAction={() => navigate("/dashboard")}
            onSignIn={() => navigate("/signin")}
            onSignUp={handleSignup}
          />
        </div>
        <ReasoningModal
          result={result}
          isOpen={isReasoningOpen}
          onClose={() => setIsReasoningOpen(false)}
        />
      </div>
    </AppLayout>
  );
}
