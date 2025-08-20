# 🚀 Environment-Specific Deployment Guide

This guide explains how to set up and use the automated deployment system for your Cardata Lookup API.

## 📋 **Overview**

The deployment system automatically deploys to different AWS Lambda environments based on Git branches:

- **`staging`** → **Staging Environment** (`cardata-lookup-staging`)  
- **`main`** → **Production Environment** (`cardata-lookup-prod`)

## 🏗️ **Prerequisites**

### 1. **AWS Lambda Functions**
Create two Lambda functions in AWS:
```bash
# Staging
aws lambda create-function \
  --function-name cardata-lookup-staging \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler dist/server.handler \
  --zip-file fileb://lambda-deployment.zip

# Production
aws lambda create-function \
  --function-name cardata-lookup-prod \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler dist/server.handler \
  --zip-file fileb://lambda-deployment.zip
```

### 2. **GitHub Repository Setup**
Ensure your repository has these branches:
```bash
git checkout -b staging  
git push -u origin staging

git checkout main
```

## 🔐 **GitHub Secrets Setup**

### 1. **Go to Repository Settings**
- Navigate to your GitHub repository
- Click **Settings** → **Secrets and variables** → **Actions**

### 2. **Add Environment Secrets**

#### **AWS Configuration**
```
AWS_REGION=us-east-1
```

#### **Staging Environment**
```
LAMBDA_FUNCTION_NAME_STAGING=cardata-lookup-staging
AWS_ACCESS_KEY_ID_STAGING=your_staging_access_key
AWS_SECRET_ACCESS_KEY_STAGING=your_staging_secret_key
```

#### **Production Environment**
```
LAMBDA_FUNCTION_NAME_PROD=cardata-lookup-prod
AWS_ACCESS_KEY_ID_PROD=your_prod_access_key
AWS_SECRET_ACCESS_KEY_PROD=your_prod_secret_key
```

### 3. **AWS IAM User Setup**
Create separate IAM users for each environment with minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:GetFunction"
      ],
      "Resource": "arn:aws:lambda:*:*:function:cardata-lookup-*"
    }
  ]
}
```

## 🌍 **Environment Configuration**

### 1. **Environment Variables**
Each Lambda function will have different environment variables:

- **Staging**: `NODE_ENV=staging`  
- **Production**: `NODE_ENV=production`

### 2. **Test Requirements**
- **Staging**: Tests can fail, deployment continues
- **Production**: All tests must pass before deployment

## 🔄 **Deployment Flow**

### **Staging Workflow**
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and commit
git add .
git commit -m "Add new feature"

# 3. Push to staging (triggers staging deployment)
git checkout staging
git merge feature/new-feature
git push origin staging
```

### **Production Workflow**
```bash
# 1. Merge staging to main
git checkout main
git merge staging
git push origin main
# Triggers production deployment + creates release
```

## 📊 **Monitoring & Rollbacks**

### 1. **Deployment Status**
- Check GitHub Actions tab for deployment status
- Each environment has its own deployment job
- Failed deployments are clearly marked

### 2. **Rollback Strategy**
```bash
# Quick rollback to previous version
git revert HEAD
git push origin main  # Triggers new deployment

# Or rollback to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

### 3. **Lambda Versioning**
Enable Lambda versioning for easy rollbacks:
```bash
aws lambda publish-version --function-name cardata-lookup-prod
```

## 🧪 **Testing Before Deployment**

### 1. **Local Testing**
```bash
npm run dev          # Local development
npm run build        # Build check
npm test            # Run tests
```

### 2. **Automatic Testing**
- **Staging**: Tests run but don't block deployment
- **Production**: Tests must pass for deployment to succeed

## 🔧 **Customization Options**

### 1. **Change AWS Region**
Edit GitHub secrets:
```
AWS_REGION=eu-west-1
```

### 2. **Add More Environment Variables**
Edit `config/aws-config.ts` to add custom environment variables for each environment.

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Permission Denied**
   - Check IAM user permissions
   - Verify AWS credentials in GitHub secrets

2. **Lambda Function Not Found**
   - Ensure Lambda functions exist
   - Check function names match secrets

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json

### **Debug Commands**
```bash
# Check Lambda function status
aws lambda get-function --function-name cardata-lookup-staging

# View Lambda logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/cardata-lookup-staging
```

## 📈 **Next Steps**

1. **Set up the two Lambda functions** in AWS
2. **Configure GitHub secrets** for each environment
3. **Create the staging branch**
4. **Test the deployment** by pushing to staging branch
5. **Monitor deployments** in GitHub Actions

## 🎯 **Benefits of This Setup**

- ✅ **Automated deployments** on every push
- ✅ **Environment isolation** (staging/prod)
- ✅ **Rollback capability** with Git
- ✅ **Different test requirements** per environment
- ✅ **Release management** for production
- ✅ **Audit trail** of all deployments
- ✅ **Cost optimization** with separate environments
- ✅ **Simple workflow** - just push to branch

This setup gives you a professional, enterprise-grade deployment pipeline that's simple to maintain and use!
