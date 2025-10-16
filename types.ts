
export interface StepConfig {
  id: number;
  title: string;
  description: string;
  systemPrompt: string;
  buttonText: string;
}

export interface StepOutputs {
  [key: number]: string;
}
