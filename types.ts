export interface MathProblem {
  num1: number;
  num2: number;
  id: string;
}

export enum WizardStep {
  INTRO = 'INTRO',
  HIDE_DECIMALS = 'HIDE_DECIMALS',
  MULTIPLY = 'MULTIPLY',
  COUNT_DECIMALS = 'COUNT_DECIMALS',
  PLACE_DECIMAL = 'PLACE_DECIMAL',
  SUCCESS = 'SUCCESS',
}

export interface TutorState {
  message: string;
  emotion: 'happy' | 'thinking' | 'celebrating' | 'waiting';
  isLoading: boolean;
}

export type DecimalCountState = {
  num1Decimals: number;
  num2Decimals: number;
  userCount: string;
};
