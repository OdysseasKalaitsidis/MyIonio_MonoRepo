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
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-surface border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl z-[70] overflow-hidden"
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
              <div className="w-full md:w-5/12 p-6 border-r border-slate-100 dark:border-white/5 space-y-6 overflow-y-auto">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Information</h3>
                  
                  <div className="flex items-center gap-3 text-slate-700 dark:text-gray-300">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-ionian-blue">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Day & Time</p>
                      <p className="font-semibold">{course.day}, {course.time_start} - {course.time_end}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-slate-700 dark:text-gray-300">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-ionian-blue">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Location</p>
                      <p className="font-semibold">{course.room}</p>
                    </div>
                  </div>

                  <div 
                    onClick={handleProfessorClick}
                    className="flex items-center gap-3 text-slate-700 dark:text-gray-300 cursor-pointer group hover:text-ionian-blue transition-colors"
                  >
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-ionian-blue group-hover:bg-ionian-blue group-hover:text-white transition-colors">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Professor</p>
                      <p className="font-semibold underline decoration-dotted underline-offset-4">{course.professor}</p>
                    </div>
                  </div>

                  {summary && (
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                      <p className="text-xs text-slate-500 mb-2">Overall Rating</p>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold">{summary.averageRating}</span>
                        <div>
                          <StarRating rating={summary.averageRating} size={16} />
                          <p className="text-xs text-slate-400">{summary.totalReviews} reviews</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews Side */}
              <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-black/10 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
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
                          <span className="font-bold text-sm">{review.userName}</span>
                          <span className="text-[10px] text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <StarRating rating={review.rating} size={12} />
                        {review.comment && (
                          <p className="mt-2 text-sm text-slate-600 dark:text-gray-400 italic">"{review.comment}"</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <MessageSquare size={48} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No reviews yet. Be the first!</p>
                    </div>
                  )}
                </div>

                {/* Submission Box */}
                {isAuthenticated && (
                  <div className="p-4 bg-white dark:bg-surface border-t border-slate-200 dark:border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500">Rate this course</span>
                      <StarRating 
                        rating={myRating} 
                        interactive 
                        onRatingChange={setMyRating} 
                        size={18}
                      />
                    </div>
                    <div className="relative">
                      <textarea
                        value={myComment}
                        onChange={(e) => setMyComment(e.target.value)}
                        placeholder="Add a comment (optional)..."
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ionian-blue/50 resize-none h-20"
                      />
                      <button
                        onClick={handleReviewSubmit}
                        disabled={isSubmitting || myRating === 0}
                        className="absolute right-2 bottom-2 p-2 rounded-lg bg-ionian-blue text-white disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
