export interface QuestionsDto {
  id: number; // maps to QuestionId
  text: string; // maps to Text
  index: number; // maps to Index
  type: string; // SingleChoice, MultipleChoice, Scale
  answerOptions: AnswerOptionDto[];
}

export interface AnswerOptionDto {
  id: number;
  text: string;

  weight: number;
  majorPoints: Record<string, number>;
  toolboxPoints: Record<string, number>;
  sliderMin?: number | null;
  sliderMax?: number | null;
  rankingOptions?: number[] | null;
}

export interface UserAnswerDto {
  QuestionId: number;
  AnswerIds: number[];
  SliderValue?: number | null;
  Ranking?: number[] | null;
}

export interface SubmitAnswersDto {
  userAnswerDto: UserAnswerDto[];
}

export interface ReasoningDto {
  primaryMajor: string;
  secondaryMajor: string;
  majorReasons: string[];
  toolboxReasons: string[];
}

export interface MajorReasoningDto {
  Primary: string;
  PrimaryComment: string;
  Secondary: string;
  SecondaryComment: string;
}

export interface ToolboxReasoningDto {
  Primary: string;
  Secondary: string;
  Summary: string;
}

export interface RecommendationDto {
  primaryMajor: string;
  secondaryMajor: string;
  primaryToolbox: string;
  secondaryToolbox: string;
  confidenceLevel: string;
  profileType?: string; // optional with default "Standard"
  reasoning: ReasoningDto;
  UserMajorScores?: Record<string, number>; // user scores
  MaxMajorScores?: Record<string, number>; // max possible scores
  UserToolboxScores?: Record<string, number>;
  MaxToolboxScores?: Record<string, number>;
}
