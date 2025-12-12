module.exports = {
    apps: [
        {
            name: 'my-typescript-server',
            script: 'src/server.ts',
            interpreter: 'npx', // Use npx to find ts-node
            interpreter_args: 'ts-node', // Specify ts-node as the interpreter
            watch: true,
            ignore_watch: ['node_modules'],
            env: {
                NODE_ENV: 'development'
            },
            env_production: {
                NODE_ENV: 'production'
            }
        }
    ]
};
//npm install -g ts-node typescript
//pm2 start ecosystem.config.js --env development
