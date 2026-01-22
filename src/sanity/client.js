import { createClient } from '@sanity/client';

export const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID || 's7v9yaup',
  dataset: process.env.REACT_APP_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true, // Set to false if you want fresh data
  token: process.env.REACT_APP_SANITY_TOKEN, // Only needed for write operations
});
