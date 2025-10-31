const { execSync } = require('child_process');

const migrationType = process.argv[2]; // 'generate' or 'create'
const migrationName = process.env.npm_config_name || process.argv[3] || 'Migration';

const baseCommand = `npx ts-node -P ./tsconfig.json -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:${migrationType}`;

if (migrationType === 'generate') {
  const command = `${baseCommand} -d ./src/config/data-source.ts ./src/migrations/${migrationName}`;
  execSync(command, { stdio: 'inherit' });
} else if (migrationType === 'create') {
  const command = `${baseCommand} ./src/migrations/${migrationName}`;
  execSync(command, { stdio: 'inherit' });
} else {
  console.error('Invalid migration type. Use "generate" or "create"');
  process.exit(1);
}

