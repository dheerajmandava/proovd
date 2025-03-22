# MongoDB Replica Set Setup

This guide explains how to use the MongoDB replica set with this project.

## Quick Start

1. **Start the MongoDB replica set**:
   ```bash
   npm run db:start
   ```

2. **Verify it's working**:
   ```bash
   node test-db.js
   ```

3. **Test transaction support**:
   ```bash
   node scripts/test-transactions.js
   ```

## Configuration

- The MongoDB replica set runs on port **27018** to avoid conflicts with existing MongoDB instances
- It's configured as a single-node replica set named **rs0**
- The application connects using **directConnection=true** parameter

## Environment Configuration

Your `.env.local` file should contain:
```
MONGODB_URI=mongodb://localhost:27018/proovd?directConnection=true
```

## Troubleshooting

If you encounter connection issues:

1. **Check container status**:
   ```bash
   docker ps -a
   ```

2. **View container logs**:
   ```bash
   docker logs mongodb-replica
   docker logs mongodb-init
   ```

3. **Reconfigure the replica set** (if needed):
   ```bash
   ./scripts/reconfigure-replica.sh
   ```

4. **Restart the containers**:
   ```bash
   npm run db:stop
   npm run db:start
   ```

5. **Common errors**:
   - `mongodb:27017 ENOTFOUND`: The MongoDB hostname resolution failed
   - `Connection refused`: MongoDB isn't running or the port is incorrect
   - `Transaction support requires replica set`: The replica set isn't properly configured

For more detailed setup instructions and production deployment options, see `docs/mongodb-production-setup.md`. 