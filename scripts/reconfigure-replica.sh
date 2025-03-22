#!/bin/bash
# Reconfigure the MongoDB replica set

echo "Reconfiguring MongoDB replica set..."
docker exec -it mongodb-replica mongosh --eval '
rs.reconfig({
  _id: "rs0", 
  members: [{ 
    _id: 0, 
    host: "mongodb-replica:27017",
    priority: 2
  }]
}, {force: true})
'

echo "Checking replica set status..."
docker exec -it mongodb-replica mongosh --eval 'rs.status()'

echo "Done!" 