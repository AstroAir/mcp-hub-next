/**
 * MCP Server Documentation Database
 * Comprehensive documentation for popular MCP servers
 */

import type { MCPTransportType } from '@/lib/types';

export interface MCPServerDoc {
  id: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  officialUrl?: string;
  githubUrl?: string;
  npmPackage?: string;
  supportedTransports: MCPTransportType[];
  authentication?: {
    required: boolean;
    methods: string[];
    envVars?: string[];
  };
  configuration: {
    stdio?: {
      command: string;
      args: string[];
      requiredEnvVars?: string[];
      optionalEnvVars?: string[];
      notes?: string;
    };
    sse?: {
      url: string;
      headers?: Record<string, string>;
      notes?: string;
    };
    http?: {
      url: string;
      headers?: Record<string, string>;
      notes?: string;
    };
  };
  examples: {
    title: string;
    description: string;
    config: Record<string, unknown>;
  }[];
  features: string[];
  requirements?: string[];
  notes?: string[];
}

export const MCP_SERVER_DOCS: Record<string, MCPServerDoc> = {
  filesystem: {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Provides secure file system access with configurable permissions',
    category: 'System',
    provider: 'Model Context Protocol',
    githubUrl: 'https://github.com/modelcontextprotocol/servers',
    npmPackage: '@modelcontextprotocol/server-filesystem',
    supportedTransports: ['stdio'],
    authentication: {
      required: false,
      methods: [],
    },
    configuration: {
      stdio: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/files'],
        notes: 'Specify one or more allowed directories as arguments',
      },
    },
    examples: [
      {
        title: 'Basic filesystem access',
        description: 'Allow access to a specific directory',
        config: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/username/Documents'],
        },
      },
      {
        title: 'Multiple directories',
        description: 'Allow access to multiple directories',
        config: {
          command: 'npx',
          args: [
            '-y',
            '@modelcontextprotocol/server-filesystem',
            '/Users/username/Documents',
            '/Users/username/Projects',
          ],
        },
      },
    ],
    features: [
      'Read and write files',
      'List directory contents',
      'Create and delete files/directories',
      'Move and copy files',
      'Search files',
    ],
    requirements: ['Node.js and npm installed'],
    notes: [
      'Only specified directories are accessible',
      'Paths outside allowed directories are blocked',
      'Use absolute paths for security',
    ],
  },

  github: {
    id: 'github',
    name: 'GitHub',
    description: 'Interact with GitHub repositories, issues, pull requests, and more',
    category: 'Development',
    provider: 'Model Context Protocol',
    githubUrl: 'https://github.com/modelcontextprotocol/servers',
    npmPackage: '@modelcontextprotocol/server-github',
    supportedTransports: ['stdio'],
    authentication: {
      required: true,
      methods: ['Personal Access Token'],
      envVars: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
    },
    configuration: {
      stdio: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        requiredEnvVars: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
        notes: 'Requires a GitHub Personal Access Token with appropriate scopes',
      },
    },
    examples: [
      {
        title: 'Basic GitHub integration',
        description: 'Connect to GitHub with personal access token',
        config: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
          env: {
            GITHUB_PERSONAL_ACCESS_TOKEN: 'ghp_your_token_here',
          },
        },
      },
    ],
    features: [
      'Create and manage repositories',
      'Create and manage issues',
      'Create and manage pull requests',
      'Search repositories and code',
      'Manage branches and commits',
      'Fork repositories',
    ],
    requirements: ['Node.js and npm installed', 'GitHub Personal Access Token'],
    notes: [
      'Token needs appropriate scopes (repo, read:org, etc.)',
      'Rate limits apply based on your GitHub plan',
    ],
  },

  postgres: {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Query and manage PostgreSQL databases',
    category: 'Database',
    provider: 'Model Context Protocol',
    githubUrl: 'https://github.com/modelcontextprotocol/servers',
    npmPackage: '@modelcontextprotocol/server-postgres',
    supportedTransports: ['stdio'],
    authentication: {
      required: true,
      methods: ['Connection String'],
    },
    configuration: {
      stdio: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://user:password@localhost:5432/dbname'],
        notes: 'Provide PostgreSQL connection string as argument',
      },
    },
    examples: [
      {
        title: 'Local PostgreSQL',
        description: 'Connect to local PostgreSQL database',
        config: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://localhost/mydb'],
        },
      },
      {
        title: 'Remote PostgreSQL with auth',
        description: 'Connect to remote database with credentials',
        config: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://user:pass@host:5432/db'],
        },
      },
    ],
    features: [
      'Execute SQL queries',
      'List tables and schemas',
      'Describe table structures',
      'Insert, update, delete data',
      'Transaction support',
    ],
    requirements: ['Node.js and npm installed', 'PostgreSQL server accessible'],
    notes: [
      'Connection string format: postgresql://[user[:password]@][host][:port][/dbname]',
      'Ensure database is accessible from your machine',
    ],
  },

  sqlite: {
    id: 'sqlite',
    name: 'SQLite',
    description: 'Query and manage SQLite databases',
    category: 'Database',
    provider: 'Model Context Protocol',
    githubUrl: 'https://github.com/modelcontextprotocol/servers',
    npmPackage: '@modelcontextprotocol/server-sqlite',
    supportedTransports: ['stdio'],
    authentication: {
      required: false,
      methods: [],
    },
    configuration: {
      stdio: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sqlite', '/path/to/database.db'],
        notes: 'Provide path to SQLite database file',
      },
    },
    examples: [
      {
        title: 'Local SQLite database',
        description: 'Connect to SQLite database file',
        config: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sqlite', '/Users/username/data/app.db'],
        },
      },
    ],
    features: [
      'Execute SQL queries',
      'List tables',
      'Describe table structures',
      'Insert, update, delete data',
      'Create and drop tables',
    ],
    requirements: ['Node.js and npm installed'],
    notes: [
      'Database file will be created if it doesn\'t exist',
      'Use absolute paths for reliability',
    ],
  },

  puppeteer: {
    id: 'puppeteer',
    name: 'Puppeteer',
    description: 'Browser automation and web scraping with Puppeteer',
    category: 'Web',
    provider: 'Model Context Protocol',
    githubUrl: 'https://github.com/modelcontextprotocol/servers',
    npmPackage: '@modelcontextprotocol/server-puppeteer',
    supportedTransports: ['stdio'],
    authentication: {
      required: false,
      methods: [],
    },
    configuration: {
      stdio: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-puppeteer'],
        notes: 'No additional configuration required',
      },
    },
    examples: [
      {
        title: 'Basic Puppeteer',
        description: 'Enable browser automation',
        config: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-puppeteer'],
        },
      },
    ],
    features: [
      'Navigate to URLs',
      'Take screenshots',
      'Extract page content',
      'Fill forms',
      'Click elements',
      'Execute JavaScript',
    ],
    requirements: ['Node.js and npm installed', 'Chrome/Chromium will be downloaded automatically'],
    notes: [
      'First run will download Chromium',
      'Headless browser by default',
    ],
  },

  fetch: {
    id: 'fetch',
    name: 'Fetch',
    description: 'Make HTTP requests to external APIs and websites',
    category: 'Web',
    provider: 'Model Context Protocol',
    githubUrl: 'https://github.com/modelcontextprotocol/servers',
    npmPackage: '@modelcontextprotocol/server-fetch',
    supportedTransports: ['stdio'],
    authentication: {
      required: false,
      methods: [],
    },
    configuration: {
      stdio: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-fetch'],
        notes: 'No additional configuration required',
      },
    },
    examples: [
      {
        title: 'Basic fetch',
        description: 'Enable HTTP requests',
        config: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-fetch'],
        },
      },
    ],
    features: [
      'GET, POST, PUT, DELETE requests',
      'Custom headers',
      'Request body support',
      'Response parsing',
      'Error handling',
    ],
    requirements: ['Node.js and npm installed'],
    notes: [
      'Respects robots.txt',
      'Rate limiting recommended for production use',
    ],
  },

  memory: {
    id: 'memory',
    name: 'Memory',
    description: 'Persistent memory storage for AI conversations',
    category: 'Storage',
    provider: 'Model Context Protocol',
    githubUrl: 'https://github.com/modelcontextprotocol/servers',
    npmPackage: '@modelcontextprotocol/server-memory',
    supportedTransports: ['stdio'],
    authentication: {
      required: false,
      methods: [],
    },
    configuration: {
      stdio: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
        notes: 'No additional configuration required',
      },
    },
    examples: [
      {
        title: 'Basic memory',
        description: 'Enable persistent memory',
        config: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-memory'],
        },
      },
    ],
    features: [
      'Store key-value pairs',
      'Retrieve stored data',
      'Update existing data',
      'Delete data',
      'List all stored keys',
    ],
    requirements: ['Node.js and npm installed'],
    notes: [
      'Data persists between sessions',
      'Stored locally on your machine',
    ],
  },

  slack: {
    id: 'slack',
    name: 'Slack',
    description: 'Interact with Slack workspaces, channels, and messages',
    category: 'Communication',
    provider: 'Model Context Protocol',
    githubUrl: 'https://github.com/modelcontextprotocol/servers',
    npmPackage: '@modelcontextprotocol/server-slack',
    supportedTransports: ['stdio'],
    authentication: {
      required: true,
      methods: ['Bot Token', 'User Token'],
      envVars: ['SLACK_BOT_TOKEN', 'SLACK_TEAM_ID'],
    },
    configuration: {
      stdio: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-slack'],
        requiredEnvVars: ['SLACK_BOT_TOKEN', 'SLACK_TEAM_ID'],
        notes: 'Requires Slack Bot Token and Team ID',
      },
    },
    examples: [
      {
        title: 'Basic Slack integration',
        description: 'Connect to Slack workspace',
        config: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-slack'],
          env: {
            SLACK_BOT_TOKEN: 'xoxb-your-token',
            SLACK_TEAM_ID: 'T1234567890',
          },
        },
      },
    ],
    features: [
      'Send messages to channels',
      'Read channel messages',
      'List channels',
      'Search messages',
      'Upload files',
      'Manage reactions',
    ],
    requirements: ['Node.js and npm installed', 'Slack Bot Token with appropriate scopes'],
    notes: [
      'Bot needs to be added to channels',
      'Requires appropriate OAuth scopes',
    ],
  },

  'brave-search': {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Search the web using Brave Search API',
    category: 'Web',
    provider: 'Brave',
    officialUrl: 'https://brave.com/search/api/',
    supportedTransports: ['http'],
    authentication: {
      required: true,
      methods: ['API Key'],
      envVars: ['BRAVE_API_KEY'],
    },
    configuration: {
      http: {
        url: 'https://api.brave.com/mcp',
        headers: {
          Authorization: 'Bearer YOUR_API_KEY',
        },
        notes: 'Requires Brave Search API key',
      },
    },
    examples: [
      {
        title: 'Brave Search',
        description: 'Enable web search via Brave',
        config: {
          url: 'https://api.brave.com/mcp',
          transport: 'http',
          headers: {
            Authorization: 'Bearer YOUR_API_KEY',
          },
        },
      },
    ],
    features: [
      'Web search',
      'News search',
      'Image search',
      'Video search',
      'Safe search options',
    ],
    requirements: ['Brave Search API key'],
    notes: [
      'Free tier available with limits',
      'Paid plans for higher usage',
    ],
  },
};

/**
 * Get documentation for a specific server
 */
export function getServerDoc(serverId: string): MCPServerDoc | undefined {
  return MCP_SERVER_DOCS[serverId];
}

/**
 * Get all server documentation
 */
export function getAllServerDocs(): MCPServerDoc[] {
  return Object.values(MCP_SERVER_DOCS);
}

/**
 * Get servers by category
 */
export function getServersByCategory(category: string): MCPServerDoc[] {
  return Object.values(MCP_SERVER_DOCS).filter((doc) => doc.category === category);
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  const categories = new Set(Object.values(MCP_SERVER_DOCS).map((doc) => doc.category));
  return Array.from(categories).sort();
}

/**
 * Search server documentation
 */
export function searchServerDocs(query: string): MCPServerDoc[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(MCP_SERVER_DOCS).filter(
    (doc) =>
      doc.name.toLowerCase().includes(lowerQuery) ||
      doc.description.toLowerCase().includes(lowerQuery) ||
      doc.category.toLowerCase().includes(lowerQuery) ||
      doc.features.some((f) => f.toLowerCase().includes(lowerQuery))
  );
}

