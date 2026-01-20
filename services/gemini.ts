export const generateProblemContext = async (num1: number, num2: number): Promise<string> => {
  return `Let's multiply ${num1} × ${num2} together!`;
};

export const getTutorHelp = async (step: string, problem: string, userError?: string): Promise<string> => {
  return "Don't give up! You can do it. Try checking your math again.";
};

export const getCelebrationMessage = async (): Promise<string> => {
  return "Amazing job! You are a Decimal Detective master!";
};
