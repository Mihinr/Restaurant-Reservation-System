import '@testing-library/jest-dom';

// Mock import.meta.env
Object.defineProperty(global, 'importMeta', {
  value: {
    env: {
      VITE_API_URL: 'http://localhost:3001',
      VITE_RESERVATION_SERVICE_URL: 'http://localhost:3002',
    },
  },
});

// Since ts-jest might have trouble with import.meta, we can also use this:
(global as any).import = { meta: { env: {} } };
