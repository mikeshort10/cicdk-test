## cdk-deploy-prod.yaml

This workflow builds Docker images, pushes them to ECR, updates the cdk.json with the latest image tags, and deploy the CDK stack to AWS.

It attempts to replace AWS CodePipeline, which we have found to be much slower, harder to reuse, and difficult/impossible to cache image builds with.

Workflow beginning with at least one underscore are Reusable Workflows. Those beginning with a double underscore are more generic and can live at an organizational level. Those beginning with a single underscore configure the others for easier reuse. Finally, workflows without an underscore are actual runs, configured for a given environment.

### Additional Configuration

#### ECR Repos

ECR repositories need to be created before pushing new lambdas to the workflow, as they cannot be created simply from a push to the namespace.

#### Secrets

This Workflow assumes that you have an OIDC Identity Provider configured in AWS for GitHub. For details on how to set on e up, see [Creating OpenID Connect (OIDC) identity providers](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html) and [Configuring OpenID Connect in Amazon Web Services](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services).

Depending on how your existing OIDC identity provider is configured, you may need to explicitly allow each repo that uses this workflow.

Note: The AWS Roles do not need to be stored as secrets and can be hardcoded into your workflows. Disclosing them would not compromise the security of your account. However, I've done this for cleanliness of the example workflow.

- AWS_ECR_ROLE
  Needs the following policy:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "VisualEditor0",
        "Effect": "Allow",
        "Action": [
          "ecr:StartImageScan",
          "ecr:DescribeImageReplicationStatus",
          "ecr:ListTagsForResource",
          "ecr:UploadLayerPart",
          "ecr:CreatePullThroughCacheRule",
          "ecr:ListImages",
          "ecr:BatchGetRepositoryScanningConfiguration",
          "ecr:GetRegistryScanningConfiguration",
          "ecr:CompleteLayerUpload",
          "ecr:TagResource",
          "ecr:DescribeRepositories",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetLifecyclePolicy",
          "ecr:GetRegistryPolicy",
          "ecr:DescribeImageScanFindings",
          "ecr:GetLifecyclePolicyPreview",
          "ecr:DescribeRegistry",
          "ecr:PutImageScanningConfiguration",
          "ecr:GetDownloadUrlForLayer",
          "ecr:DescribePullThroughCacheRules",
          "ecr:GetAuthorizationToken",
          "ecr:PutImage",
          "ecr:BatchImportUpstreamImage",
          "ecr:UntagResource",
          "ecr:BatchGetImage",
          "ecr:DescribeImages",
          "ecr:StartLifecyclePolicyPreview",
          "ecr:InitiateLayerUpload",
          "ecr:GetRepositoryPolicy"
        ],
        "Resource": "*"
      }
    ]
  }
  ```
- GH_WRITE_TOKEN
  A Personal Access Token (PAT) for GitHub with the `repo` scope. This will be used to commit image tags to the repo.

- AWS_CDK_DEPLOY_ROLE

  Needs the following policy:

  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": "*",
        "Resource": "*"
      }
    ]
  }
  ```

  Note: these permissions are overly broad and should only be used as a starting point. If anyone gained access to your github repo, they could essentially deploying anything to your AWS cloud.

  Your organization should enforce restrictions on any role to perform certain actions, like creating new users, as well as other steps the do not need to perform. You may want to further limit this policy depending on the kind of application that your CDK stack is deploying.