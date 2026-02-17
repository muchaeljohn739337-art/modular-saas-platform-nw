# AWS Organizations Setup for Advancia PayLedger
# HIPAA-Ready Multi-Account Architecture

## Account Structure

### 1. Root Account (advancia-root)
- Purpose: Organization management only
- No workloads deployed
- Manages OU structure and SCPs
- Controls billing and IAM

### 2. Core Services Account (advancia-core)
- Purpose: Non-PHI services
- Services: Auth, Tenant, Billing (non-PHI), Ledger, Events
- Can be hosted anywhere (Vercel, Fly, etc.)
- No regulated data

### 3. Regulated Account (advancia-regulated)
- Purpose: PHI workloads only
- Services: Health Billing, Patient Link, PHI Docs, Claims Intake
- HIPAA BAA signed
- Strict network isolation

### 4. Security Account (advancia-security)
- Purpose: Centralized logging and monitoring
- Services: CloudTrail, Security Hub, GuardDuty, SIEM
- Immutable audit storage
- Compliance reporting

## Organizational Units (OUs)

```
advancia-root/
├── Core/
│   └── advancia-core
├── Regulated/
│   └── advancia-regulated
└── Security/
    └── advancia-security
```

## Service Control Policies (SCPs)

### Core OU SCP
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "s3:*",
        "rds:*",
        "elasticache:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": ["us-east-1", "us-west-2"]
        }
      }
    }
  ]
}
```

### Regulated OU SCP
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "iam:*User*",
        "iam:*Group*",
        "iam:*Policy*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Deny",
      "Action": [
        "s3:Delete*",
        "rds:Delete*",
        "elasticache:Delete*"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalTag/Role": ["admin", "ops"]
        }
      }
    }
  ]
}
```

## HIPAA Business Associate Addendum (BAA)

### Required Actions:
1. Sign AWS BAA for entire organization
2. Enable AWS Artifact for compliance reports
3. Configure AWS Config for HIPAA rules
4. Enable AWS Security Hub HIPAA benchmark

### Compliance Checklist:
- [ ] BAA signed
- [ ] Encryption at rest enabled
- [ ] Encryption in transit enabled
- [ ] Access logging enabled
- [ ] Audit trails enabled
- [ ] Data retention policies
- [ ] Incident response procedures
- [ ] Business continuity plan

## Account Creation Commands

```bash
# Create Organizations
aws organizations create-organization --feature-set ALL

# Create OUs
aws organizations create-organizational-unit --parent-id <root-id> --name Core
aws organizations create-organizational-unit --parent-id <root-id> --name Regulated  
aws organizations create-organizational-unit --parent-id <root-id> --name Security

# Create Accounts
aws organizations create-account --email "core@advancia.com" --account-name "advancia-core"
aws organizations create-account --email "regulated@advancia.com" --account-name "advancia-regulated"
aws organizations create-account --email "security@advancia.com" --account-name "advancia-security"

# Move accounts to OUs
aws organizations move-account --account-id <core-id> --source-parent-id <root-id> --destination-parent-id <core-ou-id>
aws organizations move-account --account-id <regulated-id> --source-parent-id <root-id> --destination-parent-id <regulated-ou-id>
aws organizations move-account --account-id <security-id> --source-parent-id <root-id> --destination-parent-id <security-ou-id>
```

## Cross-Account IAM Roles

### Core Account Access
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<regulated-account-id>:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "advancia-cross-account"
        }
      }
    }
  ]
}
```

### Regulated Account Access
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<security-account-id>:root"
      },
      "Action": [
        "logs:*",
        "cloudtrail:*",
        "securityhub:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## Next Steps

1. **Execute account creation**
2. **Configure SCPs**
3. **Sign AWS BAA**
4. **Set up cross-account roles**
5. **Configure centralized logging**
6. **Deploy regulated infrastructure
