-- =============================================
-- DevOps Learning Platform - Seed Data
-- =============================================
-- This file populates initial data for testing
-- Run this AFTER supabase-schema.sql

-- =============================================
-- 1. AWS SERVICES REGISTRY
-- =============================================

INSERT INTO public.aws_services (service_key, service_name, official_name, service_category, service_subcategory, description, official_url, documentation_url, learning_priority, beginner_friendly) VALUES
-- Compute Services
('ec2', 'EC2', 'Amazon Elastic Compute Cloud', 'compute', 'virtual-servers', 'Secure and resizable compute capacity for virtually any workload', 'https://aws.amazon.com/ec2/', 'https://docs.aws.amazon.com/ec2/', 10, true),
('lambda', 'Lambda', 'AWS Lambda', 'compute', 'serverless', 'Run code without thinking about servers or clusters', 'https://aws.amazon.com/lambda/', 'https://docs.aws.amazon.com/lambda/', 9, true),
('ecs', 'ECS', 'Amazon Elastic Container Service', 'compute', 'containers', 'Highly secure, reliable, and scalable way to run containers', 'https://aws.amazon.com/ecs/', 'https://docs.aws.amazon.com/ecs/', 8, false),
('eks', 'EKS', 'Amazon Elastic Kubernetes Service', 'compute', 'containers', 'The most trusted way to run Kubernetes', 'https://aws.amazon.com/eks/', 'https://docs.aws.amazon.com/eks/', 8, false),

-- Storage Services
('s3', 'S3', 'Amazon Simple Storage Service', 'storage', 'object-storage', 'Object storage built to retrieve any amount of data from anywhere', 'https://aws.amazon.com/s3/', 'https://docs.aws.amazon.com/s3/', 10, true),
('ebs', 'EBS', 'Amazon Elastic Block Store', 'storage', 'block-storage', 'Easy to use, high performance block storage', 'https://aws.amazon.com/ebs/', 'https://docs.aws.amazon.com/ebs/', 7, true),
('efs', 'EFS', 'Amazon Elastic File System', 'storage', 'file-storage', 'Serverless, fully elastic file storage', 'https://aws.amazon.com/efs/', 'https://docs.aws.amazon.com/efs/', 6, false),

-- Database Services
('rds', 'RDS', 'Amazon Relational Database Service', 'database', 'relational', 'Set up, operate, and scale a relational database', 'https://aws.amazon.com/rds/', 'https://docs.aws.amazon.com/rds/', 9, true),
('dynamodb', 'DynamoDB', 'Amazon DynamoDB', 'database', 'nosql', 'Fast, flexible NoSQL database service', 'https://aws.amazon.com/dynamodb/', 'https://docs.aws.amazon.com/dynamodb/', 8, true),
('elasticache', 'ElastiCache', 'Amazon ElastiCache', 'database', 'caching', 'Managed in-memory data store service', 'https://aws.amazon.com/elasticache/', 'https://docs.aws.amazon.com/elasticache/', 7, false),

-- Networking Services
('vpc', 'VPC', 'Amazon Virtual Private Cloud', 'networking', 'network', 'Isolated cloud resources', 'https://aws.amazon.com/vpc/', 'https://docs.aws.amazon.com/vpc/', 9, true),
('route53', 'Route 53', 'Amazon Route 53', 'networking', 'dns', 'Scalable domain name system (DNS)', 'https://aws.amazon.com/route53/', 'https://docs.aws.amazon.com/route53/', 7, true),
('cloudfront', 'CloudFront', 'Amazon CloudFront', 'networking', 'cdn', 'Global content delivery network', 'https://aws.amazon.com/cloudfront/', 'https://docs.aws.amazon.com/cloudfront/', 7, true),
('elb', 'ELB', 'Elastic Load Balancing', 'networking', 'load-balancing', 'Distribute network traffic to improve application scalability', 'https://aws.amazon.com/elasticloadbalancing/', 'https://docs.aws.amazon.com/elasticloadbalancing/', 8, true),

-- Security & Identity
('iam', 'IAM', 'AWS Identity and Access Management', 'security', 'identity', 'Securely manage identities and access to AWS services', 'https://aws.amazon.com/iam/', 'https://docs.aws.amazon.com/iam/', 10, true),
('kms', 'KMS', 'AWS Key Management Service', 'security', 'encryption', 'Create and control keys used to encrypt data', 'https://aws.amazon.com/kms/', 'https://docs.aws.amazon.com/kms/', 7, false),
('secrets-manager', 'Secrets Manager', 'AWS Secrets Manager', 'security', 'secrets', 'Rotate, manage, and retrieve secrets', 'https://aws.amazon.com/secrets-manager/', 'https://docs.aws.amazon.com/secretsmanager/', 8, true),

-- Developer Tools
('codecommit', 'CodeCommit', 'AWS CodeCommit', 'developer-tools', 'source-control', 'Securely host highly scalable private Git repositories', 'https://aws.amazon.com/codecommit/', 'https://docs.aws.amazon.com/codecommit/', 6, true),
('codebuild', 'CodeBuild', 'AWS CodeBuild', 'developer-tools', 'ci-cd', 'Build and test code with continuous scaling', 'https://aws.amazon.com/codebuild/', 'https://docs.aws.amazon.com/codebuild/', 8, true),
('codedeploy', 'CodeDeploy', 'AWS CodeDeploy', 'developer-tools', 'ci-cd', 'Automate code deployments', 'https://aws.amazon.com/codedeploy/', 'https://docs.aws.amazon.com/codedeploy/', 8, true),
('codepipeline', 'CodePipeline', 'AWS CodePipeline', 'developer-tools', 'ci-cd', 'Release pipelines for fast and reliable updates', 'https://aws.amazon.com/codepipeline/', 'https://docs.aws.amazon.com/codepipeline/', 9, true),

-- Monitoring & Management
('cloudwatch', 'CloudWatch', 'Amazon CloudWatch', 'management', 'monitoring', 'Observability of your AWS resources', 'https://aws.amazon.com/cloudwatch/', 'https://docs.aws.amazon.com/cloudwatch/', 10, true),
('cloudtrail', 'CloudTrail', 'AWS CloudTrail', 'management', 'logging', 'Track user activity and API usage', 'https://aws.amazon.com/cloudtrail/', 'https://docs.aws.amazon.com/cloudtrail/', 8, true),
('systems-manager', 'Systems Manager', 'AWS Systems Manager', 'management', 'operations', 'Gain operational insights and take action', 'https://aws.amazon.com/systems-manager/', 'https://docs.aws.amazon.com/systems-manager/', 7, false),

-- Infrastructure as Code
('cloudformation', 'CloudFormation', 'AWS CloudFormation', 'management', 'infrastructure', 'Model and provision all your resources via code', 'https://aws.amazon.com/cloudformation/', 'https://docs.aws.amazon.com/cloudformation/', 9, true)

ON CONFLICT (service_key) DO NOTHING;

-- =============================================
-- 2. AWS CONTENT SOURCES
-- =============================================

INSERT INTO public.aws_content_sources (source_type, source_name, source_url, crawl_frequency_hours, rss_feed_url, is_active, requests_per_minute) VALUES
-- Blog Sources
('blog', 'AWS Architecture Blog', 'https://aws.amazon.com/blogs/architecture/', 24, 'https://aws.amazon.com/blogs/architecture/feed/', true, 10),
('blog', 'AWS DevOps Blog', 'https://aws.amazon.com/blogs/devops/', 24, 'https://aws.amazon.com/blogs/devops/feed/', true, 10),
('blog', 'AWS Security Blog', 'https://aws.amazon.com/blogs/security/', 24, 'https://aws.amazon.com/blogs/security/feed/', true, 10),
('blog', 'AWS Compute Blog', 'https://aws.amazon.com/blogs/compute/', 24, 'https://aws.amazon.com/blogs/compute/feed/', true, 10),
('blog', 'AWS Containers Blog', 'https://aws.amazon.com/blogs/containers/', 24, 'https://aws.amazon.com/blogs/containers/feed/', true, 10),
('blog', 'AWS Database Blog', 'https://aws.amazon.com/blogs/database/', 24, 'https://aws.amazon.com/blogs/database/feed/', true, 10),

-- Documentation Source
('docs', 'AWS Documentation', 'https://docs.aws.amazon.com/', 168, 'https://docs.aws.amazon.com/sitemap_index.xml', true, 1),

-- Video Sources
('video', 'AWS YouTube Channel', 'https://www.youtube.com/@amazonwebservices', 24, NULL, true, 10)

ON CONFLICT DO NOTHING;

-- =============================================
-- 3. ROADMAP: DevOps Foundation Level 1
-- =============================================

INSERT INTO public.roadmaps (
    title,
    slug,
    description,
    long_description,
    difficulty_level,
    category,
    subcategory,
    estimated_weeks,
    estimated_hours,
    prerequisites,
    learning_objectives,
    career_outcomes,
    total_modules,
    total_topics,
    is_published,
    is_featured,
    cover_image,
    meta_title,
    meta_description
) VALUES (
    'DevOps Foundation Level 1',
    'devops-foundation-level-1',
    'Start your DevOps journey from absolute beginner to confident practitioner. Learn Docker, Linux, CI/CD basics, and essential DevOps practices.',
    'This comprehensive foundation course will take you from zero DevOps knowledge to being able to containerize applications, manage Linux servers, and set up basic CI/CD pipelines. Perfect for backend developers, fresh graduates, or anyone looking to transition into DevOps roles.',
    'foundation-1',
    'devops',
    'fundamentals',
    4,
    60,
    ARRAY['Basic programming knowledge', 'Familiarity with command line'],
    ARRAY[
        'Understand core DevOps principles and culture',
        'Master Linux command line and system administration',
        'Containerize applications with Docker',
        'Implement basic CI/CD pipelines',
        'Apply security and monitoring best practices'
    ],
    ARRAY[
        'Junior DevOps Engineer',
        'Platform Engineer (Entry Level)',
        'Site Reliability Engineer (Junior)',
        'Build & Release Engineer'
    ],
    4,
    0, -- Will be updated as topics are added
    true,
    true,
    NULL,
    'DevOps Foundation Level 1 - Complete Beginner Course',
    'Master DevOps fundamentals with Docker, Linux, CI/CD, and best practices. Perfect for beginners.'
)
ON CONFLICT (slug) DO NOTHING
RETURNING id;

-- Store the roadmap ID for use in modules
DO $$
DECLARE
    roadmap_id_l1 UUID;
    module_id_1 UUID;
    module_id_2 UUID;
    module_id_3 UUID;
    module_id_4 UUID;
    topic_id UUID;
BEGIN
    -- Get the roadmap ID
    SELECT id INTO roadmap_id_l1 FROM public.roadmaps WHERE slug = 'devops-foundation-level-1';

    -- Module 1: DevOps Mindset & Culture
    INSERT INTO public.modules (roadmap_id, title, description, learning_objectives, order_index, estimated_hours, module_type)
    VALUES (
        roadmap_id_l1,
        'DevOps Mindset & Culture',
        'Understand the core principles, culture, and practices that make DevOps successful. Learn collaboration techniques and common pitfalls.',
        ARRAY[
            'Understand DevOps principles and values',
            'Learn collaboration best practices',
            'Identify common anti-patterns',
            'Understand continuous improvement mindset'
        ],
        1,
        10,
        'standard'
    )
    RETURNING id INTO module_id_1;

    -- Topics for Module 1
    INSERT INTO public.topics (module_id, title, description, order_index, topic_type, difficulty_level, estimated_minutes, has_lab)
    VALUES
    (module_id_1, 'What is DevOps?', 'Introduction to DevOps principles, history, and core concepts', 1, 'theory', 'beginner', 30, false),
    (module_id_1, 'DevOps Culture & Collaboration', 'Building effective teams and fostering collaboration between Dev and Ops', 2, 'theory', 'beginner', 45, false),
    (module_id_1, 'Common DevOps Practices', 'Overview of CI/CD, Infrastructure as Code, Monitoring, and more', 3, 'theory', 'beginner', 60, false),
    (module_id_1, 'DevOps Anti-patterns', 'Common mistakes and how to avoid them', 4, 'theory', 'beginner', 30, false);

    -- Module 2: Linux System Administration
    INSERT INTO public.modules (roadmap_id, title, description, learning_objectives, order_index, estimated_hours, module_type)
    VALUES (
        roadmap_id_l1,
        'Linux System Administration',
        'Master the Linux command line, file systems, process management, networking, and basic security hardening.',
        ARRAY[
            'Navigate Linux file system efficiently',
            'Manage processes and services',
            'Configure networking',
            'Implement basic security measures',
            'Write shell scripts for automation'
        ],
        2,
        15,
        'standard'
    )
    RETURNING id INTO module_id_2;

    -- Topics for Module 2
    INSERT INTO public.topics (module_id, title, description, order_index, topic_type, difficulty_level, estimated_minutes, has_lab, has_submission)
    VALUES
    (module_id_2, 'Linux Basics & File System', 'Navigate directories, manage files, understand permissions', 1, 'practice', 'beginner', 90, true, false),
    (module_id_2, 'Process Management', 'View, manage, and control processes and services', 2, 'practice', 'beginner', 60, true, false),
    (module_id_2, 'User & Permission Management', 'Create users, manage groups, set file permissions', 3, 'practice', 'beginner', 60, true, false),
    (module_id_2, 'Package Management', 'Install, update, and manage software packages', 4, 'practice', 'beginner', 45, true, false),
    (module_id_2, 'Basic Networking', 'Configure network interfaces, understand DNS, use network tools', 5, 'practice', 'intermediate', 75, true, false),
    (module_id_2, 'Shell Scripting Basics', 'Write bash scripts for automation tasks', 6, 'practice', 'beginner', 90, true, true);

    -- Module 3: Containerization with Docker
    INSERT INTO public.modules (roadmap_id, title, description, learning_objectives, order_index, estimated_hours, module_type)
    VALUES (
        roadmap_id_l1,
        'Containerization with Docker',
        'Learn Docker fundamentals, create Dockerfiles, manage containers, and use Docker Compose for multi-container applications.',
        ARRAY[
            'Understand container concepts vs VMs',
            'Write efficient Dockerfiles',
            'Manage Docker images and containers',
            'Use Docker Compose for multi-container apps',
            'Implement Docker best practices'
        ],
        3,
        25,
        'standard'
    )
    RETURNING id INTO module_id_3;

    -- Topics for Module 3
    INSERT INTO public.topics (module_id, title, description, order_index, topic_type, difficulty_level, estimated_minutes, has_lab, has_submission)
    VALUES
    (module_id_3, 'Introduction to Containers', 'What are containers? Benefits and use cases', 1, 'theory', 'beginner', 30, false, false),
    (module_id_3, 'Docker Installation & Setup', 'Install Docker on different platforms, verify installation', 2, 'practice', 'beginner', 30, true, false),
    (module_id_3, 'Docker Images & Containers', 'Pull images, run containers, manage container lifecycle', 3, 'practice', 'beginner', 90, true, false),
    (module_id_3, 'Writing Dockerfiles', 'Create custom Docker images with Dockerfile', 4, 'practice', 'beginner', 120, true, true),
    (module_id_3, 'Multi-stage Builds', 'Optimize Docker images with multi-stage builds', 5, 'practice', 'intermediate', 90, true, true),
    (module_id_3, 'Docker Networking', 'Connect containers, expose ports, use networks', 6, 'practice', 'intermediate', 60, true, false),
    (module_id_3, 'Docker Volumes', 'Persist data with volumes and bind mounts', 7, 'practice', 'beginner', 60, true, false),
    (module_id_3, 'Docker Compose', 'Define and run multi-container applications', 8, 'practice', 'intermediate', 120, true, true),
    (module_id_3, 'Docker Best Practices', 'Security, optimization, and production readiness', 9, 'theory', 'intermediate', 45, false, false);

    -- Module 4: Basic Security & Monitoring
    INSERT INTO public.modules (roadmap_id, title, description, learning_objectives, order_index, estimated_hours, module_type)
    VALUES (
        roadmap_id_l1,
        'Basic Security & Monitoring',
        'Implement essential security practices and set up basic monitoring for your applications and infrastructure.',
        ARRAY[
            'Implement security scanning',
            'Set up basic monitoring with CloudWatch',
            'Configure log management',
            'Understand security best practices'
        ],
        4,
        10,
        'standard'
    )
    RETURNING id INTO module_id_4;

    -- Topics for Module 4
    INSERT INTO public.topics (module_id, title, description, order_index, topic_type, difficulty_level, estimated_minutes, has_lab, has_submission)
    VALUES
    (module_id_4, 'Security Fundamentals', 'Core security concepts for DevOps', 1, 'theory', 'beginner', 45, false, false),
    (module_id_4, 'Container Security Scanning', 'Scan Docker images for vulnerabilities', 2, 'practice', 'beginner', 60, true, false),
    (module_id_4, 'Basic Monitoring Setup', 'Set up CloudWatch for monitoring EC2 and containers', 3, 'practice', 'beginner', 90, true, false),
    (module_id_4, 'Log Management Basics', 'Centralize and analyze logs', 4, 'practice', 'beginner', 60, true, false);

    -- Update roadmap total_topics count
    UPDATE public.roadmaps
    SET total_topics = (
        SELECT COUNT(t.id)
        FROM public.topics t
        JOIN public.modules m ON m.id = t.module_id
        WHERE m.roadmap_id = roadmap_id_l1
    )
    WHERE id = roadmap_id_l1;

END $$;

-- =============================================
-- 4. ROADMAP: DevOps Foundation Level 2
-- =============================================

INSERT INTO public.roadmaps (
    title,
    slug,
    description,
    long_description,
    difficulty_level,
    category,
    subcategory,
    estimated_weeks,
    estimated_hours,
    prerequisites,
    learning_objectives,
    career_outcomes,
    total_modules,
    total_topics,
    is_published,
    is_featured,
    meta_title,
    meta_description
) VALUES (
    'DevOps Foundation Level 2',
    'devops-foundation-level-2',
    'Build on your DevOps foundation with advanced CI/CD, Kubernetes, Infrastructure as Code, and production-grade monitoring.',
    'Take your DevOps skills to the next level with container orchestration, advanced CI/CD pipelines, Infrastructure as Code with Terraform, and comprehensive monitoring solutions.',
    'foundation-2',
    'devops',
    'advanced-fundamentals',
    4,
    60,
    ARRAY['DevOps Foundation Level 1 completed', 'Docker proficiency', 'Basic Linux administration'],
    ARRAY[
        'Implement advanced CI/CD pipelines',
        'Deploy and manage Kubernetes clusters',
        'Infrastructure as Code with Terraform/CloudFormation',
        'Advanced monitoring and observability',
        'Production security practices'
    ],
    ARRAY[
        'DevOps Engineer (Mid-level)',
        'Platform Engineer',
        'Site Reliability Engineer',
        'Cloud Engineer'
    ],
    4,
    0,
    true,
    true,
    'DevOps Foundation Level 2 - Advanced DevOps Course',
    'Master advanced DevOps with Kubernetes, Terraform, CI/CD, and production monitoring.'
)
ON CONFLICT (slug) DO NOTHING;

-- Add modules for Level 2 (simplified for seed data)
DO $$
DECLARE
    roadmap_id_l2 UUID;
    module_id UUID;
BEGIN
    SELECT id INTO roadmap_id_l2 FROM public.roadmaps WHERE slug = 'devops-foundation-level-2';

    -- Module 1: CI/CD Fundamentals
    INSERT INTO public.modules (roadmap_id, title, description, order_index, estimated_hours, module_type)
    VALUES (roadmap_id_l2, 'CI/CD Fundamentals', 'Build robust CI/CD pipelines with GitLab CI, GitHub Actions, and AWS CodePipeline', 1, 15, 'standard')
    RETURNING id INTO module_id;

    INSERT INTO public.topics (module_id, title, description, order_index, topic_type, difficulty_level, estimated_minutes)
    VALUES
    (module_id, 'CI/CD Concepts', 'Understanding continuous integration and continuous deployment', 1, 'theory', 'beginner', 45),
    (module_id, 'GitLab CI/CD', 'Build pipelines with GitLab CI', 2, 'practice', 'intermediate', 120),
    (module_id, 'GitHub Actions', 'Automate workflows with GitHub Actions', 3, 'practice', 'intermediate', 120);

    -- Module 2: Container Orchestration
    INSERT INTO public.modules (roadmap_id, title, description, order_index, estimated_hours, module_type)
    VALUES (roadmap_id_l2, 'Container Orchestration with Kubernetes', 'Deploy and manage containerized applications at scale', 2, 25, 'standard')
    RETURNING id INTO module_id;

    INSERT INTO public.topics (module_id, title, description, order_index, topic_type, difficulty_level, estimated_minutes)
    VALUES
    (module_id, 'Kubernetes Architecture', 'Understanding K8s components and architecture', 1, 'theory', 'intermediate', 60),
    (module_id, 'Pods and Deployments', 'Deploy applications on Kubernetes', 2, 'practice', 'intermediate', 120),
    (module_id, 'Services and Networking', 'Expose applications and configure networking', 3, 'practice', 'intermediate', 90);

    -- Update total_topics
    UPDATE public.roadmaps
    SET total_topics = (
        SELECT COUNT(t.id)
        FROM public.topics t
        JOIN public.modules m ON m.id = t.module_id
        WHERE m.roadmap_id = roadmap_id_l2
    )
    WHERE id = roadmap_id_l2;
END $$;

-- =============================================
-- SEED DATA COMPLETE
-- =============================================
-- You can now browse roadmaps and start learning!
