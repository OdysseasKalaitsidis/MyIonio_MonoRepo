import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, MapPin, User, Send, MessageSquare, Star, Award, Info, ChevronRight } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import type { CourseEntry } from "../../features/schedule/models";
import { reviewsApi, type CourseReview, type CourseRatingSummary } from "../../features/reviews/api";
import { StarRating } from "../StarRating";
import { useNavigate } from "react-router-dom";

interface CourseDetailsModalProps {
  course: CourseEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CourseDetailsModal({ course, isOpen, onClose }: CourseDetailsModalProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [summary, setSummary] = useState<CourseRatingSummary | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(() => {
    if (isOpen && course) {
      fetchReviews();
    }
  }, [isOpen, course]);

  const fetchReviews = async () => {
    if (!course) return;
    setIsLoadingReviews(true);
    try {
      const [reviewsData, summaryData] = await Promise.all([
        reviewsApi.getReviews(course.course_name),
        reviewsApi.getSummary(course.course_name)
      ]);
      setReviews(reviewsData);
      setSummary(summaryData);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const ratingBreakdown = useMemo(() => {
    if (reviews.length === 0) return [];
    return [5, 4, 3, 2, 1].map(stars => {
      const count = reviews.filter(r => Math.round(r.rating) === stars).length;
      return {
        stars,
        count,
        percentage: (count / reviews.length) * 100
      };
    });
  }, [reviews]);

  const handleReviewSubmit = async () => {
    if (!course || myRating === 0) return;
    setIsSubmitting(true);
    try {
      await reviewsApi.submitReview({
        courseName: course.course_name,
        rating: myRating,
        comment: myComment
      });
      setMyComment("");
      setMyRating(0);
      fetchReviews();
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfessorClick = () => {
    if (course?.professor) {
      onClose();
      navigate(`/professors?name=${encodeURIComponent(course.professor)}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && course && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 md:p-6"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[700px]"
            >
              {/* Left Side: Course Info & Summary */}
              <div className="w-full md:w-5/12 flex flex-col border-r border-slate-100 dark:border-white/5 relative">
                {/* Visual Header */}
                <div className="relative h-48 shrink-0 overflow-hidden">
                  <img 
                    src="/course_header.png" 
                    alt="Course Header" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-white dark:to-slate-900" />
                  
                  <button
                    onClick={onClose}
                    className="absolute left-6 top-6 p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all text-white md:hidden"
                  >
                    <X size={20} />
                  </button>

                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ionian-blue text-white text-[10px] font-bold uppercase tracking-wider mb-3 shadow-lg shadow-blue-500/30">
                      <Award size={12} />
                      {course.type}
                    </span>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight drop-shadow-sm">
                      {course.course_name}
                    </h2>
                  </div>
                </div>

                {/* Info Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2 text-ionian-blue mb-2">
                        <Clock size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-60">Schedule</span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-white leading-tight">{course.day}</p>
                      <p className="text-sm text-slate-500 font-medium">{course.time_start} - {course.time_end}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2 text-ionian-blue mb-2">
                        <MapPin size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-60">Location</span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-white leading-tight">{course.room}</p>
                      <p className="text-sm text-slate-500 font-medium">{course.building}</p>
                    </div>
                  </div>

                  <div 
                    onClick={handleProfessorClick}
                    className="group cursor-pointer p-5 rounded-[2rem] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100/50 dark:border-white/5 hover:border-ionian-blue/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-ionian-blue">
                        <User size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-60">Professor</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-ionian-blue transition-colors">
                      {course.professor}
                    </p>
                  </div>

                  {summary && (
                    <div className="space-y-6">
                      <div className="flex items-end justify-between">
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Academic Rating</h3>
                          <div className="flex items-center gap-3">
                            <span className="text-5xl font-black text-slate-800 dark:text-white">{summary.averageRating}</span>
                            <div>
                              <StarRating rating={summary.averageRating} size={18} />
                              <p className="text-xs text-slate-500 font-bold mt-1">{summary.totalReviews} REVIEWS</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {ratingBreakdown.map((row) => (
                          <div key={row.stars} className="flex items-center gap-4 group">
                            <div className="flex items-center gap-1 w-8 shrink-0">
                              <span className="text-xs font-black text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors">{row.stars}</span>
                              <Star size={10} className="fill-slate-300 text-slate-300" />
                            </div>
                            <div className="flex-1 h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${row.percentage}%` }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-ionian-blue to-blue-400 rounded-full"
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{row.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Reviews & Submission */}
              <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-black/20 overflow-hidden relative">
                {/* Close button for desktop */}
                <button
                  onClick={onClose}
                  className="absolute right-8 top-8 p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-white/5 hover:scale-110 active:scale-95 transition-all z-10 hidden md:block"
                >
                  <X size={20} className="text-slate-500" />
                </button>

                <div className="p-8 pb-4">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-white/5">
                      <MessageSquare size={20} className="text-ionian-blue" />
                    </div>
                    Feedbacks
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6">
                  {isLoadingReviews ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 py-20">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-white/5 animate-pulse" />
                        <div className="absolute inset-0 w-12 h-12 rounded-full border-t-4 border-ionian-blue animate-spin" />
                      </div>
                      <p className="text-sm font-bold text-slate-400 animate-pulse">Gathering opinions...</p>
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-6 pt-2">
                      {reviews.map((review, idx) => (
                        <motion.div 
                          key={review.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="group relative bg-white dark:bg-slate-800/50 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-white/5 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-ionian-blue to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
                                {review.userName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-black text-slate-800 dark:text-white text-sm">{review.userName}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{new Date(review.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center gap-1.5 border border-slate-100 dark:border-white/5">
                              <span className="text-xs font-black text-slate-700 dark:text-slate-200">{review.rating}</span>
                              <Star size={12} className="fill-yellow-400 text-yellow-400" />
                            </div>
                          </div>
                          {review.comment && (
                            <div className="relative">
                              <p className="text-sm text-slate-600 dark:text-gray-400 italic leading-relaxed pl-4 border-l-2 border-slate-100 dark:border-white/10">
                                {review.comment}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6">
                        <MessageSquare size={32} className="text-slate-200" />
                      </div>
                      <p className="text-lg font-black text-slate-800 dark:text-white">Empty Classroom</p>
                      <p className="text-sm text-slate-400 max-w-[200px] mt-2">No reviews have been submitted for this course yet.</p>
                    </div>
                  )}
                </div>

                {/* Submission Form - Glassmorphism style */}
                <div className="p-8 pt-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-white/5">
                  {isAuthenticated ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Your Rating</p>
                          <p className="text-lg font-black text-slate-800 dark:text-white">How was it?</p>
                        </div>
                        <StarRating 
                          rating={myRating} 
                          interactive 
                          onRatingChange={setMyRating} 
                          size={28}
                        />
                      </div>
                      
                      <div className="relative">
                        <textarea
                          value={myComment}
                          onChange={(e) => setMyComment(e.target.value)}
                          placeholder="Tell us about the course, the professor, or anything helpful..."
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-ionian-blue/10 focus:border-ionian-blue/50 resize-none h-28 transition-all dark:text-white"
                        />
                      </div>

                      <button
                        onClick={handleReviewSubmit}
                        disabled={isSubmitting || myRating === 0}
                        className="w-full py-4 rounded-2xl bg-ionian-blue hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-3 overflow-hidden group"
                      >
                        <AnimatePresence mode="wait">
                          {isSubmitting ? (
                            <motion.div 
                              key="loading"
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -20, opacity: 0 }}
                              className="flex items-center gap-2"
                            >
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Submitting...
                            </motion.div>
                          ) : (
                            <motion.div 
                              key="ready"
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -20, opacity: 0 }}
                              className="flex items-center gap-2"
                            >
                              <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                              Share Feedback
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-center p-4">
                      <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-ionian-blue">
                        <Info size={24} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 dark:text-white">Want to join the conversation?</p>
                        <p className="text-xs text-slate-500 mt-1">Log in to share your experience with other students.</p>
                      </div>
                      <button 
                        onClick={() => { onClose(); navigate("/login"); }} 
                        className="mt-2 px-8 py-3 text-sm font-black uppercase tracking-wider text-white bg-slate-800 dark:bg-slate-700 rounded-xl hover:bg-slate-900 transition-all shadow-lg"
                      >
                        Login Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
