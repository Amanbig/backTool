#!/usr/bin/env node
import { program } from 'commander';
import figlet from 'figlet';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import npm from 'npm-programmatic';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Display ASCII art banner
console.log(chalk.cyan(figlet.textSync('BackTool')));

program
    .name('backtool')
    .description('CLI tool to generate backend structures for Node.js applications')
    .version('1.0.0')
    .option('-p, --project <name>', 'Specify project name')
    .option('-d, --database <type>', 'Specify database (MongoDB, MySQL, PostgreSQL, SQLite)');

async function promptInputs(options) {
    const questions = [];

    if (!options.project) {
        questions.push({
            type: 'input',
            name: 'project',
            message: chalk.green('What is your project name?'),
            prefix: '📋',
            default: 'my-app',
            validate: (input) => input.trim() ? true : 'Project name cannot be empty',
        });
    }

    if (!options.database) {
        questions.push({
            type: 'list',
            name: 'database',
            message: chalk.green('Which database do you want to use?'),
            prefix: '🗄️',
            choices: ['MongoDB', 'MySQL', 'PostgreSQL', 'SQLite'],
        });
    }

    return inquirer.prompt(questions);
}

async function generateBackendStructure(projectName, databaseChoice) {
    const templateDir = path.join(__dirname, 'backtool_folder');
    const targetDir = process.cwd();

    // Check if template directory exists
    try {
        await fs.access(templateDir);
    } catch (err) {
        console.error(chalk.red('Template directory not found. Please ensure backtool_folder exists.'));
        process.exit(1);
    }

    // Create target directories
    await fs.mkdir(path.join(targetDir, 'models'), { recursive: true });
    await fs.mkdir(path.join(targetDir, 'config'), { recursive: true });
    await fs.mkdir(path.join(targetDir, 'controllers'), { recursive: true });
    await fs.mkdir(path.join(targetDir, 'routes'), { recursive: true });
    await fs.mkdir(path.join(targetDir, 'middleware'), { recursive: true });

    // Define packages to install
    let packagesToInstall = ['express', 'dotenv', 'cors'];
    let devPackagesToInstall = ['nodemon'];
    let dbConfig = '';

    switch (databaseChoice) {
        case 'MongoDB':
            packagesToInstall.push('mongoose', 'bcryptjs');
            dbConfig = `import mongoose from 'mongoose';

                  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/${projectName}', {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                  });

                  mongoose.set('strictQuery', true);`;

            
            break;
        case 'PostgreSQL':
            packagesToInstall.push('pg', 'bcryptjs');
            dbConfig = `import { Pool } from 'pg';

                  const pool = new Pool({
                    user: process.env.PGUSER || 'postgres',
                    host: process.env.PGHOST || 'localhost',
                    database: process.env.PGDATABASE || '${projectName}',
                    password: process.env.PGPASSWORD || '',
                    port: process.env.PGPORT || 5432
                  });

                  await pool.query(
                    'CREATE TABLE IF NOT EXISTS users (\\n' +
                    '    id SERIAL PRIMARY KEY,\\n' +
                    '    username VARCHAR(255) UNIQUE NOT NULL,\\n' +
                    '    email VARCHAR(255) UNIQUE NOT NULL,\\n' +
                    '    password VARCHAR(255) NOT NULL,\\n' +
                    '    created_at TIMESTAMP DEFAULT NOW()\\n' +
                    ')'
                  );`;
            break;
        case 'MySQL':
            packagesToInstall.push('mysql2', 'bcryptjs');
            dbConfig = `import mysql from 'mysql2/promise';

                  const pool = mysql.createPool({
                    host: process.env.MYSQL_HOST || 'localhost',
                    user: process.env.MYSQL_USER || 'root',
                    password: process.env.MYSQL_PASSWORD || '',
                    database: process.env.MYSQL_DATABASE || '${projectName}',
                    port: process.env.MYSQL_PORT || 3306
                  });

                  await pool.query(
                    'CREATE TABLE IF NOT EXISTS users (\\n' +
                    '    id INT AUTO_INCREMENT PRIMARY KEY,\\n' +
                    '    username VARCHAR(255) UNIQUE NOT NULL,\\n' +
                    '    email VARCHAR(255) UNIQUE NOT NULL,\\n' +
                    '    password VARCHAR(255) NOT NULL,\\n' +
                    '    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\\n' +
                    ')'
                  );`;
            break;
        case 'SQLite':
            packagesToInstall.push('sqlite3', 'bcryptjs');
            dbConfig = `import sqlite3 from 'sqlite3';
                  import { open } from 'sqlite';

                  const db = await open({
                    filename: process.env.SQLITE_DB || './database.sqlite',
                    driver: sqlite3.Database
                  });

                  await db.exec(
                    'CREATE TABLE IF NOT EXISTS users (\\n' +
                    '    id INTEGER PRIMARY KEY AUTOINCREMENT,\\n' +
                    '    username TEXT UNIQUE NOT NULL,\\n' +
                    '    email TEXT UNIQUE NOT NULL,\\n' +
                    '    password TEXT NOT NULL,\\n' +
                    '    created_at DATETIME DEFAULT CURRENT_TIMESTAMP\\n' +
                    ')'
                  );`;
            break;
    }

    // Generate package.json
    const packageJson = {
        name: projectName,
        version: '1.0.0',
        type: 'module',
        scripts: {
            start: 'node server.js',
            dev: 'nodemon server.js',
        },
        dependencies: {
            express: '^4.18.2',
            dotenv: '^16.3.1',
            cors: '^2.8.5',
            jsonwebtoken: '^9.0.2',
            ...(databaseChoice === 'MongoDB' && { mongoose: '^8.0.0', bcryptjs: '^2.4.3' }),
            ...(databaseChoice === 'PostgreSQL' && { pg: '^8.11.3', bcryptjs: '^2.4.3' }),
            ...(databaseChoice === 'MySQL' && { mysql2: '^3.6.2', bcryptjs: '^2.4.3' }),
            ...(databaseChoice === 'SQLite' && { sqlite3: '^5.1.6', bcryptjs: '^2.4.3' }),
        },
        devDependencies: {
            nodemon: '^3.0.1',
        },
    };

    const packageJsonPath = path.join(targetDir, 'package.json');
    try {
        if (await fs.stat(packageJsonPath).catch(() => false)) {
            const { overwrite } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'overwrite',
                    message: chalk.yellow('File package.json already exists. Overwrite?'),
                    prefix: '⚠️',
                    default: false,
                },
            ]);
            if (!overwrite) {
                console.log(chalk.blue('Skipping package.json'));
            } else {
                await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
            }
        } else {
            await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
        }
    } catch (err) {
        console.error(chalk.red(`Error writing package.json: ${err}`));
        process.exit(1);
    }

    // Copy model file
    const modelFile = `user.${databaseChoice.toLowerCase()}.js`;
    const modelPath = path.join(templateDir, 'models', modelFile);
    try {
        await fs.access(modelPath);
        if (await fs.stat(path.join(targetDir, 'models', modelFile)).catch(() => false)) {
            const { overwrite } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'overwrite',
                    message: chalk.yellow(`File ${modelFile} already exists. Overwrite?`),
                    prefix: '⚠️',
                    default: false,
                },
            ]);
            if (!overwrite) {
                console.log(chalk.blue(`Skipping ${modelFile}`));
                return;
            }
        }
        await fs.cp(modelPath, path.join(targetDir, 'models', modelFile));
    } catch (err) {
        console.error(chalk.red(`Model file for ${databaseChoice} not found.`));
        process.exit(1);
    }

    // Copy server.js file
    const serverFile = 'server.js';
    const serverPath = path.join(templateDir, serverFile);
    try {
        await fs.access(serverPath);
        if (await fs.stat(path.join(targetDir, serverFile)).catch(() => false)) {
            const { overwrite } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'overwrite',
                    message: chalk.yellow(`File ${serverFile} already exists. Overwrite?`),
                    prefix: '⚠️',
                    default: false,
                },
            ]);
            if (!overwrite) {
                console.log(chalk.blue(`Skipping ${serverFile}`));
            } else {
                await fs.cp(serverPath, path.join(targetDir, serverFile));
            }
        } else {
            await fs.cp(serverPath, path.join(targetDir, serverFile));
        }
    } catch (err) {
        console.error(chalk.red(`Server file (server.js) not found in backtool_folder.`));
        process.exit(1);
    }

    // Write database configuration
    await fs.writeFile(path.join(targetDir, 'config', 'database.js'), dbConfig);

    // Copy additional structure (controllers, routes, middleware)
    const structure = [
        { src: path.join(templateDir, 'controllers'), dest: path.join(targetDir, 'controllers') },
        { src: path.join(templateDir, 'routes'), dest: path.join(targetDir, 'routes') },
        { src: path.join(templateDir, 'middleware'), dest: path.join(targetDir, 'middleware') },
    ];

    for (const { src, dest } of structure) {
        try {
            await fs.cp(src, dest, { recursive: true });
        } catch (err) {
            console.error(chalk.red(`Error copying ${src}: ${err}`));
        }
    }

    // Install packages
    const spinner = ora(chalk.blue('Installing packages...')).start();
    try {
        await npm.install(packagesToInstall, { cwd: targetDir, save: true });
        await npm.install(devPackagesToInstall, { cwd: targetDir, saveDev: true });
        spinner.succeed(chalk.green(`Installed packages: ${packagesToInstall.concat(devPackagesToInstall).join(', ')}`));
    } catch (err) {
        spinner.fail(chalk.red(`Error installing packages: ${err.message}`));
        console.log(chalk.yellow(`Try installing dependencies manually: npm install ${packagesToInstall.join(' ')} && npm install --save-dev ${devPackagesToInstall.join(' ')}`));
        process.exit(1);
    }

    console.log(chalk.green(`🎉 Backend structure generated for ${projectName} with ${databaseChoice} configuration!`));
}

program.action(async (options) => {
    const answers = await promptInputs(options);
    const projectName = options.project || answers.project || 'my-app';
    const database = options.database || answers.database;

    await generateBackendStructure(projectName, database);
});

program.parse(process.argv);