output "cluster_id" {
  description = "Redis cluster ID"
  value       = aws_elasticache_replication_group.main.id
}

output "cluster_arn" {
  description = "Redis cluster ARN"
  value       = aws_elasticache_replication_group.main.arn
}

output "cluster_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "cluster_port" {
  description = "Redis cluster port"
  value       = aws_elasticache_replication_group.main.port
}

output "cluster_nodes" {
  description = "Redis cluster nodes"
  value       = aws_elasticache_replication_group.main.member_clusters
}

output "cluster_cache_nodes" {
  description = "Redis cluster cache nodes"
  value       = aws_elasticache_cluster.main.cache_nodes
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.main.id
}

output "subnet_group_id" {
  description = "Subnet group ID"
  value       = aws_elasticache_subnet_group.main.id
}

output "cluster_engine" {
  description = "Redis engine"
  value       = aws_elasticache_replication_group.main.engine
}

output "cluster_engine_version" {
  description = "Redis engine version"
  value       = aws_elasticache_replication_group.main.engine_version
}

output "cluster_node_type" {
  description = "Redis node type"
  value       = aws_elasticache_replication_group.main.node_type
}

output "cluster_num_cache_nodes" {
  description = "Number of cache nodes"
  value       = aws_elasticache_replication_group.main.num_cache_clusters
}

output "cluster_transit_encryption_enabled" {
  description = "Transit encryption enabled"
  value       = aws_elasticache_replication_group.main.transit_encryption_enabled
}

output "cluster_at_rest_encryption_enabled" {
  description = "At rest encryption enabled"
  value       = aws_elasticache_replication_group.main.at_rest_encryption_enabled
}
