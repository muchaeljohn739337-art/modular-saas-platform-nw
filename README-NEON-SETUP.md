# Neon Database Branch Management Setup

This document explains how to set up the Neon branch management workflow for your Advancia PayLedger project.

## 🚀 Overview

The GitHub Actions workflow automatically creates and deletes Neon database branches for pull requests, providing isolated testing environments for each PR.

## 📋 Prerequisites

### 1. GitHub Repository Secrets
Add the following secrets to your GitHub repository:

```
NEON_API_KEY
```
- Get this from your Neon Console → Account → API Keys
- Required for creating/deleting branches

### 2. GitHub Repository Variables
Add the following variables to your GitHub repository:

```
NEON_PROJECT_ID
```
- Get this from your Neon Console → Project → Settings
- Current project ID: `wispy-mouse-47806320`

## 🔧 Setup Instructions

### Step 1: Add GitHub Secrets
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add `NEON_API_KEY` with your Neon API key

### Step 2: Add GitHub Variables
1. In the same **Actions** settings page
2. Click **New repository variable**
3. Add `NEON_PROJECT_ID` with value `wispy-mouse-47806320`

### Step 3: Enable Workflow Permissions
Add these permissions to the workflow job if you want schema diff comments:

```yaml
permissions:
  contents: read
  pull-requests: write
```

## 🔄 How It Works

### When a Pull Request is:
- **Opened/Reopened/Synchronized**: Creates a new Neon branch named `preview/pr-{number}-{branch-name}`
- **Closed**: Automatically deletes the preview branch

### Branch Naming Convention
```
preview/pr-{PR_NUMBER}-{BRANCH_NAME}
```
Example: `preview/pr-123-feature-user-auth`

### Branch Expiration
- Preview branches automatically expire after **14 days**
- Prevents accumulation of unused branches

## 🗄️ Database Connection

The workflow outputs the database connection strings:

```yaml
# Pooled connection (recommended for applications)
DATABASE_URL: "${{ steps.create_neon_branch.outputs.db_url_with_pooler }}"

# Unpooled connection (recommended for migrations)
DATABASE_URL: "${{ steps.create_neon_branch.outputs.db_url }}"
```

## 🧪 Usage Examples

### Running Tests on PR Branch
```yaml
- name: Run Tests
  run: npm test
  env:
    DATABASE_URL: "${{ steps.create_neon_branch.outputs.db_url_with_pooler }}"
```

### Running Migrations
```yaml
- name: Run Migrations
  run: npm run db:migrate
  env:
    DATABASE_URL: "${{ steps.create_neon_branch.outputs.db_url }}"
```

### Schema Diff Comments
Uncomment the schema diff action in the workflow to automatically post schema changes as PR comments:

```yaml
- name: Post Schema Diff Comment to PR
  uses: neondatabase/schema-diff-action@v1
  with:
    project_id: ${{ vars.NEON_PROJECT_ID }}
    compare_branch: preview/pr-${{ github.event.number }}-${{ needs.setup.outputs.branch }}
    api_key: ${{ secrets.NEON_API_KEY }}
```

## 📊 Current Neon Configuration

- **Project ID**: `wispy-mouse-47806320`
- **Project Name**: `advancia-payledger`
- **Organization**: `advancia-payledger`
- **Region**: `aws-us-east-1`
- **Main Branch**: `br-polished-haze-ah7xjp6a` (archived)

## 🛠️ Local Development

### Using Neon CLI
```bash
# Install Neon CLI
npm install -g neonctl

# List projects
npx neonctl projects list

# List branches
npx neonctl branches list --project wispy-mouse-47806320

# Get connection string
npx neonctl connection-string --project wispy-mouse-47806320 --branch production
```

### Environment Variables
Update your `.env` file:
```env
DATABASE_URL="postgresql://neondb_owner:npg_nECsrJB8L2IA@ep-withered-sun-ahto03l2.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

## 🔍 Troubleshooting

### Common Issues

1. **API Key Not Found**
   - Ensure `NEON_API_KEY` is added as a repository secret
   - Check the API key has sufficient permissions

2. **Project ID Invalid**
   - Verify `NEON_PROJECT_ID` matches your Neon project
   - Current ID: `wispy-mouse-47806320`

3. **Branch Creation Failed**
   - Check if branch name conflicts with existing branches
   - Ensure project has sufficient branch quota

4. **Permission Denied**
   - Add workflow permissions for pull request comments
   - Check GitHub Actions permissions

### Debug Commands
```bash
# Check current Neon context
npx neonctl me

# Verify project access
npx neonctl projects get wispy-mouse-47806320

# List all branches
npx neonctl branches list --project wispy-mouse-47806320
```

## 📚 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [GitHub Actions for Neon](https://neon.tech/docs/guides/github-actions)
- [Neon CLI Reference](https://neon.tech/docs/reference/neon-cli)

## 🎯 Best Practices

1. **Branch Naming**: Use descriptive branch names for easier identification
2. **Expiration**: Keep 14-day expiration for automatic cleanup
3. **Testing**: Always run tests on preview branches before merging
4. **Migrations**: Use unpooled connections for schema changes
5. **Monitoring**: Monitor branch usage and cleanup old branches manually if needed

## 🔄 CI/CD Integration

This workflow integrates seamlessly with your existing Docker setup:

- **Development**: Uses Neon for all environments
- **Testing**: Each PR gets isolated database branch
- **Production**: Uses main Neon branch for production data
- **Cleanup**: Automatic branch deletion on PR close

The workflow complements your Docker Compose setup by providing cloud-native database branching without local PostgreSQL dependencies.
