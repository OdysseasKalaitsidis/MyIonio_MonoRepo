import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, MapPin, User, Send, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
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
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 md:p-8"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-white dark:bg-surface border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[600px]"
            >
            {/* Header */}
            <div className="relative p-6 bg-gradient-to-br from-ionian-blue to-blue-700 text-white">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-bold mb-1">{course.course_name}</h2>
              <p className="opacity-90 flex items-center gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm font-medium">
                  {course.type}
                </span>
                • {course.building}
              </p>
            </div>

            <div className="flex flex-col md:flex-row h-[500px]">
              {/* Details Side */}
              <div className="w-full md:w-5/12 p-6 border-r border-slate-100 dark:border-white/5 space-y-6 overflow-y-auto bg-white dark:bg-surface">
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-slate-800 dark:text-gray-100 border-b border-slate-100 dark:border-white/10 pb-2">Course Details</h3>
                  
                  <div className="flex items-start gap-4 text-slate-700 dark:text-gray-300">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-ionian-blue shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-0.5">Day & Time</p>
                      <p className="font-semibold">{course.day}</p>
                      <p className="text-sm opacity-80">{course.time_start} - {course.time_end}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 text-slate-700 dark:text-gray-300">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-ionian-blue shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-0.5">Location</p>
                      <p className="font-semibold">{course.room}</p>
                    </div>
                  </div>

                  <div 
                    onClick={handleProfessorClick}
                    className="flex items-start gap-4 text-slate-700 dark:text-gray-300 cursor-pointer group hover:text-ionian-blue transition-colors"
                  >
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-ionian-blue group-hover:bg-ionian-blue group-hover:text-white transition-colors shrink-0">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-0.5">Professor</p>
                      <p className="font-semibold underline decoration-dotted underline-offset-4 group-hover:text-ionian-blue">{course.professor}</p>
                    </div>
                  </div>

                  {summary && (
                    <div className="pt-5 border-t border-slate-100 dark:border-white/5 mt-6">
                      <p className="text-xs text-slate-500 font-medium mb-3">Overall Rating</p>
                      <div className="flex items-center gap-4 bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        <span className="text-4xl font-extrabold text-slate-800 dark:text-white">{summary.averageRating}</span>
                        <div>
                          <StarRating rating={summary.averageRating} size={18} />
                          <p className="text-sm text-slate-500 font-medium mt-0.5">{summary.totalReviews} {summary.totalReviews === 1 ? 'student review' : 'student reviews'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews Side */}
              <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-black/10 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white/50 dark:bg-surface/50">
                  <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-gray-100">
                    <MessageSquare size={18} className="text-ionian-blue" />
                    Student Reviews
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoadingReviews ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ionian-blue" />
                    </div>
                  ) : reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review.id} className="bg-white dark:bg-surface p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-sm text-slate-800 dark:text-gray-200">{review.userName}</span>
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <StarRating rating={review.rating} size={14} />
                        {review.comment && (
                          <p className="mt-3 text-sm text-slate-600 dark:text-gray-400 italic bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-100 dark:border-white/5">"{review.comment}"</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">No reviews yet.</p>
                      <p className="text-xs mt-1">Be the first to share your experience!</p>
                    </div>
                  )}
                </div>

                {/* Submission Box */}
                {isAuthenticated ? (
                  <div className="p-4 bg-white dark:bg-surface border-t border-slate-200 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700 dark:text-gray-300">Rate this course</span>
                      <StarRating 
                        rating={myRating} 
                        interactive 
                        onRatingChange={setMyRating} 
                        size={22}
                      />
                    </div>
                    <textarea
                      value={myComment}
                      onChange={(e) => setMyComment(e.target.value)}
                      placeholder="Share your experience (optional)..."
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ionian-blue/50 resize-none h-24 transition-all"
                    />
                    <button
                      onClick={handleReviewSubmit}
                      disabled={isSubmitting || myRating === 0}
                      className="w-full py-2.5 rounded-xl bg-ionian-blue text-white font-medium disabled:opacity-50 transition-all hover:bg-blue-600 active:scale-[0.98] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                      <Send size={16} />
                      {isSubmitting ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                ) : (
                  <div className="p-5 bg-slate-50 dark:bg-surface border-t border-slate-200 dark:border-white/10 text-center">
                    <p className="text-sm text-slate-600 dark:text-gray-400 mb-3 font-medium">Want to share your experience?</p>
                    <button onClick={() => { onClose(); navigate("/login"); }} className="w-full py-2.5 text-sm font-bold text-ionian-blue bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                      Log in to submit a review
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
