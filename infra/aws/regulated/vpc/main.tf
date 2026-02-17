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

# VPC Configuration
resource "aws_vpc" "regulated" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name        = "advancia-regulated-vpc"
    Environment = var.environment
    Compliance  = "HIPAA"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "regulated" {
  vpc_id = aws_vpc.regulated.id

  tags = merge(var.tags, {
    Name        = "advancia-regulated-igw"
    Environment = var.environment
    Compliance  = "HIPAA"
  })
}

# Public Subnets (ALB, NAT Gateways only)
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.regulated.id
  cidr_block              = "10.20.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name        = "advancia-regulated-public-${count.index + 1}"
    Environment = var.environment
    Compliance  = "HIPAA"
    Type        = "Public"
  })
}

# Private App Subnets (ECS/EKS tasks)
resource "aws_subnet" "private_app" {
  count = 2

  vpc_id            = aws_vpc.regulated.id
  cidr_block        = "10.20.${count.index + 11}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.tags, {
    Name        = "advancia-regulated-private-app-${count.index + 1}"
    Environment = var.environment
    Compliance  = "HIPAA"
    Type        = "PrivateApp"
  })
}

# Private Data Subnets (Aurora, ElastiCache)
resource "aws_subnet" "private_data" {
  count = 2

  vpc_id            = aws_vpc.regulated.id
  cidr_block        = "10.20.${count.index + 21}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.tags, {
    Name        = "advancia-regulated-private-data-${count.index + 1}"
    Environment = var.environment
    Compliance  = "HIPAA"
    Type        = "PrivateData"
  })
}

# NAT Gateways
resource "aws_eip" "nat" {
  count = 2
  domain = "vpc"

  tags = merge(var.tags, {
    Name        = "advancia-regulated-nat-eip-${count.index + 1}"
    Environment = var.environment
    Compliance  = "HIPAA"
  })

  depends_on = [aws_internet_gateway.regulated]
}

resource "aws_nat_gateway" "regulated" {
  count = 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name        = "advancia-regulated-nat-${count.index + 1}"
    Environment = var.environment
    Compliance  = "HIPAA"
  })

  depends_on = [aws_internet_gateway.regulated]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.regulated.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.regulated.id
  }

  tags = merge(var.tags, {
    Name        = "advancia-regulated-public-rt"
    Environment = var.environment
    Compliance  = "HIPAA"
  })
}

resource "aws_route_table" "private_app" {
  count = 2

  vpc_id = aws_vpc.regulated.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.regulated[count.index].id
  }

  tags = merge(var.tags, {
    Name        = "advancia-regulated-private-app-rt-${count.index + 1}"
    Environment = var.environment
    Compliance  = "HIPAA"
  })
}

resource "aws_route_table" "private_data" {
  count = 2

  vpc_id = aws_vpc.regulated.id

  # No internet access for data subnets
  tags = merge(var.tags, {
    Name        = "advancia-regulated-private-data-rt-${count.index + 1}"
    Environment = var.environment
    Compliance  = "HIPAA"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_app" {
  count = 2

  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private_app[count.index].id
}

resource "aws_route_table_association" "private_data" {
  count = 2

  subnet_id      = aws_subnet.private_data[count.index].id
  route_table_id = aws_route_table.private_data[count.index].id
}

# VPC Endpoints for S3 (VPC-only access)
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.regulated.id
  service_name = "com.amazonaws.${var.region}.s3"

  route_table_ids = concat(
    aws_route_table.private_app[*].id,
    aws_route_table.private_data[*].id
  )

  tags = merge(var.tags, {
    Name        = "advancia-regulated-s3-endpoint"
    Environment = var.environment
    Compliance  = "HIPAA"
  })
}

# VPC Endpoints for DynamoDB
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.regulated.id
  service_name = "com.amazonaws.${var.region}.dynamodb"

  route_table_ids = concat(
    aws_route_table.private_app[*].id,
    aws_route_table.private_data[*].id
  )

  tags = merge(var.tags, {
    Name        = "advancia-regulated-dynamodb-endpoint"
    Environment = var.environment
    Compliance  = "HIPAA"
  })
}

# Flow Logs for VPC (HIPAA audit requirement)
resource "aws_flow_log" "regulated" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.flow_log.arn
  traffic_type    = "ALL"
  vpc_id         = aws_vpc.regulated.id

  tags = merge(var.tags, {
    Name        = "advancia-regulated-flow-log"
    Environment = var.environment
    Compliance  = "HIPAA"
  })
}

# IAM Role for Flow Logs
resource "aws_iam_role" "flow_log" {
  name = "advancia-regulated-flow-log-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      },
    ]
  })

  tags = merge(var.tags, {
    Name        = "advancia-regulated-flow-log-role"
    Environment = var.environment
    Compliance  = "HIPAA"
  })
}

resource "aws_iam_role_policy_attachment" "flow_log" {
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
  role       = aws_iam_role.flow_log.name
}

# CloudWatch Log Group for Flow Logs
resource "aws_cloudwatch_log_group" "flow_log" {
  name              = "/aws/vpc/flow-log/advancia-regulated"
  retention_in_days = 365  # HIPAA requires 1-year retention

  tags = merge(var.tags, {
    Name        = "advancia-regulated-flow-log-lg"
    Environment = var.environment
    Compliance  = "HIPAA"
  })
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.regulated.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_app_subnet_ids" {
  description = "Private app subnet IDs"
  value       = aws_subnet.private_app[*].id
}

output "private_data_subnet_ids" {
  description = "Private data subnet IDs"
  value       = aws_subnet.private_data[*].id
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = aws_nat_gateway.regulated[*].id
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.regulated.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = aws_vpc.regulated.cidr_block
}
