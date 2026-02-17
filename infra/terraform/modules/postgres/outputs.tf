output "instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "instance_hosted_zone_id" {
  description = "RDS instance hosted zone ID"
  value       = aws_db_instance.main.hosted_zone_id
}

output "instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "instance_status" {
  description = "RDS instance status"
  value       = aws_db_instance.main.status
}

output "instance_username" {
  description = "RDS instance username"
  value       = aws_db_instance.main.username
}

output "instance_database_name" {
  description = "RDS instance database name"
  value       = aws_db_instance.main.db_name
}

output "instance_resource_id" {
  description = "RDS instance resource ID"
  value       = aws_db_instance.main.resource_id
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.main.id
}

output "subnet_group_id" {
  description = "Subnet group ID"
  value       = aws_db_subnet_group.main.id
}

output "read_replica_ids" {
  description = "Read replica IDs"
  value       = aws_db_instance.read_replica[*].id
}
