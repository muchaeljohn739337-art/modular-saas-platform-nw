terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.identifier}-subnet-group"
  description = "Subnet group for ${var.identifier} RDS instance"
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
  description = "Security group for ${var.identifier} RDS instance"
  vpc_id      = var.vpc_id

  # Allow PostgreSQL traffic from within VPC
  ingress {
    from_port   = 5432
    to_port     = 5432
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
resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "${var.identifier}-parameter-group"

  parameters {
    name  = "log_statement"
    value = "all"
  }

  parameters {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameters {
    name  = "max_connections"
    value = "200"
  }

  parameters {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = {
    Name        = "${var.identifier}-parameter-group"
    Environment = var.environment
    Project     = var.project
  }
}

# Option Group
resource "aws_db_option_group" "main" {
  name                 = "${var.identifier}-option-group"
  option_group_description = "Option group for ${var.identifier} RDS instance"
  engine_name          = var.engine
  major_engine_version = "15"

  tags = {
    Name        = "${var.identifier}-option-group"
    Environment = var.environment
    Project     = var.project
  }
}

# Main RDS Instance
resource "aws_db_instance" "main" {
  identifier = var.identifier

  engine         = var.engine
  engine_version = var.engine_version
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = var.storage_encrypted

  db_name  = var.database_name
  username = var.username
  password = var.password

  port = 5432

  vpc_security_group_ids = concat([aws_security_group.main.id], var.security_group_ids)
  db_subnet_group_name   = aws_db_subnet_group.main.name

  parameter_group_name = aws_db_parameter_group.main.name
  option_group_name    = aws_db_option_group.main.name

  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window

  skip_final_snapshot     = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.identifier}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  deletion_protection = var.deletion_protection
  multi_az           = var.multi_az

  copy_tags_to_snapshot = true
  delete_automated_backups = false

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name        = var.identifier
    Environment = var.environment
    Project     = var.project
  }
}

# Read Replicas
resource "aws_db_instance" "read_replica" {
  count = var.read_replicas

  identifier = "${var.identifier}-read-replica-${count.index + 1}"

  replicate_source_db = aws_db_instance.main.identifier

  instance_class = var.instance_class

  publicly_accessible = false

  vpc_security_group_ids = concat([aws_security_group.main.id], var.security_group_ids)
  db_subnet_group_name   = aws_db_subnet_group.main.name

  skip_final_snapshot = true

  tags = {
    Name        = "${var.identifier}-read-replica-${count.index + 1}"
    Environment = var.environment
    Project     = var.project
    Type        = "ReadReplica"
  }
}

# Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.identifier}-rds-enhanced-monitoring"

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

  tags = {
    Name        = "${var.identifier}-rds-enhanced-monitoring"
    Environment = var.environment
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
  role       = aws_iam_role.rds_enhanced_monitoring.name
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  alarm_name          = "${var.identifier}-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  alarm_actions = []
  ok_actions    = []

  tags = {
    Name        = "${var.identifier}-cpu-utilization"
    Environment = var.environment
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "free_storage_space" {
  alarm_name          = "${var.identifier}-free-storage-space"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "20000000000" # 20GB in bytes

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  alarm_actions = []
  ok_actions    = []

  tags = {
    Name        = "${var.identifier}-free-storage-space"
    Environment = var.environment
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.identifier}-database-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "150"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  alarm_actions = []
  ok_actions    = []

  tags = {
    Name        = "${var.identifier}-database-connections"
    Environment = var.environment
    Project     = var.project
  }
}

variable "vpc_cidr_block" {
  description = "VPC CIDR block for security group"
  type        = string
  default     = "10.0.0.0/16"
}
