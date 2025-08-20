# 🔐 GitHub Secrets Configuration

## Required Secrets

Add these secrets in your GitHub repository: **Settings → Secrets and variables → Actions**

### AWS Configuration
```
AWS_REGION=<aws_region>
S3_BUCKET_NAME=<s3_bucket_name>
```

### Staging Environment
```
LAMBDA_FUNCTION_NAME_STAGING=<lambda_function_name_staging>
AWS_ACCESS_KEY_ID_STAGING=<staging_access_key>
AWS_SECRET_ACCESS_KEY_STAGING=<staging_secret_key>
```

### Production Environment
```
LAMBDA_FUNCTION_NAME_PROD=<lambda_function_name_prod>
AWS_ACCESS_KEY_ID_PROD=<prod_access_key>
AWS_SECRET_ACCESS_KEY_PROD=<prod_secret_key>
```

## How It Works

- **Push to `staging` branch** → Deploy to staging Lambda (tests can fail)
- **Push to `main` branch** → Deploy to production Lambda (tests must pass)
- **PR merges** automatically trigger deployments when merged to staging/main

## Deployment Method

All deployments use **S3** for Lambda package uploads:
1. **Build** the Lambda package
2. **Upload** to S3 bucket
3. **Deploy** Lambda from S3
4. **Update** Lambda configuration

## Simple Deployment Flow

```bash
# 1. Work on feature branch
git checkout -b feature/new-feature
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# 2. Create PR to staging
# 3. Merge to staging → Auto-deploy to staging
# 4. Create PR from staging to main
# 5. Merge to main → Auto-deploy to production
```

## S3 Bucket Setup

Create an S3 bucket for Lambda deployments:
```bash
aws s3 mb s3://your-lambda-deployments-bucket
aws s3api put-bucket-versioning --bucket your-lambda-deployments-bucket --versioning-configuration Status=Enabled
```

## S3 IAM Permissions

Ensure your IAM user has these S3 permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::your-lambda-deployments-bucket/*"
    }
  ]
}
```

That's it! Much simpler than before.
