terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.identifier}-subnet-group"
  description = "Subnet group for ${var.identifier} Redis cluster"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.identifier}-subnet-group"
    Environment = var.environment
    Project     = var.project
  }
}

# Security Group
resource "aws_security_group" "main" {
  name        = "${var.identifier}-sg"
  description = "Security group for ${var.identifier} Redis cluster"
  vpc_id      = var.vpc_id

  # Allow Redis traffic from within VPC
  ingress {
    from_port   = var.port
    to_port     = var.port
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_block]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.identifier}-sg"
    Environment = var.environment
    Project     = var.project
  }
}

# Parameter Group
resource "aws_elasticache_parameter_group" "main" {
  family = "redis7.x"
  name   = "${var.identifier}-parameter-group"

  parameters {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameters {
    name  = "notify-keyspace-events"
    value = "Ex"
  }

  tags = {
    Name        = "${var.identifier}-parameter-group"
    Environment = var.environment
    Project     = var.project
  }
}

# Redis Cluster
resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = var.identifier
  description                = "Redis cluster for ${var.identifier}"

  engine                    = var.engine
  engine_version            = var.engine_version
  node_type                 = var.node_type
  port                      = var.port
  parameter_group_name      = aws_elasticache_parameter_group.main.name

  num_cache_clusters         = var.num_cache_nodes
  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled          = var.multi_az_enabled

  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled
  auth_token                 = var.auth_token != "" ? var.auth_token : null

  subnet_group_name = var.subnet_group_name != "" ? var.subnet_group_name : aws_elasticache_subnet_group.main.name
  security_group_ids = concat([aws_security_group.main.id], var.security_group_ids)

  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window         = var.snapshot_window
  maintenance_window      = var.maintenance_window

  apply_immediately          = var.apply_immediately
  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  notification_topic_arn = var.notification_topic_arn

  log_delivery_configuration = var.log_delivery_configuration

  tags = {
    Name        = var.identifier
    Environment = var.environment
    Project     = var.project
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  alarm_name          = "${var.identifier}-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.main.replication_group_id
  }

  alarm_actions = []
  ok_actions    = []

  tags = {
    Name        = "${var.identifier}-cpu-utilization"
    Environment = var.environment
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "memory_utilization" {
  alarm_name          = "${var.identifier}-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "BytesUsedForCache"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "12000000000" # 12GB in bytes

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.main.replication_group_id
  }

  alarm_actions = []
  ok_actions    = []

  tags = {
    Name        = "${var.identifier}-memory-utilization"
    Environment = var.environment
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "evictions" {
  alarm_name          = "${var.identifier}-evictions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.main.replication_group_id
  }

  alarm_actions = []
  ok_actions    = []

  tags = {
    Name        = "${var.identifier}-evictions"
    Environment = var.environment
    Project     = var.project
  }
}

variable "vpc_cidr_block" {
  description = "VPC CIDR block for security group"
  type        = string
  default     = "10.0.0.0/16"
}
