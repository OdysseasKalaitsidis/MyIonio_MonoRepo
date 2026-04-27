import { StackedComparisonChart } from "../StackedComparisonChart";
import { ConfidenceDonut } from "../ConfidenceDonut";
import { MajorsMap, ToolboxesMap } from "../../data/UniData";

type ComparisonPoint = {
  name: string;
  score: number;
};

type InsightsSectionProps = {
  majorComparisonData: ComparisonPoint[];
  toolboxComparisonData: ComparisonPoint[];
  confidencePercentage: number;
  confidenceLabel: string;
  primaryMajorKey: string;
  primaryToolboxKey: string;
};

export function InsightsSection({
  majorComparisonData,
  toolboxComparisonData,
  confidencePercentage,
  confidenceLabel,
  primaryMajorKey,
  primaryToolboxKey,
}: InsightsSectionProps) {
  const showCharts =
    majorComparisonData.length > 0 || toolboxComparisonData.length > 0;

  return (
    <section className="space-y-8">
      <SectionIntro
        eyebrow="Performance insights"
        title="Charts & diagnostics"
        helper="Dive deeper into how the matches compare"
      />

      <div className="grid gap-8">
        {showCharts && (
          <div className="grid gap-8 lg:grid-cols-2">
            {majorComparisonData.length > 0 && (
              <StackedComparisonChart
                data={majorComparisonData}
                title="Top Major Candidates"
                highlightName={MajorsMap[primaryMajorKey] || primaryMajorKey}
              />
            )}
            {toolboxComparisonData.length > 0 && (
              <StackedComparisonChart
                data={toolboxComparisonData}
                title="Top Toolbox Candidates"
                highlightName={
                  ToolboxesMap[primaryToolboxKey] || primaryToolboxKey
                }
              />
            )}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-[320px,1fr] items-center">
          <ConfidenceDonut
            value={confidencePercentage}
            label={confidenceLabel}
            description="Represents how strongly your answers aligned with the recommended path."
          />
          <div className="bg-surface/60 rounded-3xl p-8 shadow-lg h-full flex flex-col justify-center">
            <h4 className="text-2xl font-semibold mb-4">
              Confidence commentary
            </h4>
            <p className="text-text-muted leading-relaxed">
              A higher confidence level means your quiz answers clearly match
              the traits of the recommended majors and toolboxes. If the
              percentage is moderate, explore the reasoning insights to see
              which areas you might want to strengthen or revisit.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionIntro({
  eyebrow,
  title,
  helper,
}: {
  eyebrow: string;
  title: string;
  helper: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-text-muted">
          {eyebrow}
        </p>
        <h2 className="text-3xl font-semibold">{title}</h2>
      </div>
      <span className="text-text-muted text-sm">{helper}</span>
    </div>
  );
}
