# Jest CIPulse Reporter

A Jest reporter that sends test results to the CIPulse API for tracking and visualization.

## Features

- Reports detailed test results to CIPulse
- Tracks passed, failed, and pending tests
- Collects test durations and failure messages
- Integrates with CI/CD pipelines
- Supports environment variables for configuration

## Installation

```bash
npm install --save-dev jest-cipulse-reporter
```

## Configuration

Add the reporter to your Jest configuration:

### In jest.config.js

```js
module.exports = {
  // ... other Jest configuration
  reporters: [
    "default", // Keep the default reporter for console output
    [
      "jest-cipulse-reporter",
      {
        apiKey: "your-api-key",
        // Optional parameters
        repositoryId: "your-repository-id", // CIPulse repository ID
        projectName: "your-project-name",
        // These can be set via environment variables instead
        // commitSha: process.env.GIT_COMMIT,
        // branch: process.env.GIT_BRANCH,
        // buildNumber: process.env.BUILD_NUMBER,
        // buildUrl: process.env.BUILD_URL
      },
    ],
  ],
};
```

### In package.json

```json
{
  "jest": {
    "reporters": [
      "default",
      [
        "jest-cipulse-reporter",
        {
          "apiKey": "your-api-key",
          "repositoryId": "your-repository-id"
        }
      ]
    ]
  }
}
```

## Environment Variables

The reporter will automatically look for these environment variables if the corresponding options are not provided:

- `PROJECT_NAME`: Name of your project
- `GIT_COMMIT`: Current commit SHA
- `GIT_BRANCH`: Current branch name
- `BUILD_NUMBER`: CI/CD build number
- `BUILD_URL`: URL to the build in your CI/CD system

## Required Options

- `apiKey`: An API key generated in the CIPulse dashboard

## Optional Options

- `apiUrl`: The URL of the CIPulse API endpoint (defaults to "https://app.cipulse.dev/api/test-reports")
- `repositoryId`: The ID of your repository in CIPulse
- `projectName`: Name of your project
- `commitSha`: The Git commit SHA
- `branch`: The Git branch name
- `buildNumber`: Your CI/CD build number
- `buildUrl`: URL to your build in your CI/CD system

## CI/CD Integration

### GitHub Actions

```yaml
name: Run Tests with CIPulse Reporter

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
        env:
          GIT_COMMIT: ${{ github.sha }}
          GIT_BRANCH: ${{ github.ref_name }}
          BUILD_NUMBER: ${{ github.run_number }}
          BUILD_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

### CircleCI

```yaml
version: 2.1
jobs:
  test:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - run: npm ci
      - run:
          name: Run tests
          command: npm test
          environment:
            GIT_COMMIT: << pipeline.git.revision >>
            GIT_BRANCH: << pipeline.git.branch >>
            BUILD_NUMBER: << pipeline.number >>
            BUILD_URL: << pipeline.url >>
```

### Jenkins

```groovy
pipeline {
    agent {
        docker {
            image 'node:18-alpine'
        }
    }
    stages {
        stage('Test') {
            steps {
                sh 'npm ci'
                sh 'npm test'
            }
            environment {
                GIT_COMMIT = "${env.GIT_COMMIT}"
                GIT_BRANCH = "${env.GIT_BRANCH}"
                BUILD_NUMBER = "${env.BUILD_NUMBER}"
                BUILD_URL = "${env.BUILD_URL}"
            }
        }
    }
}
```

## Sample Output

Here's what gets sent to the CIPulse API:

```json
{
  "success": 42,
  "failed": 5,
  "pending": 3,
  "total": 50,
  "duration": 12500,
  "startTime": "2023-04-18T12:30:45.123Z",
  "endTime": "2023-04-18T12:30:57.623Z",
  "repositoryId": "repo_123abc",
  "projectName": "My Awesome Project",
  "commitSha": "a1b2c3d4e5f6g7h8i9j0",
  "branch": "feature/new-thing",
  "buildNumber": "42",
  "buildUrl": "https://jenkins.example.com/job/my-project/42",
  "tests": [
    {
      "title": "should add numbers correctly",
      "status": "passed",
      "duration": 15,
      "filePath": "src/calculator.test.js",
      "fullName": "Calculator should add numbers correctly"
    },
    {
      "title": "should subtract numbers correctly",
      "status": "failed",
      "duration": 20,
      "failureMessages": ["Expected: 5, Received: 3"],
      "filePath": "src/calculator.test.js",
      "fullName": "Calculator should subtract numbers correctly"
    }
  ]
}
```

## License

MIT
