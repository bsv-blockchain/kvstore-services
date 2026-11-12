# KVStore Overlay Services

An overlay service implementation for key-value storage on BSV blockchain.

## Overview

This repo provides:
- **KVStoreStorageManager**: MongoDB-based storage for KVStore records
- **KVStoreLookupService**: Overlay lookup service implementation  
- **KVStoreTopicManager**: Topic manager for handling KVStore transactions
- **Type definitions**: TypeScript interfaces for KVStore data structures

## Features

- **Modern TypeScript**: Full type safety with modern ES modules
- **MongoDB Integration**: Efficient storage with proper indexing
- **Overlay Protocol**: Compatible with @bsv/overlay architecture
- **History Tracking**: Chain tracking capabilities for KVStore tokens
- **Pagination**: Built-in pagination and sorting support

## Runtime dependencies and release validation

The backend pins `@bsv/sdk` 4.0.1, `@bsv/overlay` 2.7.0 and
`@bsv/overlay-express` 2.8.0, with MongoDB driver 7.6.0. Node.js 22.12 or
newer is required. The explicit backend pins survive CARS runtime generation.
Overlay Express accepts both JSON-array and comma-separated `X-Topics` headers.

Run `npm ci --prefix backend`, `npm run build --prefix backend`, and
`npm test --prefix backend -- --runInBand`. Tests start an isolated MongoDB
8.0.30 instance and include real SDK signature compatibility checks. Node's VM
module flag in the test script permits the MongoDB driver's dynamic imports.
The CI workflow validates Node.js 22 and 24 without accessing production data.

For the mainnet Babbage target, run `npm ci`, then `npm run build` to create
an artifact. Use `cars doctor Babbage` and a positive project-balance check before
`npm run deploy`. The CLI is `@p2ppsr/cars-cli`; the old `@bsv/cars-cli` package
is deprecated. Preserve the existing project/database identity and verify the
serving image, package versions, legacy/current header handling, lookup behavior
and availability after release. A successful malformed-body probe alone does
not qualify funded publication.

## Development Setup

This project uses the **LARS** (local) and **CARS** (cloud) toolchains to simplify development and deployment of overlay services.

### Getting Started

1. **Start LARS locally**:
```bash
npm run lars
# Select "Start LARS (local only)"
```

2. **The LARS environment provides**:
   - Local MongoDB instance for lookup service records
   - Local MySQL instance for overlay storage manager records
   - Overlay services infrastructure

3. **Services are automatically configured** via `deployment-info.json`:
```json
{
  "topicManagers": {
    "tm_kvstore": "./backend/src/KVStoreTopicManager.ts"
  },
  "lookupServices": {
    "ls_kvstore": {
      "serviceFactory": "./backend/src/KVStoreLookupServiceFactory.ts",
      "hydrateWith": "mongo"
    }
  }
}
```

### Lookup Service Queries

Lookup queries must include at least one selector: `key`, `controller`, `protocolID`, or a non-empty `tags` array. Pagination and ordering parameters refine selector-based lookups; they are not valid selectors by themselves.

```typescript
// Find by key
const results = await lookupService.lookup({
  service: 'ls_kvstore',
  query: {
    key: 'user-profile'
  }
})

// Find by controller (public key)
const results = await lookupService.lookup({
  service: 'ls_kvstore', 
  query: {
    controller: '02f6e1e4c00f8a7e746f106a5d8a0b8a6b3e7c5f2d1e8b9a3c6f9e2d5b8a1f4e7c'
  }
})

// Combined query with pagination
const results = await lookupService.lookup({
  service: 'ls_kvstore', 
  query: {
    key: 'user-profile',
    controller: '02f6e1e4c00f8a7e746f106a5d8a0b8a6b3e7c5f2d1e8b9a3c6f9e2d5b8a1f4e7c',
    protocolID: [1, 'kvstore'],
    limit: 10,
    skip: 0,
    sortOrder: 'desc'
  }
})
```

## Protocol Details

### KVStore Token Structure (PushDrop Protocol)
- **Field 0**: Protocol ID (`[1, 'kvstore']` as JSON string)
- **Field 1**: Key (variable length UTF-8 string)
- **Field 2**: Value (variable length UTF-8 string) 
- **Field 3**: Controller (33-byte compressed ECDSA public key)
- **Field 4**: Optional tags (JSON string array)
- **Field 5**: Signature (64-byte signature over the preceding fields)

### Service Configuration
- **Service ID**: `ls_kvstore`
- **Topic**: `tm_kvstore`
- **Protocol ID**: `[1, 'kvstore']`
- **Admission Mode**: `locking-script`
- **Spend Notification Mode**: `none`

### Query Capabilities
The lookup service supports filtering by:
- **key**: Find records with a specific key
- **controller**: Find records controlled by a specific public key
- **protocolID**: Find records for a specific protocol version
- **tags**: Find records with all or any supplied tags
- **Pagination**: `limit`, `skip`, and `sortOrder` parameters when combined with a selector
- **Combined filters**: Multiple criteria can be combined

### Database Schema
Records are stored in MongoDB with the following structure:
```typescript
interface KVStoreRecord {
  txid: string           // Transaction ID
  outputIndex: number    // Output index in transaction
  key: string           // The key from the KVStore token
  protocolID: string    // JSON-stringified protocol ID
  controller: string    // Public key (hex) that controls this token
  createdAt: Date       // When the record was stored
}
```

**Indexes**: Efficient lookups are enabled on `key`, `protocolID`, and `controller` fields.

## License

See [LICENSE](LICENSE) for license details.
