export type EvaluatorStatus = 'ERROR' | 'FAILED' | 'PASSED';

export type MilestoneTestResult = {
  message: string;
  name: string;
  passed: boolean;
};

export type EvaluatorResponse = {
  outputLog: string;
  passedTests: number | null;
  passRatePct: number | null;
  status: EvaluatorStatus;
  testResults: MilestoneTestResult[] | null;
  totalTests: number | null;
};

export type CommandResult = {
  exitCode: number | null;
  output: string;
  timedOut: boolean;
};
