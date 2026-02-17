terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# KMS Key for PHI Documents
resource "aws_kms_key" "phi_docs" {
  description             = "KMS key for PHI documents encryption"
  enable_key_rotation   = true
  deletion_window_in_days = 30

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableRootAccount"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowS3Access"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "advancia-phi-docs-key"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

resource "aws_kms_alias" "phi_docs" {
  name          = "alias/advancia-phi-docs-key"
  target_key_id = aws_kms_key.phi_docs.key_id
}

# S3 Bucket for PHI Documents
resource "aws_s3_bucket" "phi_docs" {
  bucket = "advancia-phi-docs-${var.environment}"

  tags = merge(var.tags, {
    Name        = "advancia-phi-docs"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

# S3 Bucket Versioning (HIPAA requirement)
resource "aws_s3_bucket_versioning" "phi_docs" {
  bucket = aws_s3_bucket.phi_docs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "phi_docs" {
  bucket = aws_s3_bucket.phi_docs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
      kms_master_key_id = aws_kms_key.phi_docs.arn
    }
  }
}

# S3 Bucket Public Access Block (HIPAA requirement)
resource "aws_s3_bucket_public_access_block" "phi_docs" {
  bucket = aws_s3_bucket.phi_docs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Logging (HIPAA requirement)
resource "aws_s3_bucket_logging" "phi_docs" {
  bucket = aws_s3_bucket.phi_docs.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "phi-docs/"
}

# S3 Bucket Lifecycle Configuration (HIPAA retention)
resource "aws_s3_bucket_lifecycle_configuration" "phi_docs" {
  bucket = aws_s3_bucket.phi_docs.id

  rule {
    id     = "phi_retention_policy"
    status = "Enabled"

    # Keep current versions for 7 years (HIPAA requirement)
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    # Delete old versions after 7 years
    noncurrent_version_expiration {
      noncurrent_days = 2555  # 7 years
    }

    # Abort incomplete multipart uploads after 7 days
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# S3 Bucket Policy (VPC-only access)
resource "aws_s3_bucket_policy" "phi_docs" {
  bucket = aws_s3_bucket.phi_docs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowVPCEndpointAccess"
        Effect = "Allow"
        Principal = "*"
        Action   = "s3:*"
        Resource = [
          aws_s3_bucket.phi_docs.arn,
          "${aws_s3_bucket.phi_docs.arn}/*"
        ]
        Condition = {
          StringEquals = {
            "aws:sourceVpce": var.vpc_endpoint_id
          }
        }
      },
      {
        Sid    = "DenyNonHTTPSAccess"
        Effect = "Deny"
        Principal = "*"
        Action   = "s3:*"
        Resource = [
          aws_s3_bucket.phi_docs.arn,
          "${aws_s3_bucket.phi_docs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport": "false"
          }
        }
      },
      {
        Sid    = "AllowSecurityAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = var.security_account_arn
        }
        Action   = [
          "s3:GetObject",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.phi_docs.arn,
          "${aws_s3_bucket.phi_docs.arn}/*"
        ]
      }
    ]
  })
}

# S3 Bucket for Core Artifacts (non-PHI)
resource "aws_s3_bucket" "core_artifacts" {
  bucket = "advancia-core-artifacts-${var.environment}"

  tags = merge(var.tags, {
    Name        = "advancia-core-artifacts"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "Non-PHI"
  })
}

# S3 Bucket Versioning for Core Artifacts
resource "aws_s3_bucket_versioning" "core_artifacts" {
  bucket = aws_s3_bucket.core_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-Side Encryption for Core Artifacts
resource "aws_s3_bucket_server_side_encryption_configuration" "core_artifacts" {
  bucket = aws_s3_bucket.core_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block for Core Artifacts
resource "aws_s3_bucket_public_access_block" "core_artifacts" {
  bucket = aws_s3_bucket.core_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for Access Logs
resource "aws_s3_bucket" "access_logs" {
  bucket = "advancia-access-logs-${var.environment}"

  tags = merge(var.tags, {
    Name        = "advancia-access-logs"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "Audit"
  })
}

# S3 Bucket Versioning for Access Logs
resource "aws_s3_bucket_versioning" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-Side Encryption for Access Logs
resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block for Access Logs
resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle for Access Logs
resource "aws_s3_bucket_lifecycle_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    id     = "log_retention_policy"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    # Delete logs after 7 years (HIPAA requirement)
    expiration {
      days = 2555
    }
  }
}

# S3 Bucket Notification for PHI Documents
resource "aws_s3_bucket_notification" "phi_docs" {
  bucket = aws_s3_bucket.phi_docs.id

  lambda_function {
    lambda_function_arn = var.phi_processor_lambda_arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "documents/"
  }

  depends_on = [aws_lambda_permission.s3_invoke]
}

# Lambda Permission for S3 to invoke Lambda
resource "aws_lambda_permission" "s3_invoke" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = var.phi_processor_lambda_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.phi_docs.arn
}

# CloudWatch Alarms for S3 Buckets
resource "aws_cloudwatch_metric_alarm" "phi_docs_4xx_errors" {
  alarm_name          = "advancia-phi-docs-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"

  dimensions = {
    BucketName = aws_s3_bucket.phi_docs.id
  }

  alarm_actions = [var.sns_topic_arn]
  ok_actions    = [var.sns_topic_arn]

  tags = merge(var.tags, {
    Name        = "advancia-phi-docs-4xx-alarm"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

resource "aws_cloudwatch_metric_alarm" "phi_docs_5xx_errors" {
  alarm_name          = "advancia-phi-docs-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxErrors"
  namespace           = "AWS/S3"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"

  dimensions = {
    BucketName = aws_s3_bucket.phi_docs.id
  }

  alarm_actions = [var.sns_topic_arn]
  ok_actions    = [var.sns_topic_arn]

  tags = merge(var.tags, {
    Name        = "advancia-phi-docs-5xx-alarm"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

# Data sources
data "aws_caller_identity" "current" {}

# Outputs
output "phi_docs_bucket_name" {
  description = "PHI documents S3 bucket name"
  value       = aws_s3_bucket.phi_docs.id
}

output "phi_docs_bucket_arn" {
  description = "PHI documents S3 bucket ARN"
  value       = aws_s3_bucket.phi_docs.arn
}

output "core_artifacts_bucket_name" {
  description = "Core artifacts S3 bucket name"
  value       = aws_s3_bucket.core_artifacts.id
}

output "core_artifacts_bucket_arn" {
  description = "Core artifacts S3 bucket ARN"
  value       = aws_s3_bucket.core_artifacts.arn
}

output "access_logs_bucket_name" {
  description = "Access logs S3 bucket name"
  value       = aws_s3_bucket.access_logs.id
}

output "access_logs_bucket_arn" {
  description = "Access logs S3 bucket ARN"
  value       = aws_s3_bucket.access_logs.arn
}

output "phi_docs_kms_key_id" {
  description = "KMS key ID for PHI documents"
  value       = aws_kms_key.phi_docs.key_id
}

output "phi_docs_kms_key_arn" {
  description = "KMS key ARN for PHI documents"
  value       = aws_kms_key.phi_docs.arn
}
