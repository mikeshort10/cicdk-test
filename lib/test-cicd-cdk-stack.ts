import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";

export type TagResource = (
  resource: Construct,
  resourceTags: { PersistentDataClass: "ephemeral" | "protected" }
) => void;

export type StackConfig = {
  environment: string;
  namespace: (baseName: string) => string;
  tagResource: TagResource;
  lambdaRepoName: string;
};

export class TestCicdCdkStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    config: StackConfig,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    const lambdaRepo = cdk.aws_ecr.Repository.fromRepositoryName(
      this,
      config.lambdaRepoName,
      config.lambdaRepoName
    );

    const lambdaFunction = new lambda.DockerImageFunction(
      this,
      config.namespace("lambda"),
      {
        code: lambda.DockerImageCode.fromEcr(lambdaRepo, {
          tagOrDigest:
            config.environment === "prod" ? "latest" : config.environment,
        }),
      }
    );

    config.tagResource(lambdaFunction, { PersistentDataClass: "ephemeral" });
  }
}
