/**
 * Server Templates
 * Pre-configured templates for common MCP servers
 */

import type { StdioMCPServerConfig, SSEMCPServerConfig, HTTPMCPServerConfig } from '@/lib/types';

// Template config types without the auto-generated fields
type StdioTemplateConfig = Omit<StdioMCPServerConfig, 'id' | 'createdAt' | 'updatedAt'>;
type SSETemplateConfig = Omit<SSEMCPServerConfig, 'id' | 'createdAt' | 'updatedAt'>;
type HTTPTemplateConfig = Omit<HTTPMCPServerConfig, 'id' | 'createdAt' | 'updatedAt'>;
type TemplateConfig = StdioTemplateConfig | SSETemplateConfig | HTTPTemplateConfig;

export interface ServerTemplate {
  id: string;
  name: string;
  description: string;
  category: 'filesystem' | 'database' | 'api' | 'development' | 'other';
  config: TemplateConfig;
  requiresConfiguration?: string[]; // Fields that need user input
}

export const serverTemplates: ServerTemplate[] = [
  {
    id: 'filesystem',
    name: 'Filesystem Server',
    description: 'Access and manipulate files on your local filesystem',
    category: 'filesystem',
    config: {
      name: 'Filesystem',
      description: 'Local filesystem access',
      transportType: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
    },
    requiresConfiguration: ['args'], // User needs to specify the directory
  },
  {
    id: 'github',
    name: 'GitHub Server',
    description: 'Interact with GitHub repositories and issues',
    category: 'api',
    config: {
      name: 'GitHub',
      description: 'GitHub API integration',
      transportType: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_TOKEN: '',
      },
    },
    requiresConfiguration: ['env.GITHUB_TOKEN'],
  },
  {
    id: 'postgres',
    name: 'PostgreSQL Server',
    description: 'Query and manage PostgreSQL databases',
    category: 'database',
    config: {
      name: 'PostgreSQL',
      description: 'PostgreSQL database access',
      transportType: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres'],
      env: {
        POSTGRES_CONNECTION_STRING: '',
      },
    },
    requiresConfiguration: ['env.POSTGRES_CONNECTION_STRING'],
  },
  {
    id: 'sqlite',
    name: 'SQLite Server',
    description: 'Query SQLite databases',
    category: 'database',
    config: {
      name: 'SQLite',
      description: 'SQLite database access',
      transportType: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sqlite', 'database.db'],
    },
    requiresConfiguration: ['args'], // User needs to specify the database file
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer Server',
    description: 'Browser automation and web scraping',
    category: 'development',
    config: {
      name: 'Puppeteer',
      description: 'Browser automation',
      transportType: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    },
  },
  {
    id: 'fetch',
    name: 'Fetch Server',
    description: 'Make HTTP requests to external APIs',
    category: 'api',
    config: {
      name: 'Fetch',
      description: 'HTTP request capabilities',
      transportType: 'stdio',

      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-fetch'],
    },
  },
  {
    id: 'memory',
    name: 'Memory Server',
    description: 'Persistent memory storage for conversations',
    category: 'other',
    config: {
      name: 'Memory',
      description: 'Conversation memory',
      transportType: 'stdio',

      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
    },
  },
  {
    id: 'slack',
    name: 'Slack Server',
    description: 'Send messages and interact with Slack',
    category: 'api',
    config: {
      name: 'Slack',
      description: 'Slack integration',
      transportType: 'stdio',

      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-slack'],
      env: {
        SLACK_BOT_TOKEN: '',
      },
    },
    requiresConfiguration: ['env.SLACK_BOT_TOKEN'],
  },
  {
    id: 'google-drive-oauth',
    name: 'Google Drive Server (OAuth)',
    description: 'Access and manage Google Drive files',
    category: 'filesystem',
    config: {
      name: 'Google Drive',
      description: 'Google Drive integration',
      transportType: 'stdio',

      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-gdrive'],
      env: {
        GOOGLE_DRIVE_CREDENTIALS: '',
      },
    },
    requiresConfiguration: ['env.GOOGLE_DRIVE_CREDENTIALS'],
  },
  {
    id: 'custom-sse',
    name: 'Custom SSE Server',
    description: 'Connect to a custom SSE MCP server',
    category: 'other',
    config: {
      name: 'Custom SSE Server',
      description: 'Custom SSE server',
      transportType: 'sse',

      url: 'http://localhost:3001/sse',
    },
    requiresConfiguration: ['url'],
  },
  {
    id: 'custom-http',
    name: 'Custom HTTP Server',
    description: 'Connect to a custom HTTP MCP server with authentication',
    category: 'api',
    config: {
      name: 'Custom HTTP Server',
      description: 'HTTP-based MCP server',
      transportType: 'http',

      url: 'https://api.example.com/mcp',
      method: 'POST',
      timeout: 30000,
    },
    requiresConfiguration: ['url'],
  },
  {
    id: 'gitlab',
    name: 'GitLab Server',
    description: 'Interact with GitLab repositories and merge requests',
    category: 'api',
    config: {
      name: 'GitLab',
      description: 'GitLab API integration',
      transportType: 'stdio',

      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-gitlab'],
      env: {
        GITLAB_PERSONAL_ACCESS_TOKEN: '',
        GITLAB_API_URL: 'https://gitlab.com/api/v4',
      },
    },
    requiresConfiguration: ['env.GITLAB_PERSONAL_ACCESS_TOKEN'],
  },
  {
    id: 'google-drive',
    name: 'Google Drive Server',
    description: 'Access and manage Google Drive files',
    category: 'filesystem',
    config: {
      name: 'Google Drive',
      description: 'Google Drive integration',
      transportType: 'stdio',

      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-google-drive'],
      env: {
        GOOGLE_CLIENT_ID: '',
        GOOGLE_CLIENT_SECRET: '',
      },
    },
    requiresConfiguration: ['env.GOOGLE_CLIENT_ID', 'env.GOOGLE_CLIENT_SECRET'],
  },
  {
    id: 'aws-s3',
    name: 'AWS S3 Server',
    description: 'Access and manage AWS S3 buckets',
    category: 'filesystem',
    config: {
      name: 'AWS S3',
      description: 'AWS S3 integration',
      transportType: 'stdio',

      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-aws-s3'],
      env: {
        AWS_ACCESS_KEY_ID: '',
        AWS_SECRET_ACCESS_KEY: '',
        AWS_REGION: 'us-east-1',
      },
    },
    requiresConfiguration: ['env.AWS_ACCESS_KEY_ID', 'env.AWS_SECRET_ACCESS_KEY'],
  },
  {
    id: 'mongodb',
    name: 'MongoDB Server',
    description: 'Query and manage MongoDB databases',
    category: 'database',
    config: {
      name: 'MongoDB',
      description: 'MongoDB integration',
      transportType: 'stdio',

      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-mongodb', 'mongodb://localhost:27017/mydb'],
    },
    requiresConfiguration: ['args'],
  },
  {
    id: 'redis',
    name: 'Redis Server',
    description: 'Interact with Redis cache',
    category: 'database',
    config: {
      name: 'Redis',
      description: 'Redis integration',
      transportType: 'stdio',

      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-redis', 'redis://localhost:6379'],
    },
    requiresConfiguration: ['args'],
  },
  {
    id: 'docker',
    name: 'Docker Server',
    description: 'Manage Docker containers and images',
    category: 'development',
    config: {
      name: 'Docker',
      description: 'Docker integration',
      transportType: 'stdio',

      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-docker'],
    },
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes Server',
    description: 'Manage Kubernetes clusters and resources',
    category: 'development',
    config: {
      name: 'Kubernetes',
      description: 'Kubernetes integration',
      transportType: 'stdio',

      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-kubernetes'],
      env: {
        KUBECONFIG: '',
      },
    },
    requiresConfiguration: ['env.KUBECONFIG'],
  },
];

export function getTemplatesByCategory(category: string): ServerTemplate[] {
  return serverTemplates.filter((t) => t.category === category);
}

export function getTemplateById(id: string): ServerTemplate | undefined {
  return serverTemplates.find((t) => t.id === id);
}

export const templateCategories = [
  { id: 'filesystem', label: 'Filesystem', icon: '📁' },
  { id: 'database', label: 'Database', icon: '🗄️' },
  { id: 'api', label: 'API', icon: '🔌' },
  { id: 'development', label: 'Development', icon: '🛠️' },
  { id: 'other', label: 'Other', icon: '📦' },
] as const;

