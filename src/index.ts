import type {
  Reporter,
  ReporterOnStartOptions,
  Test,
  TestContext,
  TestResult,
  AggregatedResult,
  Config,
} from "@jest/reporters";
import axios from "axios";

interface CIPulseReporterOptions {
  apiKey: string;
  apiUrl?: string;
  repositoryId?: string;
  projectName?: string;
  commitSha?: string;
  branch?: string;
  buildNumber?: string;
  buildUrl?: string;
}

interface TestInfo {
  title: string;
  status: "passed" | "failed" | "pending" | "skipped";
  duration: number;
  failureMessages?: string[];
  filePath: string;
  fullName: string;
}

class CIPulseReporter implements Reporter {
  private options: CIPulseReporterOptions;
  private testResults: TestInfo[] = [];
  private startTime: number = 0;
  private endTime: number = 0;
  private readonly apiUrl: string = "https://app.cipulse.dev/api/test-reports";

  constructor(
    _globalConfig: Config.GlobalConfig,
    options: CIPulseReporterOptions,
  ) {
    this.options = options || {};

    if (!this.options.apiKey) {
      throw new Error("CIPulseReporter requires an apiKey option");
    }
  }

  onRunStart(
    _results: AggregatedResult,
    _options: ReporterOnStartOptions,
  ): void {
    this.startTime = Date.now();
    this.testResults = [];
    console.log("CIPulseReporter started...");
  }

  onTestResult(
    _test: Test,
    testResult: TestResult,
    _aggregatedResult: AggregatedResult,
  ): void {
    if (testResult.testResults) {
      testResult.testResults.forEach((result) => {
        this.testResults.push({
          title: result.title,
          status: result.status as "passed" | "failed" | "pending" | "skipped",
          duration: result.duration || 0,
          failureMessages: result.failureMessages,
          filePath: testResult.testFilePath,
          fullName: result.fullName,
        });
      });
    }
  }

  async onRunComplete(
    _contexts: Set<TestContext>,
    results: AggregatedResult,
  ): Promise<void> {
    this.endTime = Date.now();

    try {
      const summary = {
        success: results.numPassedTests,
        failed: results.numFailedTests,
        pending: results.numPendingTests,
        total: results.numTotalTests,
        duration: this.endTime - this.startTime,
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date(this.endTime).toISOString(),
        repositoryId: this.options.repositoryId,
        projectName: this.options.projectName || process.env.PROJECT_NAME,
        commitSha: this.options.commitSha || process.env.GIT_COMMIT,
        branch: this.options.branch || process.env.GIT_BRANCH,
        buildNumber: this.options.buildNumber || process.env.BUILD_NUMBER,
        buildUrl: this.options.buildUrl || process.env.BUILD_URL,
        tests: this.testResults,
      };

      const targetUrl = this.options.apiUrl || this.apiUrl;
      console.log(`Sending test results to ${targetUrl}...`);

      // Send data to the API
      await axios.post(targetUrl, summary, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.options.apiKey}`,
        },
      });

      console.log("Test results successfully sent to CIPulse API");
    } catch (error) {
      console.error("Failed to send test results to CIPulse API:", error);
    }
  }

  getLastError(): Error | undefined {
    return undefined;
  }
}

export = CIPulseReporter;
