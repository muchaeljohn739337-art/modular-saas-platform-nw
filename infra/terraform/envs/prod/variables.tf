variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "advancia_admin"
}

variable "db_password" {
  description = "PostgreSQL master password"
  type        = string
  sensitive   = true
}

variable "redis_auth_token" {
  description = "Redis auth token"
  type        = string
  sensitive   = true
}

variable "certificate_arn" {
  description = "ACM certificate ARN for SSL"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "advancia.example.com"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "advancia-prod"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "production"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "advancia"
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
