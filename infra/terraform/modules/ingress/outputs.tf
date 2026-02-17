output "ingress_controller_service_account_arn" {
  description = "Ingress controller service account ARN"
  value       = aws_iam_service_account.ingress_controller.arn
}

output "ingress_controller_role_arn" {
  description = "Ingress controller role ARN"
  value       = aws_iam_role.ingress_controller.arn
}

output "load_balancer_arn" {
  description = "Load balancer ARN"
  value       = data.aws_lb.ingress.arn
}

output "load_balancer_dns_name" {
  description = "Load balancer DNS name"
  value       = data.aws_lb.ingress.dns_name
}

output "load_balancer_zone_id" {
  description = "Load balancer zone ID"
  value       = data.aws_lb.ingress.zone_id
}

output "load_balancer_canonical_hosted_zone_id" {
  description = "Load balancer canonical hosted zone ID"
  value       = data.aws_lb.ingress.canonical_hosted_zone_id
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.ingress.id
}

output "helm_release_name" {
  description = "Helm release name"
  value       = helm_release.ingress_controller.name
}

output "helm_release_version" {
  description = "Helm release version"
  value       = helm_release.ingress_controller.version
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].arn : null
}

output "waf_web_acl_id" {
  description = "WAF Web ACL ID"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].id : null
}
