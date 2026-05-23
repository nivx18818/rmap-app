import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

import { PrismaClient } from '../generated/prisma/client';

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ROLE_CATEGORY = 'BACKEND';

type ResourceType = 'YOUTUBE' | 'DOCS' | 'COURSE' | 'ARTICLE';

type SkillSeed = {
  name: string;
  desc: string;
  hrs: number;
  resource: {
    title: string;
    url: string;
    type: ResourceType;
  };
};

const log = (message: string) => {
  process.stdout.write(`${message}\n`);
};

const warn = (message: string) => {
  process.stderr.write(`${message}\n`);
};

const docs = (title: string, url: string) => ({ title, url, type: 'DOCS' as const });
const article = (title: string, url: string) => ({ title, url, type: 'ARTICLE' as const });

const backendSkills: SkillSeed[] = [
  {
    name: 'How does the internet work?',
    desc: 'Understand packets, IP addresses, routing, clients, servers, latency, bandwidth, and how a browser request reaches a backend service.',
    hrs: 4,
    resource: docs(
      'How does the Internet work?',
      'https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work',
    ),
  },
  {
    name: 'What is HTTP?',
    desc: 'Learn HTTP methods, headers, status codes, request bodies, response bodies, redirects, cookies, and the request-response lifecycle.',
    hrs: 6,
    resource: docs('HTTP Overview', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview'),
  },
  {
    name: 'What is Domain Name?',
    desc: 'Understand domain names, subdomains, registrars, name servers, DNS records, and how readable names map to backend endpoints.',
    hrs: 3,
    resource: article(
      'What is a Domain Name?',
      'https://www.cloudflare.com/learning/dns/glossary/what-is-a-domain-name/',
    ),
  },
  {
    name: 'What is hosting?',
    desc: 'Understand what it means to run a backend on a server or cloud platform, including ports, processes, runtime config, and public access.',
    hrs: 3,
    resource: article(
      'What is Web Hosting?',
      'https://www.cloudflare.com/learning/performance/what-is-web-hosting/',
    ),
  },
  {
    name: 'DNS and how it works?',
    desc: 'Learn DNS lookup flow, resolvers, authoritative name servers, A/AAAA/CNAME records, TTL, caching, and propagation.',
    hrs: 5,
    resource: article('What is DNS?', 'https://www.cloudflare.com/learning/dns/what-is-dns/'),
  },
  {
    name: 'Browsers and how they work?',
    desc: 'Understand how browsers resolve URLs, issue HTTP requests, manage cookies, enforce CORS, cache responses, and consume backend APIs.',
    hrs: 4,
    resource: docs(
      'Populating the page',
      'https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work',
    ),
  },
  {
    name: 'JavaScript',
    desc: 'Use JavaScript for backend logic: modules, promises, async/await, error handling, collections, JSON, and package scripts.',
    hrs: 18,
    resource: docs(
      'JavaScript Guide',
      'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
    ),
  },
  {
    name: 'Go',
    desc: 'Build backend services with Go using HTTP handlers, modules, goroutines, context, errors, JSON, and simple deployment workflows.',
    hrs: 14,
    resource: docs('Go Documentation', 'https://go.dev/doc/'),
  },
  {
    name: 'Python',
    desc: 'Use Python for backend APIs, virtual environments, dependency management, type hints, testing, and FastAPI or Django-style frameworks.',
    hrs: 12,
    resource: docs('Python Tutorial', 'https://docs.python.org/3/tutorial/'),
  },
  {
    name: 'Ruby',
    desc: 'Understand Ruby backend development, Rails conventions, MVC, Active Record, routing, migrations, and test workflows.',
    hrs: 10,
    resource: docs('Ruby Documentation', 'https://www.ruby-lang.org/en/documentation/'),
  },
  {
    name: 'Java',
    desc: 'Understand JVM backend development, Spring-style applications, dependency injection, persistence, build tools, and production service patterns.',
    hrs: 14,
    resource: docs('Java Documentation', 'https://dev.java/learn/'),
  },
  {
    name: 'C#',
    desc: 'Build backend APIs with C# and .NET using controllers, dependency injection, async code, Entity Framework, and deployment basics.',
    hrs: 12,
    resource: docs('C# Documentation', 'https://learn.microsoft.com/en-us/dotnet/csharp/'),
  },
  {
    name: 'PHP',
    desc: 'Understand PHP backend request lifecycle, Composer, Laravel-style frameworks, routing, database access, and deployment workflows.',
    hrs: 10,
    resource: docs('PHP Manual', 'https://www.php.net/manual/en/'),
  },
  {
    name: 'Rust',
    desc: 'Understand Rust backend use cases, ownership, memory safety, async runtimes, HTTP frameworks, and performance tradeoffs.',
    hrs: 14,
    resource: docs('The Rust Programming Language', 'https://doc.rust-lang.org/book/'),
  },
  {
    name: 'Git',
    desc: 'Use Git commits, branches, merges, rebases, tags, conflict resolution, and clean history for backend team collaboration.',
    hrs: 8,
    resource: docs('Pro Git Book', 'https://git-scm.com/book/en/v2'),
  },
  {
    name: 'GitHub',
    desc: 'Use GitHub repositories, pull requests, branch protection, reviews, issues, actions, and team collaboration workflows.',
    hrs: 5,
    resource: docs('GitHub Docs', 'https://docs.github.com/en'),
  },
  {
    name: 'Bitbucket',
    desc: 'Use Bitbucket repositories, pull requests, branch permissions, pipelines, and Jira-oriented backend team workflows.',
    hrs: 4,
    resource: docs('Bitbucket Documentation', 'https://support.atlassian.com/bitbucket-cloud/'),
  },
  {
    name: 'GitLab',
    desc: 'Use GitLab repositories, merge requests, issues, CI pipelines, environments, protected branches, and review workflows.',
    hrs: 5,
    resource: docs('GitLab Documentation', 'https://docs.gitlab.com/'),
  },
  {
    name: 'PostgreSQL',
    desc: 'Use PostgreSQL data types, constraints, relationships, indexes, transactions, query plans, JSONB, and administration basics.',
    hrs: 18,
    resource: docs('PostgreSQL Documentation', 'https://www.postgresql.org/docs/'),
  },
  {
    name: 'MS SQL',
    desc: 'Understand Microsoft SQL Server, T-SQL, indexes, stored procedures, transactions, tooling, and enterprise backend integration.',
    hrs: 8,
    resource: docs('SQL Server Documentation', 'https://learn.microsoft.com/en-us/sql/sql-server/'),
  },
  {
    name: 'MySQL',
    desc: 'Use MySQL schemas, SQL queries, indexes, transactions, storage engines, query planning basics, and backend integration patterns.',
    hrs: 10,
    resource: docs('MySQL Reference Manual', 'https://dev.mysql.com/doc/'),
  },
  {
    name: 'Oracle',
    desc: 'Understand Oracle database concepts, SQL dialect differences, transactions, stored procedures, tooling, and enterprise use cases.',
    hrs: 8,
    resource: docs('Oracle Database Documentation', 'https://docs.oracle.com/en/database/'),
  },
  {
    name: 'MariaDB',
    desc: 'Understand MariaDB features, MySQL compatibility, SQL operations, indexes, replication basics, and backend use cases.',
    hrs: 8,
    resource: docs('MariaDB Documentation', 'https://mariadb.com/kb/en/documentation/'),
  },
  {
    name: 'ORMs',
    desc: 'Understand object-relational mapping, model definitions, relation loading, query builders, migrations, transactions, and ORM performance tradeoffs.',
    hrs: 8,
    resource: docs('Prisma ORM Introduction', 'https://www.prisma.io/docs/orm'),
  },
  {
    name: 'Normalization',
    desc: 'Normalize relational schemas to reduce duplication, protect integrity, model dependencies, and intentionally choose denormalization when needed.',
    hrs: 6,
    resource: article(
      'Database Normalization',
      'https://www.geeksforgeeks.org/dbms/introduction-of-database-normalization/',
    ),
  },
  {
    name: 'ACID',
    desc: 'Understand atomicity, consistency, isolation, and durability as database guarantees for reliable multi-step writes.',
    hrs: 5,
    resource: docs(
      'Transaction Isolation',
      'https://www.postgresql.org/docs/current/transaction-iso.html',
    ),
  },
  {
    name: 'Transactions',
    desc: 'Use transactions to group writes, handle rollback, choose isolation levels, prevent race conditions, and preserve business invariants.',
    hrs: 7,
    resource: docs(
      'Transactions',
      'https://www.postgresql.org/docs/current/tutorial-transactions.html',
    ),
  },
  {
    name: 'Migrations',
    desc: 'Manage schema changes with versioned migration files, reviews, rollbacks, backfills, compatibility windows, and release workflows.',
    hrs: 8,
    resource: docs('Prisma Migrate', 'https://www.prisma.io/docs/orm/prisma-migrate'),
  },
  {
    name: 'Failure Modes',
    desc: 'Identify database and backend failures such as timeouts, locks, deadlocks, overload, replication lag, partial outages, and bad deployments.',
    hrs: 7,
    resource: article(
      'Resiliency Patterns',
      'https://learn.microsoft.com/en-us/azure/architecture/patterns/category/resiliency',
    ),
  },
  {
    name: 'Profiling Perfor.',
    desc: 'Profile slow database queries and backend hot paths using timing data, query plans, traces, metrics, and bottleneck analysis.',
    hrs: 8,
    resource: docs('Using EXPLAIN', 'https://www.postgresql.org/docs/current/using-explain.html'),
  },
  {
    name: 'N+1 Problem',
    desc: 'Detect repeated query patterns caused by loading related data one row at a time, then fix them with joins, batching, or eager loading.',
    hrs: 5,
    resource: docs(
      'Prisma Query Optimization',
      'https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance',
    ),
  },
  {
    name: 'Database Indexes',
    desc: 'Design indexes using selectivity, composite keys, covering indexes, specialized index types, and write-performance tradeoffs.',
    hrs: 10,
    resource: docs('PostgreSQL Indexes', 'https://www.postgresql.org/docs/current/indexes.html'),
  },
  {
    name: 'Sharding Strategies',
    desc: 'Understand shard keys, horizontal partitioning, rebalancing, hot partitions, cross-shard queries, and operational complexity.',
    hrs: 8,
    resource: article(
      'Database Sharding',
      'https://www.mongodb.com/features/database-sharding-explained',
    ),
  },
  {
    name: 'Data Replication',
    desc: 'Learn leader-follower replication, failover, replication lag, read replicas, disaster recovery, and consistency tradeoffs.',
    hrs: 8,
    resource: docs(
      'High Availability, Load Balancing, and Replication',
      'https://www.postgresql.org/docs/current/high-availability.html',
    ),
  },
  {
    name: 'CAP Theorem',
    desc: 'Reason about consistency, availability, partition tolerance, distributed data tradeoffs, and behavior during network partitions.',
    hrs: 6,
    resource: article('CAP Theorem', 'https://www.ibm.com/think/topics/cap-theorem'),
  },
  {
    name: 'Scaling Databases',
    desc: 'Scale database workloads with vertical scaling, read replicas, partitioning, connection pooling, caching, and workload isolation.',
    hrs: 10,
    resource: article(
      'Database Scaling',
      'https://www.digitalocean.com/community/tutorials/understanding-database-sharding',
    ),
  },
  {
    name: 'HATEOAS',
    desc: 'Understand hypermedia links and affordances in REST responses and when HATEOAS is useful for API discoverability.',
    hrs: 4,
    resource: article('HATEOAS', 'https://restfulapi.net/hateoas/'),
  },
  {
    name: 'JSON APIs',
    desc: 'Design predictable JSON request and response contracts, serialization rules, error shapes, nested payloads, and compatible changes.',
    hrs: 6,
    resource: docs('JSON Introduction', 'https://www.json.org/json-en.html'),
  },
  {
    name: 'Open API Specs',
    desc: 'Document endpoints, schemas, parameters, responses, examples, and authentication requirements with OpenAPI specifications.',
    hrs: 8,
    resource: docs('OpenAPI Specification', 'https://spec.openapis.org/oas/latest.html'),
  },
  {
    name: 'SOAP',
    desc: 'Recognize SOAP envelopes, XML messaging, WSDL contracts, enterprise integrations, and legacy service interoperability.',
    hrs: 4,
    resource: article('SOAP Introduction', 'https://www.w3schools.com/xml/xml_soap.asp'),
  },
  {
    name: 'gRPC',
    desc: 'Use Protocol Buffers, strongly typed service contracts, unary calls, streaming, deadlines, and internal service communication.',
    hrs: 8,
    resource: docs('gRPC Introduction', 'https://grpc.io/docs/what-is-grpc/introduction/'),
  },
  {
    name: 'REST',
    desc: 'Understand REST resources, representations, statelessness, methods, status codes, cacheability, and uniform interface constraints.',
    hrs: 8,
    resource: article('REST API Tutorial', 'https://restfulapi.net/'),
  },
  {
    name: 'GraphQL',
    desc: 'Use schemas, queries, mutations, resolvers, input types, pagination, authorization, and REST-versus-GraphQL tradeoffs.',
    hrs: 10,
    resource: docs('GraphQL Learn', 'https://graphql.org/learn/'),
  },
  {
    name: 'CDN',
    desc: 'Use content delivery networks for static assets, edge caching, cache invalidation, origin protection, and latency reduction.',
    hrs: 5,
    resource: article('What is a CDN?', 'https://www.cloudflare.com/learning/cdn/what-is-a-cdn/'),
  },
  {
    name: 'Server Side Caching',
    desc: 'Cache expensive backend work with cache-aside, write-through, TTL, invalidation, stale data handling, and HTTP cache headers.',
    hrs: 8,
    resource: docs('HTTP Caching', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching'),
  },
  {
    name: 'Redis',
    desc: 'Use Redis for caching, sessions, rate limits, queues, pub/sub, sorted sets, locks, and high-speed data access.',
    hrs: 10,
    resource: docs('Redis Documentation', 'https://redis.io/docs/latest/'),
  },
  {
    name: 'Memcached',
    desc: 'Understand simple distributed memory caching, cache keys, expiry, eviction, and where Memcached fits compared with Redis.',
    hrs: 4,
    resource: docs('Memcached Wiki', 'https://github.com/memcached/memcached/wiki'),
  },
  {
    name: 'Web Security',
    desc: 'Understand browser and API security boundaries, secure headers, authentication risks, input attacks, and defense-in-depth.',
    hrs: 8,
    resource: docs('OWASP Cheat Sheet Series', 'https://cheatsheetseries.owasp.org/'),
  },
  {
    name: 'Authentication',
    desc: 'Design secure login, identity verification, sessions, tokens, account lifecycle, credential recovery, and abuse-resistant auth flows.',
    hrs: 8,
    resource: docs(
      'Authentication Cheat Sheet',
      'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
    ),
  },
  {
    name: 'JWT',
    desc: 'Use JSON Web Tokens for signed claims, access tokens, refresh flows, expiration, validation, rotation, and secure storage decisions.',
    hrs: 7,
    resource: docs('JWT Introduction', 'https://jwt.io/introduction'),
  },
  {
    name: 'Basic Authentication',
    desc: 'Understand HTTP Basic authentication, credential encoding, TLS requirements, limitations, and modern alternatives.',
    hrs: 4,
    resource: docs(
      'HTTP Authentication',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Authentication',
    ),
  },
  {
    name: 'Token Authentication',
    desc: 'Use opaque or signed tokens to authenticate API requests, handle expiry, refresh, revocation, and secure client storage.',
    hrs: 7,
    resource: docs('Bearer Token Usage', 'https://www.rfc-editor.org/rfc/rfc6750'),
  },
  {
    name: 'OAuth',
    desc: 'Understand OAuth authorization flows, scopes, clients, resource servers, access tokens, refresh tokens, and consent screens.',
    hrs: 9,
    resource: docs('OAuth 2.0', 'https://oauth.net/2/'),
  },
  {
    name: 'Cookie Based Auth',
    desc: 'Use cookie sessions with HttpOnly, SameSite, Secure flags, CSRF protection, session invalidation, and logout behavior.',
    hrs: 6,
    resource: docs('HTTP Cookies', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies'),
  },
  {
    name: 'OpenID',
    desc: 'Understand OpenID Connect identity flows, ID tokens, user info endpoints, discovery documents, and login integration.',
    hrs: 7,
    resource: docs('OpenID Connect', 'https://openid.net/developers/how-connect-works/'),
  },
  {
    name: 'SAML',
    desc: 'Understand SAML assertions, identity providers, service providers, enterprise SSO, metadata, and certificate-based trust.',
    hrs: 5,
    resource: article(
      'What is SAML?',
      'https://www.cloudflare.com/learning/access-management/what-is-saml/',
    ),
  },
  {
    name: 'Hashing Algorithms',
    desc: 'Understand one-way hashes, salts, work factors, MD5, SHA, bcrypt, scrypt, and password hashing versus general hashing.',
    hrs: 6,
    resource: docs('Node.js Crypto', 'https://nodejs.org/api/crypto.html'),
  },
  {
    name: 'MD5',
    desc: 'Recognize MD5 as a broken cryptographic hash and understand collision risks and why it must not secure passwords or integrity.',
    hrs: 3,
    resource: article('MD5', 'https://en.wikipedia.org/wiki/MD5'),
  },
  {
    name: 'SHA',
    desc: 'Understand SHA hash families, integrity checks, collision resistance, and appropriate backend use cases.',
    hrs: 4,
    resource: article(
      'Secure Hash Algorithms',
      'https://en.wikipedia.org/wiki/Secure_Hash_Algorithms',
    ),
  },
  {
    name: 'scrypt',
    desc: 'Use scrypt as a memory-hard password hashing algorithm with salts, parameters, verification, and migration strategies.',
    hrs: 4,
    resource: docs(
      'Node.js scrypt',
      'https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback',
    ),
  },
  {
    name: 'bcrypt',
    desc: 'Use bcrypt for password hashing, salts, cost factors, secure verification, and safe password migration.',
    hrs: 4,
    resource: docs(
      'Password Storage Cheat Sheet',
      'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html',
    ),
  },
  {
    name: 'HTTPS',
    desc: 'Understand HTTPS as HTTP over TLS, certificate validation, HSTS, secure transport, redirects, and reverse proxy termination.',
    hrs: 5,
    resource: docs('HTTPS', 'https://developer.mozilla.org/en-US/docs/Glossary/HTTPS'),
  },
  {
    name: 'OWASP Risks',
    desc: 'Recognize OWASP risks such as broken access control, injection, auth failures, SSRF, insecure design, and sensitive data exposure.',
    hrs: 8,
    resource: docs(
      'OWASP API Security Top 10',
      'https://owasp.org/API-Security/editions/2023/en/0x11-t10/',
    ),
  },
  {
    name: 'SSL/TLS',
    desc: 'Understand certificates, certificate authorities, TLS handshakes, cipher suites, HTTPS termination, and legacy SSL risks.',
    hrs: 6,
    resource: docs(
      'Transport Layer Security',
      'https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security',
    ),
  },
  {
    name: 'CORS',
    desc: 'Configure Cross-Origin Resource Sharing, preflight requests, allowed origins, credentials, and safe browser API access.',
    hrs: 5,
    resource: docs('CORS', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS'),
  },
  {
    name: 'Server Security',
    desc: 'Harden backend servers with least privilege, patching, secrets management, network controls, logging, and secure configuration.',
    hrs: 8,
    resource: docs('Server Side TLS', 'https://wiki.mozilla.org/Security/Server_Side_TLS'),
  },
  {
    name: 'CSP',
    desc: 'Use Content Security Policy headers to reduce XSS impact, control resource loading, and harden browser-facing apps.',
    hrs: 5,
    resource: docs(
      'Content Security Policy',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP',
    ),
  },
  {
    name: 'API Security Best Practices',
    desc: 'Apply authentication, authorization, validation, rate limits, logging, sensitive data handling, and secure API error responses.',
    hrs: 10,
    resource: docs(
      'REST Security Cheat Sheet',
      'https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html',
    ),
  },
  {
    name: 'Integration Testing',
    desc: 'Test backend modules with real boundaries such as databases, HTTP servers, auth flows, repositories, and external service adapters.',
    hrs: 12,
    resource: docs('NestJS Testing', 'https://docs.nestjs.com/fundamentals/testing'),
  },
  {
    name: 'Functional Testing',
    desc: 'Validate backend behavior from API requirements and user flows, using realistic inputs, auth, seeded data, and expected outputs.',
    hrs: 8,
    resource: docs('SuperTest', 'https://github.com/ladjs/supertest'),
  },
  {
    name: 'Unit Testing',
    desc: 'Write isolated tests for services, validators, pure functions, controllers, and business rules with fast feedback.',
    hrs: 10,
    resource: docs('Jest Getting Started', 'https://jestjs.io/docs/getting-started'),
  },
  {
    name: 'CI / CD',
    desc: 'Automate linting, tests, builds, migrations, release checks, deployments, and rollback-aware delivery pipelines.',
    hrs: 10,
    resource: docs('GitHub Actions', 'https://docs.github.com/en/actions'),
  },
  {
    name: 'GOF Design Patterns',
    desc: 'Apply factory, strategy, adapter, decorator, observer, command, and other common patterns where they reduce real complexity.',
    hrs: 10,
    resource: article('Design Patterns', 'https://refactoring.guru/design-patterns'),
  },
  {
    name: 'CQRS',
    desc: 'Separate command and query models, understand read/write tradeoffs, projections, and when CQRS is worth the added complexity.',
    hrs: 8,
    resource: article(
      'CQRS Pattern',
      'https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs',
    ),
  },
  {
    name: 'Domain Driven Design',
    desc: 'Model domains with entities, value objects, aggregates, repositories, services, bounded contexts, and ubiquitous language.',
    hrs: 14,
    resource: article('DDD Reference', 'https://www.domainlanguage.com/ddd/reference/'),
  },
  {
    name: 'Event Sourcing',
    desc: 'Store changes as events, rebuild aggregate state, manage projections, version events, and reason about auditability.',
    hrs: 10,
    resource: article(
      'Event Sourcing Pattern',
      'https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing',
    ),
  },
  {
    name: 'Test Driven Development',
    desc: 'Use red-green-refactor cycles, behavior-first test design, regression coverage, and testable backend architecture.',
    hrs: 8,
    resource: article(
      'Test-Driven Development',
      'https://martinfowler.com/bliki/TestDrivenDevelopment.html',
    ),
  },
  {
    name: 'Monolithic Apps',
    desc: 'Build maintainable modular monoliths with clear internal boundaries, simple deployment, shared data, and incremental extraction paths.',
    hrs: 7,
    resource: article('Monolith First', 'https://martinfowler.com/bliki/MonolithFirst.html'),
  },
  {
    name: 'Serverless',
    desc: 'Understand functions-as-a-service, event triggers, cold starts, managed services, scaling behavior, and vendor tradeoffs.',
    hrs: 8,
    resource: article(
      'Serverless Architecture',
      'https://martinfowler.com/articles/serverless.html',
    ),
  },
  {
    name: 'Microservices',
    desc: 'Understand service boundaries, independent deployments, distributed data, network failures, observability, and operational costs.',
    hrs: 12,
    resource: article('Microservices', 'https://martinfowler.com/articles/microservices.html'),
  },
  {
    name: 'Service Mesh',
    desc: 'Understand sidecars, service-to-service traffic, retries, mTLS, telemetry, policy, and microservice operational complexity.',
    hrs: 7,
    resource: article(
      'What is a Service Mesh?',
      'https://www.redhat.com/en/topics/microservices/what-is-a-service-mesh',
    ),
  },
  {
    name: 'SOA',
    desc: 'Understand service-oriented architecture, service contracts, reusable enterprise services, governance, and integration tradeoffs.',
    hrs: 5,
    resource: article('SOA', 'https://www.ibm.com/topics/soa'),
  },
  {
    name: 'Twelve Factor Apps',
    desc: 'Apply twelve-factor principles for config, dependencies, backing services, logs, processes, disposability, and environment parity.',
    hrs: 8,
    resource: article('The Twelve-Factor App', 'https://12factor.net/'),
  },
  {
    name: 'RabbitMQ',
    desc: 'Use exchanges, queues, bindings, routing keys, acknowledgements, durability, retries, and worker queue patterns.',
    hrs: 8,
    resource: docs('RabbitMQ Documentation', 'https://www.rabbitmq.com/docs'),
  },
  {
    name: 'Kafka',
    desc: 'Use topics, partitions, offsets, consumer groups, retention, event streaming, ordering, and high-throughput pipelines.',
    hrs: 10,
    resource: docs('Kafka Documentation', 'https://kafka.apache.org/documentation/'),
  },
  {
    name: 'WebSockets',
    desc: 'Build bidirectional realtime APIs, manage connections, rooms, heartbeats, reconnection, scaling, and authentication.',
    hrs: 8,
    resource: docs(
      'WebSocket API',
      'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API',
    ),
  },
  {
    name: 'Server Sent Events',
    desc: 'Use one-way event streams for notifications, progress updates, live dashboards, reconnect behavior, and HTTP streaming.',
    hrs: 5,
    resource: docs(
      'Server-Sent Events',
      'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events',
    ),
  },
  {
    name: 'Nginx',
    desc: 'Configure Nginx for reverse proxying, upstreams, TLS, gzip, static files, rate limiting, and request forwarding.',
    hrs: 8,
    resource: docs('Nginx Documentation', 'https://nginx.org/en/docs/'),
  },
  {
    name: 'Caddy',
    desc: 'Use Caddy for automatic HTTPS, reverse proxying, static files, simple configuration, and backend service routing.',
    hrs: 5,
    resource: docs('Caddy Documentation', 'https://caddyserver.com/docs/'),
  },
  {
    name: 'Apache',
    desc: 'Understand Apache HTTP Server modules, virtual hosts, reverse proxying, TLS, and legacy hosting setups.',
    hrs: 5,
    resource: docs('Apache HTTP Server Documentation', 'https://httpd.apache.org/docs/'),
  },
  {
    name: 'MS IIS',
    desc: 'Understand IIS hosting, application pools, bindings, reverse proxy scenarios, TLS, and Windows deployment basics.',
    hrs: 5,
    resource: docs('IIS Documentation', 'https://learn.microsoft.com/en-us/iis/'),
  },
  {
    name: 'LXC',
    desc: 'Understand Linux containers with LXC, OS-level isolation, container lifecycle, networking, and Docker differences.',
    hrs: 5,
    resource: docs('Linux Containers', 'https://linuxcontainers.org/lxc/documentation/'),
  },
  {
    name: 'Containerization vs Virtualization',
    desc: 'Compare containers and virtual machines by isolation model, startup time, resource usage, images, kernels, and deployment tradeoffs.',
    hrs: 5,
    resource: article(
      'Containers vs Virtual Machines',
      'https://www.docker.com/resources/what-container/',
    ),
  },
  {
    name: 'Docker',
    desc: 'Build Docker images, write Dockerfiles, run containers, manage networks, volumes, Compose files, and production-friendly images.',
    hrs: 12,
    resource: docs('Docker Get Started', 'https://docs.docker.com/get-started/'),
  },
  {
    name: 'Kubernetes',
    desc: 'Understand pods, deployments, services, config maps, secrets, ingress, health probes, scaling, and cluster basics.',
    hrs: 14,
    resource: docs('Kubernetes Basics', 'https://kubernetes.io/docs/tutorials/kubernetes-basics/'),
  },
  {
    name: 'Elasticsearch',
    desc: 'Model documents, mappings, indexes, analyzers, queries, aggregations, shards, replicas, and search performance.',
    hrs: 10,
    resource: docs(
      'Elasticsearch Guide',
      'https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html',
    ),
  },
  {
    name: 'Solr',
    desc: 'Understand Solr collections, schemas, indexing, query syntax, faceting, and full-text search use cases.',
    hrs: 6,
    resource: docs('Apache Solr Guide', 'https://solr.apache.org/guide/'),
  },
  {
    name: 'MongoDB',
    desc: 'Use MongoDB collections, documents, indexes, aggregation pipelines, schema design, transactions, and backend integration.',
    hrs: 10,
    resource: docs('MongoDB Manual', 'https://www.mongodb.com/docs/manual/'),
  },
  {
    name: 'CouchDB',
    desc: 'Understand CouchDB document storage, replication, conflict handling, HTTP API access, and offline-first use cases.',
    hrs: 6,
    resource: docs('CouchDB Documentation', 'https://docs.couchdb.org/'),
  },
  {
    name: 'Neo4j',
    desc: 'Use graph nodes, relationships, Cypher queries, indexes, traversals, and graph-backed backend features.',
    hrs: 7,
    resource: docs('Neo4j Documentation', 'https://neo4j.com/docs/'),
  },
  {
    name: 'DynamoDB',
    desc: 'Model DynamoDB tables, partition keys, sort keys, secondary indexes, access patterns, and serverless data workloads.',
    hrs: 8,
    resource: docs('DynamoDB Documentation', 'https://docs.aws.amazon.com/dynamodb/'),
  },
  {
    name: 'Firebase',
    desc: 'Use Firebase managed backend services, realtime data sync, authentication integration, security rules, and product tradeoffs.',
    hrs: 5,
    resource: docs('Firebase Documentation', 'https://firebase.google.com/docs'),
  },
  {
    name: 'RethinkDB',
    desc: 'Understand RethinkDB realtime changefeeds, document modeling, query patterns, and historical realtime database use cases.',
    hrs: 4,
    resource: docs('RethinkDB Documentation', 'https://rethinkdb.com/docs/'),
  },
  {
    name: 'SQLite',
    desc: 'Use SQLite for embedded storage, local development, small applications, migrations, transactions, and server-database tradeoffs.',
    hrs: 5,
    resource: docs('SQLite Documentation', 'https://www.sqlite.org/docs.html'),
  },
  {
    name: 'Influx DB',
    desc: 'Use InfluxDB-style time-series storage for metrics, measurements, tags, retention policies, and time-window analysis.',
    hrs: 5,
    resource: docs('InfluxDB Documentation', 'https://docs.influxdata.com/'),
  },
  {
    name: 'TimeScale',
    desc: 'Use Timescale-style PostgreSQL time-series storage with hypertables, compression, retention, and time-window queries.',
    hrs: 5,
    resource: docs('Timescale Documentation', 'https://docs.timescale.com/'),
  },
  {
    name: 'Cassandra',
    desc: 'Understand Cassandra partition keys, clustering columns, consistency levels, replication, and write-heavy distributed workloads.',
    hrs: 8,
    resource: docs('Cassandra Documentation', 'https://cassandra.apache.org/doc/latest/'),
  },
  {
    name: 'AWS Neptune',
    desc: 'Understand AWS Neptune as a managed graph database for relationship-heavy data, Gremlin, SPARQL, and graph workloads.',
    hrs: 5,
    resource: docs('Amazon Neptune Documentation', 'https://docs.aws.amazon.com/neptune/'),
  },
  {
    name: 'Real-Time Data',
    desc: 'Design backend systems for live updates, streaming events, collaboration, notifications, and low-latency state changes.',
    hrs: 7,
    resource: docs(
      'WebSocket API',
      'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API',
    ),
  },
  {
    name: 'Long Polling',
    desc: 'Implement long polling for near-realtime updates where persistent WebSocket connections are not suitable.',
    hrs: 4,
    resource: article('Long Polling', 'https://javascript.info/long-polling'),
  },
  {
    name: 'Short Polling',
    desc: 'Use short polling for simple periodic updates, understand load tradeoffs, stale data, and when to choose better realtime transports.',
    hrs: 3,
    resource: article('Polling', 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API'),
  },
  {
    name: 'Basic Infrastructure Knowledge',
    desc: 'Learn infrastructure basics for backend engineers: servers, networking, DNS, TLS, containers, deployments, logs, and monitoring.',
    hrs: 8,
    resource: article('The Twelve-Factor App', 'https://12factor.net/'),
  },
  {
    name: 'Graceful Degradation',
    desc: 'Design systems that continue partial service during dependency failures, overload, degraded dependencies, or capacity limits.',
    hrs: 6,
    resource: article(
      'Graceful Degradation',
      'https://learn.microsoft.com/en-us/azure/architecture/framework/resiliency/overview',
    ),
  },
  {
    name: 'Throttling',
    desc: 'Control request rates and resource usage through throttling policies, quotas, token buckets, and overload protection.',
    hrs: 6,
    resource: article(
      'Rate Limiting Pattern',
      'https://learn.microsoft.com/en-us/azure/architecture/patterns/rate-limiting-pattern',
    ),
  },
  {
    name: 'Backpressure',
    desc: 'Protect systems from overload using queues, bounded concurrency, stream backpressure, admission control, and load shedding.',
    hrs: 7,
    resource: docs(
      'Backpressuring in Streams',
      'https://nodejs.org/en/learn/modules/backpressuring-in-streams',
    ),
  },
  {
    name: 'Loadshifting',
    desc: 'Shift work away from peak paths using queues, scheduled jobs, asynchronous processing, batching, and delayed execution.',
    hrs: 5,
    resource: article(
      'Queue-Based Load Leveling',
      'https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling',
    ),
  },
  {
    name: 'Circuit Breaker',
    desc: 'Use circuit breakers, timeouts, fallbacks, half-open recovery, and dependency health checks to prevent cascading failures.',
    hrs: 6,
    resource: article(
      'Circuit Breaker Pattern',
      'https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker',
    ),
  },
  {
    name: 'Migration Strategies',
    desc: 'Plan backend migrations with expand-contract changes, compatibility windows, feature flags, backfills, rollback paths, and zero-downtime releases.',
    hrs: 8,
    resource: article(
      'Expand and Contract Pattern',
      'https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern',
    ),
  },
  {
    name: 'Types of Scaling',
    desc: 'Compare vertical, horizontal, functional, database, cache, queue-based, and regional scaling strategies.',
    hrs: 6,
    resource: article(
      'Scalability Primer',
      'https://github.com/donnemartin/system-design-primer#scalability',
    ),
  },
  {
    name: 'Metrics logging and other observable items',
    desc: 'Capture metrics, logs, traces, and context fields that help diagnose backend issues when production behavior goes wrong.',
    hrs: 6,
    resource: docs('OpenTelemetry Concepts', 'https://opentelemetry.io/docs/concepts/'),
  },
  {
    name: 'Difference & Usage',
    desc: 'Compare related backend technologies and decide when to use each one based on product constraints, cost, scale, and operational tradeoffs.',
    hrs: 4,
    resource: article(
      'System Design Primer',
      'https://github.com/donnemartin/system-design-primer',
    ),
  },
  {
    name: 'Instrumentation',
    desc: 'Add structured events, counters, histograms, spans, correlation IDs, and business metrics to application code.',
    hrs: 7,
    resource: docs(
      'OpenTelemetry Instrumentation',
      'https://opentelemetry.io/docs/concepts/instrumentation/',
    ),
  },
  {
    name: 'Monitoring',
    desc: 'Monitor services with dashboards, health checks, service-level indicators, alert rules, and incident-focused production signals.',
    hrs: 6,
    resource: docs('Prometheus Overview', 'https://prometheus.io/docs/introduction/overview/'),
  },
  {
    name: 'Telemetry',
    desc: 'Collect and export logs, metrics, and traces with consistent metadata for debugging distributed backend systems.',
    hrs: 6,
    resource: docs('OpenTelemetry Documentation', 'https://opentelemetry.io/docs/'),
  },
  {
    name: 'DevOps',
    desc: 'Understand how backend engineering connects to infrastructure, deployment automation, observability, reliability, and operations.',
    hrs: 8,
    resource: docs('GitHub Actions', 'https://docs.github.com/en/actions'),
  },
];

const prerequisites: [string, string][] = [
  ['What is HTTP?', 'How does the internet work?'],
  ['What is Domain Name?', 'How does the internet work?'],
  ['What is hosting?', 'How does the internet work?'],
  ['DNS and how it works?', 'What is Domain Name?'],
  ['Browsers and how they work?', 'What is HTTP?'],
  ['GitHub', 'Git'],
  ['Bitbucket', 'Git'],
  ['GitLab', 'Git'],
  ['Transactions', 'ACID'],
  ['Migrations', 'PostgreSQL'],
  ['Database Indexes', 'PostgreSQL'],
  ['Profiling Perfor.', 'Database Indexes'],
  ['N+1 Problem', 'ORMs'],
  ['Scaling Databases', 'Database Indexes'],
  ['Data Replication', 'Scaling Databases'],
  ['Sharding Strategies', 'Scaling Databases'],
  ['CAP Theorem', 'Scaling Databases'],
  ['REST', 'What is HTTP?'],
  ['JSON APIs', 'REST'],
  ['Open API Specs', 'REST'],
  ['HATEOAS', 'REST'],
  ['GraphQL', 'JSON APIs'],
  ['gRPC', 'What is HTTP?'],
  ['SOAP', 'What is HTTP?'],
  ['Server Side Caching', 'What is HTTP?'],
  ['Redis', 'Server Side Caching'],
  ['Memcached', 'Server Side Caching'],
  ['CDN', 'Server Side Caching'],
  ['HTTPS', 'SSL/TLS'],
  ['JWT', 'Authentication'],
  ['Basic Authentication', 'Authentication'],
  ['Token Authentication', 'Authentication'],
  ['OAuth', 'Authentication'],
  ['Cookie Based Auth', 'Authentication'],
  ['OpenID', 'OAuth'],
  ['SAML', 'OAuth'],
  ['MD5', 'Hashing Algorithms'],
  ['SHA', 'Hashing Algorithms'],
  ['scrypt', 'Hashing Algorithms'],
  ['bcrypt', 'Hashing Algorithms'],
  ['Authentication', 'bcrypt'],
  ['CORS', 'Browsers and how they work?'],
  ['CSP', 'Web Security'],
  ['Server Security', 'HTTPS'],
  ['OWASP Risks', 'Web Security'],
  ['API Security Best Practices', 'Authentication'],
  ['Integration Testing', 'Unit Testing'],
  ['Functional Testing', 'Integration Testing'],
  ['CI / CD', 'Git'],
  ['Test Driven Development', 'Unit Testing'],
  ['CQRS', 'Domain Driven Design'],
  ['Event Sourcing', 'CQRS'],
  ['Microservices', 'Monolithic Apps'],
  ['Service Mesh', 'Microservices'],
  ['SOA', 'Microservices'],
  ['RabbitMQ', 'Microservices'],
  ['Kafka', 'Microservices'],
  ['WebSockets', 'Real-Time Data'],
  ['Server Sent Events', 'Real-Time Data'],
  ['Long Polling', 'Real-Time Data'],
  ['Short Polling', 'Real-Time Data'],
  ['Nginx', 'What is hosting?'],
  ['Caddy', 'What is hosting?'],
  ['Apache', 'What is hosting?'],
  ['MS IIS', 'What is hosting?'],
  ['Docker', 'Containerization vs Virtualization'],
  ['Kubernetes', 'Docker'],
  ['Elasticsearch', 'JSON APIs'],
  ['Solr', 'JSON APIs'],
  ['MongoDB', 'JSON APIs'],
  ['CouchDB', 'JSON APIs'],
  ['Neo4j', 'JSON APIs'],
  ['DynamoDB', 'JSON APIs'],
  ['Firebase', 'Real-Time Data'],
  ['RethinkDB', 'Real-Time Data'],
  ['TimeScale', 'PostgreSQL'],
  ['Cassandra', 'CAP Theorem'],
  ['AWS Neptune', 'Neo4j'],
  ['Graceful Degradation', 'Failure Modes'],
  ['Throttling', 'Failure Modes'],
  ['Backpressure', 'Failure Modes'],
  ['Circuit Breaker', 'Failure Modes'],
  ['Loadshifting', 'RabbitMQ'],
  ['Types of Scaling', 'Scaling Databases'],
  ['Metrics logging and other observable items', 'Telemetry'],
  ['Instrumentation', 'Telemetry'],
  ['Monitoring', 'Telemetry'],
  ['DevOps', 'CI / CD'],
];

async function main() {
  log('Seeding database...');

  const countResult = await pool.query('SELECT COUNT(*) FROM skills');
  const count = parseInt(countResult.rows[0].count, 10);
  log(`Found ${count} existing skills`);

  await pool.query('DELETE FROM quiz_questions');
  await pool.query('DELETE FROM resources');
  await pool.query('DELETE FROM skill_prerequisites');
  await pool.query('DELETE FROM skills');
  log('Cleared skill catalog data');

  const createdSkills: Array<{ id: string; name: string }> = [];

  for (const skill of backendSkills) {
    const result = await pool.query(
      `INSERT INTO skills
        (id, name, description, default_estimated_hours, role_category, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
       RETURNING id, name`,
      [skill.name, skill.desc, skill.hrs, ROLE_CATEGORY],
    );

    createdSkills.push({ id: result.rows[0].id, name: result.rows[0].name });
  }

  log(`Created ${createdSkills.length} BACKEND leaf skills`);

  const skillMap = new Map(createdSkills.map((skill) => [skill.name, skill.id]));
  let createdPrerequisites = 0;

  for (const [skill, prerequisite] of prerequisites) {
    const skillId = skillMap.get(skill);
    const prerequisiteSkillId = skillMap.get(prerequisite);

    if (!skillId || !prerequisiteSkillId) {
      warn(`Skipping missing prerequisite pair: ${skill} <- ${prerequisite}`);
      continue;
    }

    await pool.query(
      'INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id) VALUES ($1, $2)',
      [skillId, prerequisiteSkillId],
    );
    createdPrerequisites += 1;
  }

  log(`Created ${createdPrerequisites} advisory prerequisite links`);

  for (const skill of backendSkills) {
    const skillId = skillMap.get(skill.name);
    if (!skillId) continue;

    await pool.query(
      `INSERT INTO resources
        (skill_id, title, url, resource_type, is_free, is_primary, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [skillId, skill.resource.title, skill.resource.url, skill.resource.type, true, true],
    );
  }

  log(`Created ${backendSkills.length} primary resources`);

  log('Quiz questions will be generated lazily on first request');

  await prisma.$disconnect();
  await pool.end();
  log('Seeding complete!');
}

main().catch(async (error) => {
  warn(String(error));
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
