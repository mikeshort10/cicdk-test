# Example Deployment Strategy to Replace AWS CodePipeline

## Motivation

CodePipeline has several disadvantages:

- Slow startup: It needs to build itself on every run, even twice when there are updates to the pipeline itself, since it is built via a programming language, like TypeScript
- Lack of image caching: Nested images that are built by the pipeline, such as those for Lambdas or EC2 instances, are not/cannot be cached and so must be rebuilt on every run
- Lack of portability: the only way to reuse a Pipeline across multiple repositories is to use a package manager, like NPM

GitHub Actions resolves many of these issues:

- Start up is almost immediate, with an often negligible amount of time to provision resources
- Images can be built and cached to ECR as a part of a workflow
- With an Enterprise account, GitHub Actions can be reused across an organization without the need for packaging

## Basic Infrastructure

The CDK itself simply deploys a stack with a number of Lambdas built from ECR images. The stack can be deployed to one of three environments: prod, alpha, or devel. The configuration for each of these different environments can be found in the [cdk.json](./cdk.json), which is consumed at the top level of the stack based on the value of \$CDK_ENV in `npm run cdk deploy -- --context env=$CDK_ENV`, and passed down to the rest of the stack.

For our example, we will use `main` as defined in [./.github/workflows/cdk-deploy-prod.yaml](./.github/workflows/cdk-deploy-prod.yaml)

```mermaid
graph TB;
  A[Developer]-->|git push|B[Branch];
  B-->C[$ENV Workflow];
  C-->L[Read SHAs from cdk.json];

  L-->D{Update ECR images? \ngit diff $SHA main};
  D-->|No|J[Deploy CDK to $ENV];
  D-->|Yes|E[Build Relevant Images];
  E-->F[Tag Images with latest, $ENV, and $GITHUB_SHA];
  F-->G[Deploy Images];
  G-->H[Add updated SHAs to cdk.json];
  H-->|git push|B;
  J-->|cdk deploy --context env=$ENV|N[Get env];
  N-->O{Is env valid?};
  O-->|No|P[Cancel deploy];
  O-->|Yes|Q[Get config from cdk.json at .context.prod];
  Q-->R{Is config valid?};
  R-->|No|P;
  R-->|Yes|S[Pass values to cdk and deploy];
```
