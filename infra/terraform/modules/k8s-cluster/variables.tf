variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnets" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnets" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "node_groups" {
  description = "EKS node groups configuration"
  type = map(object({
    instance_type = string
    min_size     = number
    max_size     = number
    desired_size = number
  }))
  default = {
    "system" = {
      instance_type = "t3.medium"
      min_size     = 1
      max_size     = 3
      desired_size = 2
    }
    "worker" = {
      instance_type = "t3.large"
      min_size     = 2
      max_size     = 10
      desired_size = 3
    }
  }
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.29"
}
