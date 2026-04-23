module.exports = {
  apps: [
    {
      name: 'nearme-backend',
      script: 'dist/server.js',
      instances: 'max', // or a number of instances
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
