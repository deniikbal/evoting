module.exports = {
  apps: [
    {
      name: 'evoting',
      cwd: '/www/wwwroot/evoting',
      script: 'server.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        NODE_OPTIONS:
          '--dns-result-order=ipv4first --network-family-autoselection-attempt-timeout=15000',
      },
      max_memory_restart: '700M',
      autorestart: true,
    },
  ],
}
