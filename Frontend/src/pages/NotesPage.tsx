import { useState, useEffect } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { 
    Upload, 
    FileText, 
    Search, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    ArrowLeft,
    Plus,
    Sparkles,
    FileUp
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

interface Note {
    id: string;
    courseName: string;
    fileName: string;
    summary: string | null;
    status: "processing" | "ready" | "failed";
    createdAt: string;
    uploaderName: string;
}

export default function NotesPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Upload state
    const [file, setFile] = useState<File | null>(null);
    const [courseName, setCourseName] = useState("");

    const fetchNotes = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notes`);
            if (response.ok) {
                const data = await response.json();
                setNotes(data);
            }
        } catch (error) {
            console.error("Failed to fetch notes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
        // Poll for updates if there are processing notes
        const interval = setInterval(() => {
            const hasProcessing = notes.some(n => n.status === "processing");
            if (hasProcessing) fetchNotes();
        }, 5000);
        return () => clearInterval(interval);
    }, [notes.some(n => n.status === "processing")]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !courseName) {
            toast.error("Please provide both a course name and a PDF file.");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("courseName", courseName);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notes/upload`, {
                method: "POST",
                body: formData,
                // Auth header handled by interceptors or common logic if existing, 
                // otherwise assuming credentials/standard auth flow.
            });

            if (response.ok) {
                toast.success("Note uploaded! AI is starting to process it.");
                setFile(null);
                setCourseName("");
                fetchNotes();
            } else {
                const error = await response.text();
                toast.error(`Upload failed: ${error}`);
            }
        } catch (error) {
            toast.error("An error occurred during upload.");
        } finally {
            setIsUploading(false);
        }
    };

    const filteredNotes = notes.filter(n => 
        n.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <PageLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <Link to="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-ionian-blue mb-4 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                        </Link>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                            Notes Hub <Sparkles className="text-amber-500 w-8 h-8" />
                        </h1>
                        <p className="text-slate-500 dark:text-gray-400">
                            Share knowledge. Get AI-powered summaries of course notes.
                        </p>
                    </div>

                    <div className="relative group max-w-md w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-ionian-blue transition-colors" size={20} />
                        <input 
                            type="text"
                            placeholder="Search by course or file name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-white/10 focus:border-ionian-blue outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Upload Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20 sticky top-8">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <FileUp /> Upload Notes
                            </h2>
                            <form onSubmit={handleUpload} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-indigo-100 mb-2">Course Name</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Algorithms & Complexity"
                                        value={courseName}
                                        onChange={(e) => setCourseName(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 placeholder:text-white/40 focus:bg-white/20 outline-none transition-all"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-indigo-100 mb-2">PDF File</label>
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/30 rounded-2xl cursor-pointer hover:bg-white/5 transition-all">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-3 text-indigo-200" />
                                            <p className="text-sm text-indigo-100">
                                                {file ? file.name : "Click to select PDF"}
                                            </p>
                                        </div>
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="application/pdf"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        />
                                    </label>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isUploading}
                                    className="w-full bg-white text-indigo-600 font-bold py-4 rounded-xl hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                                >
                                    {isUploading ? "Uploading..." : "Share with Students"}
                                    <Plus size={20} />
                                </button>
                            </form>
                            <p className="mt-6 text-xs text-indigo-200 text-center">
                                Max file size: 10MB. Files are processed asynchronously.
                            </p>
                        </div>
                    </div>

                    {/* Notes Grid */}
                    <div className="lg:col-span-2">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-64 bg-slate-100 dark:bg-white/5 animate-pulse rounded-3xl" />
                                ))}
                            </div>
                        ) : filteredNotes.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">No notes found</h3>
                                <p className="text-slate-500">Be the first to share notes for this semester!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredNotes.map((note) => (
                                    <div key={note.id} className="bg-white dark:bg-surface border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400">
                                                <FileText size={24} />
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                                note.status === "processing" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                                                note.status === "ready" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                                                "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                            }`}>
                                                {note.status === "processing" && <Clock size={12} className="animate-spin" />}
                                                {note.status === "ready" && <CheckCircle2 size={12} />}
                                                {note.status === "failed" && <AlertCircle size={12} />}
                                                {note.status.toUpperCase()}
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-ionian-blue transition-colors">
                                            {note.courseName}
                                        </h3>
                                        <p className="text-sm text-slate-500 mb-4 truncate">{note.fileName}</p>

                                        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 mb-6 min-h-[80px]">
                                            {note.status === "processing" ? (
                                                <p className="text-sm text-slate-400 italic">AI is currently summarising these notes...</p>
                                            ) : note.summary ? (
                                                <p className="text-sm text-slate-600 dark:text-gray-300 line-clamp-4 leading-relaxed">
                                                    {note.summary}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-red-400 italic">Summary could not be generated.</p>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-ionian-blue/10 flex items-center justify-center text-[10px] font-bold text-ionian-blue">
                                                    {note.uploaderName.split(" ").map(n => n[0]).join("")}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-slate-900 dark:text-white">{note.uploaderName}</p>
                                                    <p className="text-[10px] text-slate-500">{new Date(note.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            
                                            <a 
                                                href={`${import.meta.env.VITE_API_URL}/api/notes/${note.id}/file`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-ionian-blue hover:text-blue-700 text-xs font-bold transition-colors"
                                            >
                                                Download PDF
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
