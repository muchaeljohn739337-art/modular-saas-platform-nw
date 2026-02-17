variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs"
  type        = list(string)
}

variable "certificate_arn" {
  description = "ACM certificate ARN"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for the ingress"
  type        = string
  default     = "advancia.example.com"
}

variable "ingress_class" {
  description = "Ingress class"
  type        = string
  default     = "nginx"
}

variable "nginx_helm_chart_version" {
  description = "NGINX Ingress Helm chart version"
  type        = string
  default     = "4.8.0"
}

variable "nginx_controller_replica_count" {
  description = "Number of NGINX controller replicas"
  type        = number
  default     = 2
}

variable "nginx_controller_resources" {
  description = "NGINX controller resources"
  type = object({
    requests = object({
      cpu    = string
      memory = string
    })
    limits = object({
      cpu    = string
      memory = string
    })
  })
  default = {
    requests = {
      cpu    = "100m"
      memory = "128Mi"
    }
    limits = {
      cpu    = "500m"
      memory = "512Mi"
    }
  }
}

variable "enable_waf" {
  description = "Enable AWS WAF"
  type        = bool
  default     = true
}

variable "enable_rate_limiting" {
  description = "Enable rate limiting"
  type        = bool
  default     = true
}

variable "rate_limit_requests" {
  description = "Rate limit requests per second"
  type        = number
  default     = 100
}

variable "enable_cors" {
  description = "Enable CORS"
  type        = bool
  default     = true
}

variable "cors_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["https://*.advancia.example.com"]
}

variable "enable_ssl_redirect" {
  description = "Enable SSL redirect"
  type        = bool
  default     = true
}

variable "environment" {
  description = "Environment tag"
  type        = string
  default     = "production"
}

variable "project" {
  description = "Project tag"
  type        = string
  default     = "advancia"
}

variable "additional_annotations" {
  description = "Additional annotations for ingress"
  type        = map(string)
  default     = {}
}
