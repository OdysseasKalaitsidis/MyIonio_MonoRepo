import { api } from "../../lib/axios";

export interface CourseReview {
    id: string;
    courseName: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface SubmitReview {
    courseName: string;
    rating: number;
    comment: string;
}

export interface CourseRatingSummary {
    courseName: string;
    averageRating: number;
    totalReviews: number;
}

export const reviewsApi = {
    getReviews: async (courseName: string): Promise<CourseReview[]> => {
        const response = await api.get<CourseReview[]>(`/CourseReview/${encodeURIComponent(courseName)}`);
        return response.data;
    },
    getSummary: async (courseName: string): Promise<CourseRatingSummary> => {
        const response = await api.get<CourseRatingSummary>(`/CourseReview/${encodeURIComponent(courseName)}/summary`);
        return response.data;
    },
    submitReview: async (review: SubmitReview): Promise<{ message: string }> => {
        const response = await api.post<{ message: string }>("/CourseReview", review);
        return response.data;
    }
};
