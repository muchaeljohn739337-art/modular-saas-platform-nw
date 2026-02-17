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

# KMS Key for PHI Data Encryption
resource "aws_kms_key" "phi_data" {
  description             = "KMS key for PHI data encryption"
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
        Sid    = "AllowRDSAccess"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
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
    Name        = "advancia-phi-data-key"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

resource "aws_kms_alias" "phi_data" {
  name          = "alias/advancia-phi-data-key"
  target_key_id = aws_kms_key.phi_data.key_id
}

# Subnet Group for Aurora
resource "aws_db_subnet_group" "aurora" {
  name       = "advancia-aurora-subnet-group"
  description = "Subnet group for Aurora cluster (HIPAA compliant)"

  subnet_ids = var.private_data_subnet_ids

  tags = merge(var.tags, {
    Name        = "advancia-aurora-subnet-group"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

# Security Group for Aurora
resource "aws_security_group" "aurora" {
  name        = "advancia-aurora-sg"
  description = "Security group for Aurora cluster (HIPAA compliant)"
  vpc_id      = var.vpc_id

  # Allow PostgreSQL traffic from private app subnets only
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [var.app_security_group_id]
  }

  # Allow traffic from security account for monitoring
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [var.security_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name        = "advancia-aurora-sg"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

# Parameter Group for HIPAA Compliance
resource "aws_rds_cluster_parameter_group" "aurora" {
  name        = "advancia-aurora-hipaa-parameter-group"
  family      = "aurora-postgresql15"
  description = "Parameter group for HIPAA compliance"

  # HIPAA-required parameters
  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_checkpoints"
    value = "1"
  }

  parameter {
    name  = "log_lock_waits"
    value = "1"
  }

  parameter {
    name  = "log_temp_files"
    value = "0"
  }

  parameter {
    name  = "log_autovacuum_min_duration"
    value = "0"
  }

  # Performance parameters
  parameter {
    name  = "max_connections"
    value = "200"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  # SSL enforcement
  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  tags = merge(var.tags, {
    Name        = "advancia-aurora-hipaa-parameter-group"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

# Aurora Cluster
resource "aws_rds_cluster" "aurora" {
  cluster_identifier = "advancia-aurora-cluster"
  engine            = "aurora-postgresql"
  engine_version    = "15.4"
  database_name     = "advancia_phi"

  master_username = var.db_username
  master_password = var.db_password

  backup_retention_period = 35  # HIPAA requires longer retention
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"

  storage_encrypted = true
  kms_key_id       = aws_kms_key.phi_data.arn

  deletion_protection = true
  apply_immediately   = false

  db_subnet_group_name = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name

  # Enable CloudWatch Logs
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # Serverless v2 configuration for cost optimization
  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 4
  }

  # Backtrack for point-in-time recovery
  backtrack_window = 72  # 72 hours

  tags = merge(var.tags, {
    Name        = "advancia-aurora-cluster"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

# Aurora Instance
resource "aws_rds_cluster_instance" "aurora" {
  count = 2

  identifier = "advancia-aurora-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.aurora.id

  instance_class = var.instance_class
  engine = aws_rds_cluster.aurora.engine
  engine_version = aws_rds_cluster.aurora.engine_version

  publicly_accessible = false

  db_parameter_group_name = aws_db_parameter_group.aurora.name

  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  performance_insights_enabled = true
  performance_insights_retention_period = 7

  tags = merge(var.tags, {
    Name        = "advancia-aurora-instance-${count.index + 1}"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

# Parameter Group for Instances
resource "aws_db_parameter_group" "aurora" {
  family = "aurora-postgresql15"
  name   = "advancia-aurora-instance-parameter-group"

  # HIPAA logging parameters
  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = merge(var.tags, {
    Name        = "advancia-aurora-instance-parameter-group"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "advancia-rds-enhanced-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      },
    ]
  })

  tags = merge(var.tags, {
    Name        = "advancia-rds-enhanced-monitoring-role"
    Environment = var.environment
    Compliance  = "HIPAA"
  })
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
  role       = aws_iam_role.rds_enhanced_monitoring.name
}

# CloudWatch Alarms for HIPAA Compliance
resource "aws_cloudwatch_metric_alarm" "aurora_cpu" {
  alarm_name          = "advancia-aurora-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.id
  }

  alarm_actions = [var.sns_topic_arn]
  ok_actions    = [var.sns_topic_arn]

  tags = merge(var.tags, {
    Name        = "advancia-aurora-cpu-alarm"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

resource "aws_cloudwatch_metric_alarm" "aurora_storage" {
  alarm_name          = "advancia-aurora-storage-space"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "20000000000"  # 20GB

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.id
  }

  alarm_actions = [var.sns_topic_arn]
  ok_actions    = [var.sns_topic_arn]

  tags = merge(var.tags, {
    Name        = "advancia-aurora-storage-alarm"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

resource "aws_cloudwatch_metric_alarm" "aurora_connections" {
  alarm_name          = "advancia-aurora-database-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "150"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.id
  }

  alarm_actions = [var.sns_topic_arn]
  ok_actions    = [var.sns_topic_arn]

  tags = merge(var.tags, {
    Name        = "advancia-aurora-connections-alarm"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

# Data sources
data "aws_caller_identity" "current" {}

# Outputs
output "cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.aurora.endpoint
}

output "cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "cluster_port" {
  description = "Aurora cluster port"
  value       = aws_rds_cluster.aurora.port
}

output "cluster_id" {
  description = "Aurora cluster ID"
  value       = aws_rds_cluster.aurora.id
}

output "cluster_arn" {
  description = "Aurora cluster ARN"
  value       = aws_rds_cluster.aurora.arn
}

output "database_name" {
  description = "Database name"
  value       = aws_rds_cluster.aurora.database_name
}

output "kms_key_id" {
  description = "KMS key ID for PHI data"
  value       = aws_kms_key.phi_data.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for PHI data"
  value       = aws_kms_key.phi_data.arn
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.aurora.id
}
