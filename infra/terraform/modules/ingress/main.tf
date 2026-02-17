terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
  }
}

# IAM Role for Ingress Controller
resource "aws_iam_role" "ingress_controller" {
  name = "${var.cluster_name}-ingress-controller-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = data.aws_iam_openid_connect_provider.eks.arn
        }
        Condition = {
          StringEquals = {
            "${data.aws_iam_openid_connect_provider.eks.url:sub}" = "system:serviceaccount:kube-system:ingress-nginx-controller"
          }
        }
      },
    ]
  })

  tags = {
    Name        = "${var.cluster_name}-ingress-controller-role"
    Environment = var.environment
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "ingress_controller_AmazonEKSClusterPolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.ingress_controller.name
}

resource "aws_iam_role_policy" "ingress_controller" {
  name = "${var.cluster_name}-ingress-controller-policy"
  role = aws_iam_role.ingress_controller.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeRegions",
          "ec2:DescribeRouteTables",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets",
          "ec2:DescribeVpcs",
          "elasticloadbalancing:DescribeLoadBalancers",
          "elasticloadbalancing:DescribeLoadBalancerAttributes",
          "elasticloadbalancing:DescribeListeners",
          "elasticloadbalancing:DescribeListenerAttributes",
          "elasticloadbalancing:DescribeTags",
          "elasticloadbalancing:DescribeTargetGroups",
          "elasticloadbalancing:DescribeTargetGroupAttributes",
          "elasticloadbalancing:DescribeTargetHealth",
          "elasticloadbalancing:ModifyLoadBalancerAttributes",
          "elasticloadbalancing:ModifyListenerAttributes",
          "elasticloadbalancing:ModifyTargetGroup",
          "elasticloadbalancing:ModifyTargetGroupAttributes",
          "elasticloadbalancing:RegisterTargets",
          "elasticloadbalancing:DeregisterTargets",
          "elasticloadbalancing:SetWebAcl",
          "elasticloadbalancing:ModifyRule",
          "elasticloadbalancing:AddTags",
          "elasticloadbalancing:CreateListener",
          "elasticloadbalancing:CreateLoadBalancer",
          "elasticloadbalancing:CreateRule",
          "elasticloadbalancing:CreateTargetGroup",
          "elasticloadbalancing:DeleteListener",
          "elasticloadbalancing:DeleteLoadBalancer",
          "elasticloadbalancing:DeleteRule",
          "elasticloadbalancing:DeleteTargetGroup",
          "wafv2:GetWebACL",
          "wafv2:AssociateWebACL",
          "wafv2:DisassociateWebACL",
          "waf-regional:GetWebACLForResource",
          "waf-regional:AssociateWebACL",
          "waf-regional:DisassociateWebACL",
          "shield:GetSubscriptionState",
          "shield:DescribeProtection",
          "shield:CreateProtection",
          "shield:DeleteProtection",
          "cognito-idp:DescribeUserPoolClient"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_service_account" "ingress_controller" {
  namespace = "kube-system"
  name       = "ingress-nginx-controller"

  role_name = aws_iam_role.ingress_controller.name

  tags = {
    Name        = "${var.cluster_name}-ingress-controller-sa"
    Environment = var.environment
    Project     = var.project
  }
}

# Security Group for Ingress
resource "aws_security_group" "ingress" {
  name        = "${var.cluster_name}-ingress-sg"
  description = "Security group for ingress controller"
  vpc_id      = var.vpc_id

  # Allow HTTP traffic
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTPS traffic
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.cluster_name}-ingress-sg"
    Environment = var.environment
    Project     = var.project
  }
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  count = var.enable_waf ? 1 : 0

  name        = "${var.cluster_name}-waf"
  description = "WAF for ${var.cluster_name}"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                 = "${var.cluster_name}-waf"
    sampled_requests_enabled    = true
  }

  # Rate limiting rule
  dynamic "rule" {
    for_each = var.enable_rate_limiting ? [1] : []
    content {
      name     = "${var.cluster_name}-rate-limit"
      priority = 1

      statement {
        rate_based_statement {
          limit               = var.rate_limit_requests
          aggregate_key_type = "IP"
        }
      }

      action {
        block {}
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                 = "${var.cluster_name}-rate-limit"
        sampled_requests_enabled    = true
      }
    }
  }

  # Common attack rule
  rule {
    name     = "${var.cluster_name}-common-attacks"
    priority = 2

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    override {
      action_to_use {
        count {}
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "${var.cluster_name}-common-attacks"
      sampled_requests_enabled    = true
    }
  }

  tags = {
    Name        = "${var.cluster_name}-waf"
    Environment = var.environment
    Project     = var.project
  }
}

# Helm Release for NGINX Ingress Controller
resource "helm_release" "ingress_controller" {
  name       = "ingress-nginx"
  namespace  = "kube-system"
  repository = "https://kubernetes.github.io/ingress-nginx"
  chart      = "ingress-nginx"
  version    = var.nginx_helm_chart_version

  set {
    name  = "controller.replicaCount"
    value = var.nginx_controller_replica_count
  }

  set {
    name  = "controller.serviceAccount.name"
    value = "ingress-nginx-controller"
  }

  set {
    name  = "controller.serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = aws_iam_service_account.ingress_controller.arn
  }

  set {
    name  = "controller.resources.requests.cpu"
    value = var.nginx_controller_resources.requests.cpu
  }

  set {
    name  = "controller.resources.requests.memory"
    value = var.nginx_controller_resources.requests.memory
  }

  set {
    name  = "controller.resources.limits.cpu"
    value = var.nginx_controller_resources.limits.cpu
  }

  set {
    name  = "controller.resources.limits.memory"
    value = var.nginx_controller_resources.limits.memory
  }

  set {
    name  = "controller.ingressClassResource.name"
    value = var.ingress_class
  }

  set {
    name  = "controller.ingressClassResource.controllerValue"
    value = "k8s.io/ingress-nginx"
  }

  set {
    name  = "controller.ingressClassResource.enabled"
    value = true
  }

  # Security group annotations
  set {
    name  = "controller.service.annotations.service\\.beta\\.kubernetes\\.io/aws-load-balancer-security-groups"
    value = aws_security_group.ingress.id
  }

  # WAF annotations
  dynamic "set" {
    for_each = var.enable_waf ? [1] : []
    content {
      name  = "controller.service.annotations.service\\.beta\\.kubernetes\\.io/aws-load-balancer-waf-web-acl-ids"
      value = aws_wafv2_web_acl.main[0].arn
    }
  }

  # SSL certificate annotations
  dynamic "set" {
    for_each = var.certificate_arn != "" ? [1] : []
    content {
      name  = "controller.service.annotations.service\\.beta\\.kubernetes\\.io/aws-load-balancer-ssl-cert"
      value = var.certificate_arn
    }
  }

  # SSL redirect annotations
  dynamic "set" {
    for_each = var.enable_ssl_redirect ? [1] : []
    content {
      name  = "controller.service.annotations.service\\.beta\\.kubernetes\\.io/aws-load-balancer-ssl-ports"
      value = "443"
    }
  }

  # CORS configuration
  dynamic "set" {
    for_each = var.enable_cors ? [1] : []
    content {
      name  = "controller.config.enable-cors"
      value = "true"
    }
  }

  dynamic "set" {
    for_each = var.enable_cors ? [1] : []
    content {
      name  = "controller.config.cors-allow-origin"
      value = join(",", var.cors_origins)
    }
  }

  # Rate limiting configuration
  dynamic "set" {
    for_each = var.enable_rate_limiting ? [1] : []
    content {
      name  = "controller.config.rate-limit-connections"
      value = "100"
    }
  }

  # Additional annotations
  dynamic "set" {
    for_each = var.additional_annotations
    content {
      name  = "controller.service.annotations.${replace(key, ".", "\\.")}"
      value = value
    }
  }

  depends_on = [aws_iam_service_account.ingress_controller]

  tags = {
    Name        = "${var.cluster_name}-ingress-nginx"
    Environment = var.environment
    Project     = var.project
  }
}

# Data sources
data "aws_iam_openid_connect_provider" "eks" {
  url = data.aws_eks_cluster.main.identity[0].oidc[0].issuer
}

data "aws_eks_cluster" "main" {
  name = var.cluster_name
}

data "aws_lb" "ingress" {
  depends_on = [helm_release.ingress_controller]

  tags = {
    "ingress.k8s.aws/stack" = "ingress-nginx/ingress-nginx"
  }
}
