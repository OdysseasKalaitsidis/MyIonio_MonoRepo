import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  Database,
  Cpu,
  ArrowLeft,
  Eye,
  RotateCcw,
  ClipboardList,
  CalendarDays,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocumentType =
  | "exam_schedule"
  | "class_schedule_simple"
  | "class_schedule_split";

interface DocTypeConfig {
  id: DocumentType;
  label: string;
  description: string;
  icon: React.ReactNode;
  hint: string;
  color: string;
}

interface UploadResult {
  success: boolean;
  document_type: string;
  file: string;
  pages_processed: number;
  rows_written: number;
  preview: Record<string, unknown>;
}

// ─── Document type registry (mirrors Python SCHEMA_REGISTRY) ─────────────────

const DOC_TYPES: DocTypeConfig[] = [
  {
    id: "exam_schedule",
    label: "Πρόγραμμα Εξετάσεων",
    description: "Flat table — date, time, course, examiner, room",
    icon: <ClipboardList size={20} />,
    hint: "e.g. Εξεταστική Ιουνίου 2026 · 1–2 pages",
    color: "from-rose-500/20 to-red-600/10 border-rose-500/30",
  },
  {
    id: "class_schedule_simple",
    label: "Ωρολόγιο (Α–Ε Εξάμηνο)",
    description: "Mon–Fri grid, one block per cell, 1–2 pages",
    icon: <CalendarDays size={20} />,
    hint: "e.g. Ωρολόγιο Β΄ Εξαμήνου 2025-2026",
    color: "from-blue-500/20 to-indigo-600/10 border-blue-500/30",
  },
  {
    id: "class_schedule_split",
    label: "Ωρολόγιο (ΣΤ–Η Εξάμηνο)",
    description: "1 page per day, columns split by major (BYN / ΚΔΕ / ΨΜΑΔ)",
    icon: <BookOpen size={20} />,
    hint: "e.g. Ωρολόγιο ΣΤ΄ Εξαμήνου 2025-2026 · 5–6 pages",
    color: "from-violet-500/20 to-purple-600/10 border-violet-500/30",
  },
];

// ─── Pipeline step indicator ──────────────────────────────────────────────────

const STEPS = [
  { label: "PDF → Images", icon: <FileText size={14} /> },
  { label: "Gemini Extraction", icon: <Cpu size={14} /> },
  { label: "Validation", icon: <CheckCircle2 size={14} /> },
  { label: "DB Write", icon: <Database size={14} /> },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [department, setDepartment] = useState("Τμήμα Πληροφορικής");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [activeStep, setActiveStep] = useState(-1);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const AI_URL = import.meta.env.VITE_AI_URL ?? "http://localhost:8000";

  // ─── File drop handling ───────────────────────────────────────────────────

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
      setStatus("idle");
      setResult(null);
    } else {
      toast.error("Only PDF files are supported");
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    if (chosen) {
      setFile(chosen);
      setStatus("idle");
      setResult(null);
    }
  };

  // ─── Upload & pipeline ────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!file || !selectedType) return;

    setStatus("uploading");
    setResult(null);
    setErrorMsg("");
    setActiveStep(0);

    // Simulate step progression while waiting for the response
    const stepTimers = [800, 2500, 4500].map((delay, i) =>
      setTimeout(() => setActiveStep(i + 1), delay)
    );

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", selectedType);
      formData.append("department", department);

      const res = await fetch(`${AI_URL}/pipeline/upload`, {
        method: "POST",
        body: formData,
      });

      stepTimers.forEach(clearTimeout);
      setActiveStep(3);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.detail ?? data.message ?? "Pipeline failed");
      }

      await new Promise((r) => setTimeout(r, 600)); // let step 3 render
      setActiveStep(4);
      setResult(data);
      setStatus("success");
      toast.success(
        `✅ ${data.rows_written} records written to database`
      );
    } catch (err: unknown) {
      stepTimers.forEach(clearTimeout);
      setActiveStep(-1);
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Unknown error";
      setErrorMsg(msg);
      toast.error(`Pipeline failed: ${msg}`);
    }
  };

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
    setActiveStep(-1);
    setShowPreview(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isReady = file !== null && selectedType !== null && status !== "uploading";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      {/* Ambient gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-ionian-blue/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* ── Header ── */}
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors group"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
                  <Database size={22} className="text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Admin Upload
                </h1>
              </div>
              <p className="text-text-muted text-sm leading-relaxed max-w-lg">
                Upload a PDF document. The AI pipeline converts it to images,
                extracts structured data with Gemini, validates it, and writes
                directly to the database.
              </p>
            </div>
          </div>
        </div>

        {/* ── Step 1: Document Type ── */}
        <Section label="1 · Select document type" icon={<ClipboardList size={16} />}>
          <div className="grid gap-3">
            {DOC_TYPES.map((dt) => (
              <motion.button
                key={dt.id}
                id={`doc-type-${dt.id}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedType(dt.id)}
                className={`
                  w-full text-left p-4 rounded-xl border transition-all duration-200
                  bg-gradient-to-r ${dt.color}
                  ${
                    selectedType === dt.id
                      ? "ring-2 ring-primary shadow-lg shadow-primary/10 scale-[1.01]"
                      : "opacity-70 hover:opacity-100 hover:scale-[1.005]"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-white/70">{dt.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {dt.label}
                      </span>
                      {selectedType === dt.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto"
                        >
                          <CheckCircle2
                            size={16}
                            className="text-primary flex-shrink-0"
                          />
                        </motion.div>
                      )}
                    </div>
                    <p className="text-text-muted text-xs mt-0.5">
                      {dt.description}
                    </p>
                    <p className="text-text-muted/60 text-xs mt-1 italic">
                      {dt.hint}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </Section>

        {/* ── Step 2: Department ── */}
        <Section label="2 · Department" icon={<BookOpen size={16} />}>
          <div className="relative">
            <select
              id="department-select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="
                w-full appearance-none bg-surface border border-border rounded-xl
                px-4 py-3 pr-10 text-white text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
                transition-all cursor-pointer
              "
            >
              <option value="Τμήμα Πληροφορικής">Τμήμα Πληροφορικής</option>
              <option value="Τμήμα Τουρισμού">Τμήμα Τουρισμού</option>
              <option value="Τμήμα Ξένων Γλωσσών">
                Τμήμα Ξένων Γλωσσών, Μετάφρασης και Διερμηνείας
              </option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
          </div>
        </Section>

        {/* ── Step 3: File Upload ── */}
        <Section label="3 · Upload PDF" icon={<Upload size={16} />}>
          <div
            id="pdf-dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer
              ${
                isDragging
                  ? "border-primary bg-primary/10 scale-[1.01]"
                  : file
                  ? "border-success/50 bg-success/5"
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={onFileChange}
              id="pdf-file-input"
            />

            <AnimatePresence mode="wait">
              {file ? (
                <motion.div
                  key="file-selected"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-center gap-2 text-success">
                    <FileText size={28} />
                  </div>
                  <p className="font-medium text-white">{file.name}</p>
                  <p className="text-text-muted text-xs">
                    {(file.size / 1024).toFixed(1)} KB · PDF
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reset();
                    }}
                    className="mt-2 text-xs text-text-muted hover:text-error transition-colors flex items-center gap-1 mx-auto"
                  >
                    <RotateCcw size={12} /> Remove
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="no-file"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="space-y-3"
                >
                  <div className="flex justify-center">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <Upload size={28} className="text-text-muted" />
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      Drop your PDF here
                    </p>
                    <p className="text-text-muted text-sm mt-1">
                      or{" "}
                      <span className="text-primary underline underline-offset-2">
                        click to browse
                      </span>
                    </p>
                  </div>
                  <p className="text-text-muted/60 text-xs">PDF only · any size</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Section>

        {/* ── Pipeline Steps Indicator ── */}
        <AnimatePresence>
          {status === "uploading" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Section label="Pipeline progress" icon={<Cpu size={16} />}>
                <div className="flex items-center gap-2">
                  {STEPS.map((step, i) => {
                    const done = i < activeStep;
                    const active = i === activeStep;
                    return (
                      <div key={i} className="flex items-center gap-2 flex-1">
                        <div
                          className={`
                            flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium flex-1 justify-center transition-all duration-500
                            ${
                              done
                                ? "bg-success/20 text-success border border-success/30"
                                : active
                                ? "bg-primary/20 text-primary border border-primary/30 animate-pulse"
                                : "bg-white/5 text-text-muted border border-border"
                            }
                          `}
                        >
                          {done ? (
                            <CheckCircle2 size={12} />
                          ) : active ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            step.icon
                          )}
                          <span className="hidden sm:inline">{step.label}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div
                            className={`h-px w-3 flex-shrink-0 transition-colors duration-500 ${
                              done ? "bg-success/50" : "bg-border"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Result ── */}
        <AnimatePresence>
          {status === "success" && result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <Section label="Result" icon={<CheckCircle2 size={16} />}>
                <div className="space-y-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard
                      label="Pages Processed"
                      value={result.pages_processed}
                      color="text-primary"
                    />
                    <StatCard
                      label="Records Written"
                      value={result.rows_written}
                      color="text-success"
                    />
                    <StatCard
                      label="Document Type"
                      value={
                        DOC_TYPES.find((d) => d.id === result.document_type)
                          ?.label ?? result.document_type
                      }
                      color="text-accent"
                      small
                    />
                  </div>

                  {/* Preview toggle */}
                  <button
                    id="preview-toggle-btn"
                    onClick={() => setShowPreview((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/8 border border-border transition-all text-sm text-text-muted hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <Eye size={14} />
                      {showPreview ? "Hide" : "Show"} extracted JSON preview
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${showPreview ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {showPreview && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <pre
                          id="json-preview"
                          className="
                            bg-black/40 border border-border rounded-xl p-4
                            text-xs text-text-muted overflow-auto max-h-96
                            font-mono leading-relaxed
                          "
                        >
                          {JSON.stringify(result.preview, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    id="upload-another-btn"
                    onClick={reset}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-sm text-text-muted hover:text-white transition-all"
                  >
                    <RotateCcw size={14} />
                    Upload another document
                  </button>
                </div>
              </Section>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <Section label="Pipeline Error" icon={<AlertTriangle size={16} />}>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-error/10 border border-error/30">
                    <XCircle size={18} className="text-error flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-error font-medium text-sm">
                        Pipeline failed
                      </p>
                      <p className="text-text-muted text-xs mt-1 font-mono break-all">
                        {errorMsg}
                      </p>
                    </div>
                  </div>
                  <button
                    id="retry-btn"
                    onClick={() => setStatus("idle")}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-sm text-text-muted hover:text-white transition-all"
                  >
                    <RotateCcw size={14} />
                    Try again
                  </button>
                </div>
              </Section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Submit Button ── */}
        {status !== "success" && (
          <motion.button
            id="run-pipeline-btn"
            onClick={handleUpload}
            disabled={!isReady}
            whileHover={isReady ? { scale: 1.01 } : {}}
            whileTap={isReady ? { scale: 0.98 } : {}}
            className={`
              w-full py-4 rounded-2xl font-semibold text-base transition-all duration-300
              flex items-center justify-center gap-3
              ${
                isReady
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25 hover:shadow-primary/40"
                  : "bg-white/5 text-text-muted border border-border cursor-not-allowed"
              }
            `}
          >
            {status === "uploading" ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Running pipeline…
              </>
            ) : (
              <>
                <Cpu size={20} />
                Run AI Pipeline
              </>
            )}
          </motion.button>
        )}

        {/* ── Not-ready hint ── */}
        {!isReady && status === "idle" && (
          <p className="text-center text-text-muted/60 text-xs -mt-4">
            {!selectedType && !file
              ? "Select a document type and upload a PDF to continue"
              : !selectedType
              ? "Select a document type to continue"
              : "Upload a PDF to continue"}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 text-text-muted text-xs font-semibold uppercase tracking-wider">
        {icon}
        {label}
      </div>
      {children}
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  color,
  small = false,
}: {
  label: string;
  value: string | number;
  color: string;
  small?: boolean;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 text-center">
      <div
        className={`font-bold ${small ? "text-lg leading-tight" : "text-3xl"} ${color}`}
      >
        {value}
      </div>
      <div className="text-text-muted text-xs mt-1">{label}</div>
    </div>
  );
}
