export function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
      bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl
      shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-white
    "
    >
      {children}
    </div>
  );
}
