const fs = require('fs-extra');
const path = require('path');
const graphqlServicePath = path.resolve(__dirname, '../graphql-backend-service');

//Read updated schema and types from a file
const updatedSchemaPath = path.resolve(__dirname, 'updatedSchema.graphql');
const updatedSchema = fs.readFileSync(updatedSchemaPath, 'utf-8');

// Write the updated schema and types to the GraphQL service directory
const destinationPath = path.resolve(graphqlServicePath, 'schema.graphql');
fs.writeFileSync(destinationPath, updatedSchema);

console.log('GraphQL schema and types updated successfully.');
