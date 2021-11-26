const { spawn, execSync } = require('child_process');

const url = execSync('echo -n $DATABASE_URL', { encoding: 'utf-8' });
const local = process.env.LOCAL;

if (!local){
  migrations = spawn('npm', ['run', 'migrate']);
  const gql = spawn('./graphql-engine', ['serve'], {
    env: {
      ...process.env,
      HASURA_GRAPHQL_DATABASE_URL: url,
      HASURA_GRAPHQL_ENABLE_CONSOLE: true,
    }
  });
  
  gql.stdout.on('data', (data) => {
    console.log(`{ "logtype": "hasura", "log": ${data}`);
  });
  
  gql.stderr.on('data', (data) => {
    console.log(`{ "logtype": "hasura", "error": ${data}`);
  });
  
  gql.on('close', (code) => {
    console.log(`gql exited with code ${code}`);
  });
}