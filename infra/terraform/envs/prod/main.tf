terraform {
  backend "s3" {
    bucket = "advancia-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
    dynamodb_table = "advancia-terraform-locks"
  }
}

provider "aws" {
  region = var.region
}

# Data sources for existing resources
data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Configuration
locals {
  cluster_name = "advancia-prod"
  environment  = "production"
  project      = "advancia"
  
  vpc_cidr = "10.0.0.0/16"
  
  private_subnets = [
    "10.0.1.0/24",
    "10.0.2.0/24", 
    "10.0.3.0/24"
  ]
  
  public_subnets = [
    "10.0.101.0/24",
    "10.0.102.0/24"
  ]
  
  tags = {
    Environment = local.environment
    Project     = local.project
    ManagedBy   = "terraform"
  }
}

# EKS Cluster
module "cluster" {
  source = "../modules/k8s-cluster"

  cluster_name = local.cluster_name
  region       = var.region
  vpc_cidr     = local.vpc_cidr
  
  private_subnets = local.private_subnets
  public_subnets  = local.public_subnets
  
  node_groups = {
    "system" = {
      instance_type = "t3.medium"
      min_size     = 2
      max_size     = 3
      desired_size = 2
    }
    "worker" = {
      instance_type = "t3.large"
      min_size     = 3
      max_size     = 10
      desired_size = 3
    }
    "ai" = {
      instance_type = "t3.xlarge"
      min_size     = 2
      max_size     = 5
      desired_size = 2
    }
  }
  
  kubernetes_version = "1.29"
  
  tags = local.tags
}

# PostgreSQL Database
module "postgres" {
  source = "../modules/postgres"

  identifier = "advancia-postgres-prod"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r6g.large"
  
  allocated_storage     = 500
  max_allocated_storage = 2000
  
  username = var.db_username
  password = var.db_password
  database_name = "advancia_prod"
  
  vpc_id              = module.cluster.vpc_id
  subnet_ids          = module.cluster.private_subnet_ids
  security_group_ids  = []
  
  backup_retention_period = 14
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  deletion_protection = true
  skip_final_snapshot = false
  storage_encrypted   = true
  multi_az            = true
  read_replicas       = 1
  
  environment = local.environment
  project     = local.project
  
  depends_on = [module.cluster]
}

# Redis Cache
module "redis" {
  source = "../modules/redis"

  identifier = "advancia-redis-prod"
  
  node_type = "cache.r6g.large"
  num_cache_nodes = 3
  
  engine         = "redis"
  engine_version = "7.0"
  port           = 6379
  
  subnet_group_name = ""
  security_group_ids = []
  
  vpc_id      = module.cluster.vpc_id
  subnet_ids  = module.cluster.private_subnet_ids
  
  at_rest_encryption_enabled   = true
  transit_encryption_enabled   = true
  auth_token                   = var.redis_auth_token
  
  automatic_failover_enabled = true
  multi_az_enabled           = true
  
  notification_topic_arn = ""
  
  snapshot_retention_limit = 14
  snapshot_window         = "03:00-05:00"
  maintenance_window      = "sun:05:00-sun:06:00"
  
  apply_immediately          = false
  auto_minor_version_upgrade = true
  
  environment = local.environment
  project     = local.project
  
  depends_on = [module.cluster]
}

# Ingress Controller
module "ingress" {
  source = "../modules/ingress"

  cluster_name = local.cluster_name
  vpc_id       = module.cluster.vpc_id
  
  public_subnet_ids = module.cluster.public_subnet_ids
  
  certificate_arn = var.certificate_arn
  domain_name     = var.domain_name
  
  ingress_class = "nginx"
  
  nginx_helm_chart_version = "4.8.0"
  nginx_controller_replica_count = 2
  
  nginx_controller_resources = {
    requests = {
      cpu    = "200m"
      memory = "256Mi"
    }
    limits = {
      cpu    = "1000m"
      memory = "1Gi"
    }
  }
  
  enable_waf          = true
  enable_rate_limiting = true
  rate_limit_requests = 200
  
  enable_cors = true
  cors_origins = [
    "https://*.advancia.example.com",
    "https://advancia.example.com"
  ]
  
  enable_ssl_redirect = true
  
  environment = local.environment
  project     = local.project
  
  depends_on = [module.cluster]
}

# Monitoring Stack (placeholder for now)
# module "monitoring" {
#   source = "../modules/monitoring"
#   cluster_name = local.cluster_name
#   vpc_id       = module.cluster.vpc_id
#   subnet_ids   = module.cluster.private_subnet_ids
#   
#   depends_on = [module.cluster]
# }

# Outputs
output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.cluster.cluster_endpoint
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.cluster.cluster_name
}

output "postgres_endpoint" {
  description = "PostgreSQL endpoint"
  value       = module.postgres.instance_endpoint
}

output "postgres_port" {
  description = "PostgreSQL port"
  value       = module.postgres.instance_port
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.redis.cluster_endpoint
}

output "redis_port" {
  description = "Redis port"
  value       = module.redis.cluster_port
}

output "ingress_dns_name" {
  description = "Ingress load balancer DNS name"
  value       = module.ingress.load_balancer_dns_name
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.cluster.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.cluster.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.cluster.public_subnet_ids
}
