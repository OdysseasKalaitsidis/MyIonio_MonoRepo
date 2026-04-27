import { motion } from "framer-motion";

export type HighlightCard = {
  id: string;
  title: string;
  code: string;
  label: string;
  tone: string;
};

type HighlightSectionProps = {
  eyebrow: string;
  title: string;
  helper?: string;
  cards: HighlightCard[];
};

export function HighlightSection({
  eyebrow,
  title,
  helper,
  cards,
}: HighlightSectionProps) {
  if (!cards.length) return null;

  return (
    <section className="space-y-6">
      <SectionIntro eyebrow={eyebrow} title={title} helper={helper} />
      <div className="grid gap-6 md:grid-cols-2">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`rounded-3xl border p-6 shadow-2xl transition-colors ${card.tone}`}
          >
            <p className="text-xs uppercase tracking-[0.45em] text-slate-500 dark:text-gray-400">
              {card.title}
            </p>
            <div className="mt-4 flex flex-col gap-1">
              <span className="text-4xl font-semibold text-slate-900 dark:text-white transition-colors">{card.code}</span>
              <span className="text-lg tracking-[0.3em] uppercase text-slate-600 dark:text-white/80 transition-colors">
                {card.label}
              </span>
            </div>
          </motion.div>
        ))}
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
  helper?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-gray-400 font-medium">
          {eyebrow}
        </p>
        <h2 className="text-3xl font-semibold text-slate-900 dark:text-white transition-colors">{title}</h2>
      </div>
      {helper ? (
        <span className="text-slate-500 dark:text-gray-400 text-sm transition-colors">{helper}</span>
      ) : null}
    </div>
  );
}
