import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { UserAnswerDto } from "../quiz/models";

interface QuizState {
  cachedAnswers: UserAnswerDto[] | null;
}

const initialState: QuizState = {
  cachedAnswers: null,
};

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    setCachedAnswers(state, action: PayloadAction<UserAnswerDto[]>) {
      state.cachedAnswers = action.payload;
    },
    clearCachedAnswers(state) {
      state.cachedAnswers = null;
    },
  },
});

export const { setCachedAnswers, clearCachedAnswers } = quizSlice.actions;
export default quizSlice.reducer;
