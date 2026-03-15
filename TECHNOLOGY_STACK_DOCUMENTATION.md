# Advancia PayLedger - Technology Stack Documentation

**Purpose**: Complete technology stack reference and justification  
**Audience**: Architects, Engineers, Decision Makers  
**Last Updated**: March 9, 2026

---

## Frontend Stack

### Core Framework
- **Next.js 15.1.2**: React framework with SSR/SSG
- **React 18**: UI library
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first CSS framework

### State Management
- **Redux Toolkit**: Global state management
- **React Query**: Server state management
- **Zustand**: Lightweight state management

### UI Components
- **shadcn/ui**: Headless component library
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Icon library

### Testing
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **Playwright**: E2E testing

### Build & Deployment
- **Vercel**: Hosting and deployment
- **Webpack**: Module bundler
- **ESLint**: Code linting
- **Prettier**: Code formatting

---

## Backend Stack

### Runtime & Framework
- **Node.js 18+**: JavaScript runtime
- **Express.js**: Web framework
- **TypeScript**: Type-safe development

### Database
- **PostgreSQL**: Primary relational database
- **Neon**: PostgreSQL hosting
- **Prisma ORM**: Database abstraction layer
- **Redis**: Caching and session store

### API & Communication
- **REST API**: Primary API style
- **GraphQL**: Secondary API (planned)
- **WebSockets**: Real-time communication
- **gRPC**: Service-to-service communication

### Authentication & Security
- **JWT**: Token-based authentication
- **bcrypt**: Password hashing
- **node-jose**: JWT signing/verification
- **helmet**: Security headers

### Testing
- **Jest**: Unit testing
- **Supertest**: HTTP assertion library
- **ts-jest**: TypeScript support for Jest

### Monitoring & Logging
- **Pino**: Structured logging
- **Winston**: Log aggregation
- **Prometheus**: Metrics collection
- **Sentry**: Error tracking

---

## Infrastructure Stack

### Container & Orchestration
- **Docker**: Containerization
- **Kubernetes (EKS)**: Container orchestration
- **Docker Compose**: Local development

### Cloud Provider
- **AWS**: Primary cloud provider
  - **EC2**: Compute instances
  - **EKS**: Kubernetes service
  - **RDS**: Database service
  - **ElastiCache**: Redis service
  - **S3**: Object storage
  - **CloudFront**: CDN
  - **Route53**: DNS
  - **IAM**: Identity management
  - **VPC**: Network isolation
  - **Security Groups**: Firewall

### Infrastructure as Code
- **Terraform**: Infrastructure provisioning
- **CloudFormation**: AWS resource templates

### CI/CD
- **GitHub Actions**: CI/CD pipeline
- **Docker Registry**: Container registry
- **Helm**: Kubernetes package manager

---

## Monitoring & Observability Stack

### Metrics
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **StatsD**: Metrics aggregation

### Logging
- **ELK Stack**: Log aggregation
  - **Elasticsearch**: Log storage
  - **Logstash**: Log processing
  - **Kibana**: Log visualization
- **Fluentd**: Log collector

### Error Tracking
- **Sentry**: Error tracking and monitoring
- **Rollbar**: Error monitoring

### APM
- **New Relic**: Application performance monitoring
- **Datadog**: Infrastructure monitoring

---

## Development Tools

### Version Control
- **Git**: Version control
- **GitHub**: Repository hosting
- **GitHub Actions**: CI/CD automation

### Package Management
- **npm**: Node.js package manager
- **yarn**: Alternative package manager

### Code Quality
- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **SonarCloud**: Code quality analysis
- **Snyk**: Dependency vulnerability scanning

### Documentation
- **Markdown**: Documentation format
- **Swagger/OpenAPI**: API documentation
- **Docusaurus**: Documentation site

---

## Third-Party Services

### Payment Processing
- **Stripe**: Credit card and ACH payments
- **Square**: Alternative payment processor

### Email
- **SendGrid**: Transactional email

### SMS
- **Twilio**: SMS notifications

### Banking
- **Plaid**: Bank account verification

### Analytics
- **Segment**: Event tracking
- **Mixpanel**: User analytics

### Monitoring
- **PagerDuty**: Incident management
- **Datadog**: Infrastructure monitoring

---

## Technology Decisions

### Why Next.js?
- Full-stack React framework
- Built-in SSR and SSG
- Excellent performance
- Great developer experience
- Easy deployment to Vercel

### Why PostgreSQL?
- ACID compliance
- Advanced features (JSON, arrays, etc.)
- Row-Level Security (RLS)
- Excellent for healthcare data
- Strong ecosystem

### Why Kubernetes?
- Container orchestration
- Auto-scaling
- Self-healing
- Rolling updates
- Industry standard

### Why Stripe?
- Industry-leading payment processor
- Excellent API
- Strong security
- Comprehensive features
- Reliable uptime

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CDN (CloudFront)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js/Vercel)                 │
│  - React components                                          │
│  - Server-side rendering                                    │
│  - Static generation                                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (AWS ALB)                      │
│  - Load balancing                                           │
│  - SSL/TLS termination                                      │
│  - Rate limiting                                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Kubernetes Cluster (EKS)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Microservices (Docker containers)                   │   │
│  │  - Auth Service                                      │   │
│  │  - Invoice Service                                   │   │
│  │  - Payment Service                                   │   │
│  │  - Billing Service                                   │   │
│  │  - ... (13 total)                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │  PostgreSQL (Neon)   │      │  Redis (ElastiCache) │    │
│  │  - Primary database  │      │  - Caching           │    │
│  │  - RLS policies      │      │  - Sessions          │    │
│  │  - Backups           │      │  - Queues            │    │
│  └──────────────────────┘      └──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              External Services                               │
│  - Stripe (payments)                                        │
│  - SendGrid (email)                                         │
│  - Twilio (SMS)                                             │
│  - Plaid (banking)                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│            Monitoring & Observability                        │
│  - Prometheus (metrics)                                     │
│  - Grafana (visualization)                                  │
│  - ELK Stack (logs)                                         │
│  - Sentry (errors)                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Version Matrix

| Component | Version | Status | EOL Date |
|-----------|---------|--------|----------|
| Node.js | 18.x, 20.x | Active | April 2025 |
| Next.js | 15.1.2 | Active | October 2026 |
| React | 18.x | Active | Ongoing |
| PostgreSQL | 14.x, 15.x | Active | October 2026 |
| Kubernetes | 1.27+ | Active | Ongoing |
| Docker | 24.x | Active | Ongoing |

---

## Dependency Management

### Frontend Dependencies
```json
{
  "next": "^15.1.2",
  "react": "^18.2.0",
  "typescript": "^5.3.3",
  "tailwindcss": "^3.3.6",
  "@reduxjs/toolkit": "^1.9.7",
  "react-query": "^3.39.3",
  "zustand": "^4.4.1"
}
```

### Backend Dependencies
```json
{
  "express": "^4.18.2",
  "typescript": "^5.3.3",
  "@prisma/client": "^5.7.1",
  "redis": "^4.6.11",
  "jsonwebtoken": "^9.1.2",
  "bcrypt": "^5.1.1",
  "pino": "^8.17.2",
  "prometheus-client": "^15.0.0"
}
```

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
