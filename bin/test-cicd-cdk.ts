#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import {
  StackConfig,
  TagResource,
  TestCicdCdkStack,
} from "../lib/test-cicd-cdk-stack";
import { z } from "zod";

const lambdaConfigShape = z.object({ tag: z.string() });

const contextShape = z.object({
  lambdas: z.record(z.string(), lambdaConfigShape),
});

type Environment = "devel" | "alpha" | "prod";

const $namespace = (repo: string, env: Environment) => {
  return function namespace(baseName: string) {
    return [repo, baseName, env].join("-");
  };
};

type StackTags = {
  Environment: Environment;
  IACPlatform: "cdk" | "terraform" | "none";
};

const $tagResource = (stackTags: StackTags): TagResource => {
  return function tagResource(resource, resourceTags) {
    Object.entries({ ...stackTags, ...resourceTags }).forEach(
      ([key, value]) => {
        cdk.Tags.of(resource).add(key, value);
      }
    );
  };
};

const app = new cdk.App();

let env: "prod" | "alpha" | "devel";
try {
  env = app.node.getContext("env");
} catch {
  throw Error(
    "You must specify a context: devel, alpha, prod. npm run cdk {{COMMAND}} -- --context env={{CONTEXT}}"
  );
}

const context = contextShape.safeParse(app.node.tryGetContext(env));

if (context.success === false) {
  throw Error(`Invalid context in cdk.json for ${env}: ${context}`);
}

const lambdas = Object.entries(context.data.lambdas).map(
  ([repoName, config]) => {
    return {
      repoName,
      ...config,
    };
  }
);

const config: StackConfig = {
  environment: env,
  namespace: $namespace("cicdk-test", env),
  tagResource: $tagResource({ Environment: env, IACPlatform: "cdk" }),
  lambdas: lambdas,
};

new TestCicdCdkStack(app, ["TestCicdCdkStack", env].join("-"), config, {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
