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
  lambdas: {
    repoName: string;
    tag: string;
  }[];
};

export class TestCicdCdkStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    config: StackConfig,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    config.lambdas.forEach((lambdaConfig) => {
      const lambdaRepo = cdk.aws_ecr.Repository.fromRepositoryName(
        this,
        lambdaConfig.repoName,
        lambdaConfig.repoName
      );

      const lambdaFunction = new lambda.DockerImageFunction(
        this,
        config.namespace("lambda"),
        {
          code: lambda.DockerImageCode.fromEcr(lambdaRepo, {
            tagOrDigest: lambdaConfig.tag,
          }),
        }
      );

      config.tagResource(lambdaFunction, { PersistentDataClass: "ephemeral" });
    });
  }
}
