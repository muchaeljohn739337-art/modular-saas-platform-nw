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

# KMS Key for Redis Encryption
resource "aws_kms_key" "redis" {
  description             = "KMS key for Redis encryption"
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
        Sid    = "AllowElastiCacheAccess"
        Effect = "Allow"
        Principal = {
          Service = "elasticache.amazonaws.com"
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
    Name        = "advancia-redis-key"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

resource "aws_kms_alias" "redis" {
  name          = "alias/advancia-redis-key"
  target_key_id = aws_kms_key.redis.key_id
}

# Subnet Group for Redis
resource "aws_elasticache_subnet_group" "redis" {
  name       = "advancia-redis-subnet-group"
  description = "Subnet group for Redis cluster (HIPAA compliant)"

  subnet_ids = var.private_data_subnet_ids

  tags = merge(var.tags, {
    Name        = "advancia-redis-subnet-group"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

# Security Group for Redis
resource "aws_security_group" "redis" {
  name        = "advancia-redis-sg"
  description = "Security group for Redis cluster (HIPAA compliant)"
  vpc_id      = var.vpc_id

  # Allow Redis traffic from private app subnets only
  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    security_groups = [var.app_security_group_id]
  }

  # Allow traffic from security account for monitoring
  ingress {
    from_port   = 6379
    to_port     = 6379
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
    Name        = "advancia-redis-sg"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

# Parameter Group for HIPAA Compliance
resource "aws_elasticache_parameter_group" "redis" {
  family = "redis7.x"
  name   = "advancia-redis-hipaa-parameter-group"

  # Security parameters
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }

  # Logging parameters
  parameter {
    name  = "slowlog-log-slower-than"
    value = "10000"
  }

  parameter {
    name  = "slowlog-max-len"
    value = "128"
  }

  # Performance parameters
  parameter {
    name  = "timeout"
    value = "300"
  }

  parameter {
    name  = "tcp-keepalive"
    value = "300"
  }

  parameter {
    name  = "maxclients"
    value = "10000"
  }

  tags = merge(var.tags, {
    Name        = "advancia-redis-hipaa-parameter-group"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

# Redis Cluster
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "advancia-redis-cluster"
  description                = "Redis cluster for Advancia PayLedger (HIPAA compliant)"

  engine                    = "redis"
  engine_version            = "7.0"
  node_type                 = var.node_type
  port                      = 6379
  parameter_group_name      = aws_elasticache_parameter_group.redis.name

  num_cache_clusters         = var.num_cache_nodes
  automatic_failover_enabled = true
  multi_az_enabled          = true

  # HIPAA-required encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.auth_token
  kms_key_id                = aws_kms_key.redis.arn

  subnet_group_name = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]

  # Backup and retention
  snapshot_retention_limit = 35  # HIPAA requires longer retention
  snapshot_window         = "03:00-05:00"
  maintenance_window      = "sun:05:00-sun:06:00"

  apply_immediately          = false
  auto_minor_version_upgrade = true

  # Log delivery to CloudWatch
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "text"
    log_type         = ["slow-log"]
  }

  tags = merge(var.tags, {
    Name        = "advancia-redis-cluster"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

# CloudWatch Log Group for Redis
resource "aws_cloudwatch_log_group" "redis" {
  name              = "/aws/elasticache/redis/advancia-redis"
  retention_in_days = 365  # HIPAA requires 1-year retention

  tags = merge(var.tags, {
    Name        = "advancia-redis-log-group"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

# CloudWatch Alarms for HIPAA Compliance
resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "advancia-redis-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.replication_group_id
  }

  alarm_actions = [var.sns_topic_arn]
  ok_actions    = [var.sns_topic_arn]

  tags = merge(var.tags, {
    Name        = "advancia-redis-cpu-alarm"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  alarm_name          = "advancia-redis-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "BytesUsedForCache"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "12000000000"  # 12GB

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.replication_group_id
  }

  alarm_actions = [var.sns_topic_arn]
  ok_actions    = [var.sns_topic_arn]

  tags = merge(var.tags, {
    Name        = "advancia-redis-memory-alarm"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

resource "aws_cloudwatch_metric_alarm" "redis_evictions" {
  alarm_name          = "advancia-redis-evictions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.replication_group_id
  }

  alarm_actions = [var.sns_topic_arn]
  ok_actions    = [var.sns_topic_arn]

  tags = merge(var.tags, {
    Name        = "advancia-redis-evictions-alarm"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

resource "aws_cloudwatch_metric_alarm" "redis_connections" {
  alarm_name          = "advancia-redis-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CurrConnections"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "5000"

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.replication_group_id
  }

  alarm_actions = [var.sns_topic_arn]
  ok_actions    = [var.sns_topic_arn]

  tags = merge(var.tags, {
    Name        = "advancia-redis-connections-alarm"
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  })
}

# Data sources
data "aws_caller_identity" "current" {}

# Outputs
output "cluster_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "cluster_port" {
  description = "Redis cluster port"
  value       = aws_elasticache_replication_group.redis.port
}

output "cluster_id" {
  description = "Redis cluster ID"
  value       = aws_elasticache_replication_group.redis.id
}

output "cluster_arn" {
  description = "Redis cluster ARN"
  value       = aws_elasticache_replication_group.redis.arn
}

output "kms_key_id" {
  description = "KMS key ID for Redis"
  value       = aws_kms_key.redis.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for Redis"
  value       = aws_kms_key.redis.arn
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.redis.id
}

output "subnet_group_id" {
  description = "Subnet group ID"
  value       = aws_elasticache_subnet_group.redis.id
}
