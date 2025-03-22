# MongoDB Production Setup Guide

This guide explains how to properly set up MongoDB for production use with SocialProofify, ensuring transaction support and high availability.

## Why MongoDB Transactions Require a Replica Set

MongoDB transactions, which provide ACID guarantees, require a replica set or sharded cluster deployment. This is because:

1. **Data Durability**: Replica sets ensure that committed transactions remain durable even if primary node fails
2. **Consensus**: Transaction commits require consensus among replica set members
3. **Rollback Capability**: The distributed nature of replica sets enables proper transaction rollbacks

## Option 1: MongoDB Atlas (Recommended)

The easiest way to set up a production-ready MongoDB deployment is to use MongoDB Atlas, the official cloud service.

### Setting up MongoDB Atlas

1. **Create an account** at [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Create a new cluster** (M0 Free tier is available for testing)
3. **Configure network access**:
   - Add your application server IP to the IP Access List
   - Or set up network peering for cloud providers
4. **Create a database user** with appropriate permissions
5. **Get your connection string**:
   - Go to "Connect" > "Connect your application"
   - Copy the connection string with your credentials
6. **Update your application's .env file**:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/socialproofify?retryWrites=true&w=majority
   ```

## Option 2: Self-Hosted Replica Set

If you prefer to host MongoDB yourself, you need to set up a replica set.

### Setting up a Replica Set on Ubuntu/Debian

1. **Install MongoDB on all servers**:
   ```bash
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   ```

2. **Configure MongoDB for replica set**:
   - Edit `/etc/mongod.conf` on each server:
   ```yaml
   replication:
     replSetName: "rs0"
   net:
     bindIp: 0.0.0.0
   ```

3. **Start MongoDB on each server**:
   ```bash
   sudo systemctl start mongod
   ```

4. **Initiate the replica set** (on primary node only):
   ```javascript
   rs.initiate({
     _id: "rs0",
     members: [
       { _id: 0, host: "mongodb-server-1:27017" },
       { _id: 1, host: "mongodb-server-2:27017" },
       { _id: 2, host: "mongodb-server-3:27017" }
     ]
   })
   ```

5. **Check replica set status**:
   ```javascript
   rs.status()
   ```

6. **Update your application's .env file**:
   ```
   MONGODB_URI=mongodb://username:password@mongodb-server-1:27017,mongodb-server-2:27017,mongodb-server-3:27017/socialproofify?replicaSet=rs0
   ```

## Option 3: Docker Compose for Development

For local development, you can set up a single-node replica set using Docker Compose. This is useful for development since it provides transaction support without the need for multiple servers.

1. **Create a Docker Compose file (`docker-compose.yml`)** with the following content:

```yaml
version: '3'
services:
  mongodb:
    image: mongo:latest
    container_name: mongodb-replica
    hostname: mongodb-replica
    command: ["--replSet", "rs0", "--bind_ip_all"]
    ports:
      - "27018:27017"
    volumes:
      - mongodb_data:/data/db
    networks:
      - mongodb-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: always

  mongo-init:
    image: mongo:latest
    container_name: mongodb-init
    depends_on:
      mongodb:
        condition: service_healthy
    volumes:
      - ./scripts/init-replica.sh:/scripts/init-replica.sh
    command: ["sh", "-c", "chmod +x /scripts/init-replica.sh && /scripts/init-replica.sh"]
    networks:
      - mongodb-network
    restart: "no"

networks:
  mongodb-network:
    driver: bridge

volumes:
  mongodb_data:
```

2. **Create an initialization script (`scripts/init-replica.sh`)**:

```bash
#!/bin/bash
set -e

echo "Waiting for MongoDB to start..."
sleep 15

echo "Initializing replica set..."
mongosh --host mongodb:27017 --eval '
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb-replica:27017", priority: 2 }
  ]
})
'

echo "Waiting for replica set to be ready..."
sleep 10

echo "Checking replica set status..."
mongosh --host mongodb:27017 --eval 'rs.status()'

echo "MongoDB replica set initialized successfully!"
```

3. **Make the script executable**:
```bash
chmod +x ./scripts/init-replica.sh
```

4. **Start the containers**:
```bash
docker-compose up -d
```

5. **Update your `.env.local` file**:
```
MONGODB_URI=mongodb://localhost:27018/socialproofify?directConnection=true
```

6. **Test transaction support**:
```bash
node scripts/test-transactions.js
```

This setup creates a single MongoDB instance configured as a replica set, which enables transaction support even when connecting with directConnection mode.

### Important Notes on Docker Setup

- The hostname (`mongodb-replica`) matches the container name for internal service discovery
- We use port mapping (27018:27017) to avoid conflicts with existing MongoDB installations
- The directConnection parameter allows us to bypass replica set discovery which can cause issues in development
- For your application to use transactions, make sure your connection string is configured correctly
- In production, you would typically use a multi-node replica set for better fault tolerance

## Monitoring and Backups

For production deployments, ensure you set up:

1. **Monitoring** using MongoDB Cloud Manager or Prometheus with MongoDB exporter
2. **Regular backups** - daily at minimum
3. **Alerting** for replica set health issues

## Testing Transaction Support

To verify that your MongoDB deployment supports transactions, use this test script:

```javascript
const { MongoClient } = require('mongodb');

async function testTransactions() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Start a session and transaction
    const session = client.startSession();
    try {
      session.startTransaction();
      
      // Perform operations
      await db.collection('test').insertOne({ test: true }, { session });
      
      // Commit transaction
      await session.commitTransaction();
      console.log('✅ Transactions are supported!');
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Transaction failed:', error);
    } finally {
      await session.endSession();
    }
  } finally {
    await client.close();
  }
}

testTransactions().catch(console.error);
```

## Need Help?

If you encounter any issues setting up MongoDB for production, refer to the [MongoDB documentation](https://www.mongodb.com/docs/) or contact our support team for assistance. 