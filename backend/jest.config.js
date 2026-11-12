/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  // Keep existing Jest mocks in CommonJS; the Node VM flag permits driver dynamic imports.
  preset: 'ts-jest',

  // Use the Node environment for testing
  testEnvironment: 'node',
  testTimeout: 30000,

  // Ignore compiled output
  testPathIgnorePatterns: ['dist/', 'node_modules/'],

  // Configure transform for ESM
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
      tsconfig: 'tsconfig.jest.json'
    }]
  },

  // TypeScript test modules use the CommonJS transform.
  extensionsToTreatAsEsm: [],

  // Map .js imports to .ts files for ESM compatibility  
  moduleNameMapper: {
    './docs/KVStoreLookupDocs.md.js': '<rootDir>/src/__tests/__mocks__/lookupDocsMock.cjs',
    './docs/KVStoreTopicManagerDocs.md.js': '<rootDir>/src/__tests/__mocks__/topicDocsMock.cjs',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },

  // Resolve modules properly
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Transform ignore patterns for node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(@bsv/.*)/)'
  ]
}
