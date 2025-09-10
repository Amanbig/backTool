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
import { exec } from 'child_process';
import { promisify } from 'util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);

// Display ASCII art banner
console.log(chalk.cyan(figlet.textSync('BackTool')));

program
    .name('backtool')
    .description('CLI tool to generate backend structures for Node.js applications')
    .version('1.2.0')
    .option('-p, --project <name>', 'Specify project name')
    .option('-d, --database <type>', 'Specify database (MongoDB, MySQL, PostgreSQL, SQLite)')
    .option('-l, --language <type>', 'Specify language (JavaScript, TypeScript)')
    .option('-f, --force', 'Force overwrite of existing files without prompting')
    .option('-u, --uri <uri>', 'Specify database connection URI');

async function promptInputs(options) {
    const questions = [];

    if (!options.project) {
        questions.push({
            type: 'input',
            name: 'project',
            message: chalk.green('What is your project name?'),
            prefix: '📋',
            default: 'my-app',
            validate: (input) => (input.trim() ? true : 'Project name cannot be empty'),
        });
    }

    if (!options.language) {
        questions.push({
            type: 'list',
            name: 'language',
            message: chalk.green('Which language do you want to use?'),
            prefix: '💻',
            choices: ['JavaScript', 'TypeScript'],
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

async function generateBackendStructure(projectName, databaseChoice, languageChoice = 'JavaScript', forceOverwrite = false, uri) {
    const templateDir = path.join(__dirname, 'backtool_folder');
    const targetDir = path.join(process.cwd(), projectName);
    const fileExt = languageChoice === 'TypeScript' ? '.ts' : '.js';

    // Create the project directory
    await fs.mkdir(targetDir, { recursive: true });

    // Initialize git repository
    const gitSpinner = ora(chalk.blue('Initializing git repository...')).start();
    try {
        await execAsync('git init', { cwd: targetDir });
        gitSpinner.succeed(chalk.green('Git repository initialized'));
    } catch (gitError) {
        gitSpinner.warn(chalk.yellow('Git initialization failed - continuing without git...'));
        console.log(chalk.yellow('⚠️  Git not found or failed to initialize. You can initialize git manually later with: git init'));
    }

    // Check if template directory exists
    try {
        await fs.access(templateDir);
    } catch (err) {
        console.error(chalk.red('Template directory not found. Please ensure backtool_folder exists.'));
        process.exit(1);
    }

    // Create target directories
    const baseDir = languageChoice === 'TypeScript' ? path.join(targetDir, 'src') : targetDir;
    
    await fs.mkdir(path.join(baseDir, 'models'), { recursive: true });
    await fs.mkdir(path.join(baseDir, 'config'), { recursive: true });
    await fs.mkdir(path.join(baseDir, 'controllers'), { recursive: true });
    await fs.mkdir(path.join(baseDir, 'routes'), { recursive: true });
    await fs.mkdir(path.join(baseDir, 'middleware'), { recursive: true });
    
    if (languageChoice === 'TypeScript') {
        await fs.mkdir(path.join(targetDir, 'dist'), { recursive: true });
        await fs.mkdir(path.join(targetDir, 'types'), { recursive: true });
    }

    // Define packages to install
    let packagesToInstall = ['express', 'dotenv', 'cors', 'jsonwebtoken'];
    let devPackagesToInstall = ['nodemon'];

    // Add TypeScript related packages
    if (languageChoice === 'TypeScript') {
        devPackagesToInstall.push(
            'typescript',
            '@types/node',
            '@types/express',
            '@types/cors',
            '@types/jsonwebtoken',
            'ts-node',
            '@types/bcryptjs'
        );
    }

    // Database specific packages and types
    switch (databaseChoice) {
        case 'MongoDB':
            packagesToInstall.push('mongoose', 'bcryptjs');
            if (languageChoice === 'TypeScript') {
                devPackagesToInstall.push('@types/mongoose');
            }
            break;
        case 'PostgreSQL':
            packagesToInstall.push('pg', 'bcryptjs');
            if (languageChoice === 'TypeScript') {
                devPackagesToInstall.push('@types/pg');
            }
            break;
        case 'MySQL':
            packagesToInstall.push('mysql2', 'bcryptjs');
            if (languageChoice === 'TypeScript') {
                devPackagesToInstall.push('@types/mysql2');
            }
            break;
        case 'SQLite':
            packagesToInstall.push('sqlite3', 'bcryptjs');
            if (languageChoice === 'TypeScript') {
                devPackagesToInstall.push('@types/sqlite3');
            }
            break;
    }

    // Generate package.json
    const packageJson = {
        name: projectName,
        version: '1.0.0',
        type: languageChoice === 'JavaScript' ? 'module' : 'commonjs',
        scripts: {
            start: languageChoice === 'TypeScript' ? 'ts-node server.ts' : 'node server.js',
            dev: languageChoice === 'TypeScript' ? 'nodemon --exec ts-node server.ts' : 'nodemon server.js',
            ...(languageChoice === 'TypeScript' && {
                build: 'tsc',
                'start:prod': 'node dist/server.js'
            })
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
            ...(languageChoice === 'TypeScript' && {
                typescript: '^5.0.0',
                'ts-node': '^10.9.0',
                '@types/node': '^18.0.0',
                '@types/express': '^4.17.0',
                '@types/cors': '^2.8.0',
                '@types/jsonwebtoken': '^9.0.0',
                '@types/bcryptjs': '^2.4.0',
            })
        },
    };

    const packageJsonPath = path.join(targetDir, 'package.json');
    try {
        if (await fs.stat(packageJsonPath).catch(() => false)) {
            if (forceOverwrite) {
                await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
            } else {
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
            }
        } else {
            await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
        }
    } catch (err) {
        console.error(chalk.red(`Error writing package.json: ${err}`));
        process.exit(1);
    }

    // Copy model file
    const modelSourceFile = `user.${databaseChoice.toLowerCase()}.${languageChoice === 'TypeScript' ? 'ts' : 'js'}`;
    const modelTargetFile = `user.${databaseChoice.toLowerCase()}${fileExt}`;
    const modelPath = path.join(templateDir, 'models', modelSourceFile);
    try {
        await fs.access(modelPath);
        if (await fs.stat(path.join(baseDir, 'models', modelTargetFile)).catch(() => false)) {
            if (forceOverwrite) {
                await fs.cp(modelPath, path.join(baseDir, 'models', modelTargetFile));
            } else {
                const { overwrite } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'overwrite',
                        message: chalk.yellow(`File ${modelTargetFile} already exists. Overwrite?`),
                        prefix: '⚠️',
                        default: false,
                    },
                ]);
                if (!overwrite) {
                    console.log(chalk.blue(`Skipping ${modelTargetFile}`));
                    return;
                }
                await fs.cp(modelPath, path.join(baseDir, 'models', modelTargetFile));
            }
        } else {
            await fs.cp(modelPath, path.join(baseDir, 'models', modelTargetFile));
        }
    } catch (err) {
        console.error(chalk.red(`Model file for ${databaseChoice} not found.`));
        process.exit(1);
    }

    // Generate auth controller
    const authControllerSourceFile = `authController.${languageChoice === 'TypeScript' ? 'ts' : 'js'}`;
    const authControllerTargetFile = `authController${fileExt}`;
    const authControllerSourcePath = path.join(templateDir, 'controllers', authControllerSourceFile);
    const authControllerContent = await fs.readFile(authControllerSourcePath, 'utf-8');
    const authControllerPath = path.join(baseDir, 'controllers', authControllerTargetFile);

    try {
        if (await fs.stat(authControllerPath).catch(() => false)) {
            if (forceOverwrite) {
                await fs.writeFile(authControllerPath, authControllerContent);
            } else {
                const { overwrite } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'overwrite',
                        message: chalk.yellow(`File authController.${fileExt} already exists. Overwrite?`),
                        prefix: '⚠️',
                        default: false,
                    },
                ]);
                if (!overwrite) {
                    console.log(chalk.blue(`Skipping authController.${fileExt}`));
                } else {
                    await fs.writeFile(authControllerPath, authControllerContent);
                }
            }
        } else {
            await fs.writeFile(authControllerPath, authControllerContent);
        }
    } catch (err) {
        console.error(chalk.red(`Error writing authController.${fileExt}: ${err}`));
        process.exit(1);
    }

    // Copy server file
    const serverSourceFile = `server.${languageChoice === 'TypeScript' ? 'ts' : 'js'}`;
    const serverTargetFile = `server${fileExt}`;
    const serverPath = path.join(templateDir, serverSourceFile);
    try {
        await fs.access(serverPath);
        if (await fs.stat(path.join(targetDir, serverTargetFile)).catch(() => false)) {
            if (forceOverwrite) {
                await fs.cp(serverPath, path.join(targetDir, serverTargetFile));
            } else {
                const { overwrite } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'overwrite',
                        message: chalk.yellow(`File ${serverTargetFile} already exists. Overwrite?`),
                        prefix: '⚠️',
                        default: false,
                    },
                ]);
                if (!overwrite) {
                    console.log(chalk.blue(`Skipping ${serverTargetFile}`));
                } else {
                    await fs.cp(serverPath, path.join(targetDir, serverTargetFile));
                }
            }
        } else {
            await fs.cp(serverPath, path.join(targetDir, serverTargetFile));
        }
    } catch (err) {
        console.error(chalk.red(`Server file (${serverSourceFile}) not found in backtool_folder.`));
        process.exit(1);
    }

    // Copy TypeScript configuration if needed
    if (languageChoice === 'TypeScript') {
        try {
            await fs.cp(
                path.join(templateDir, 'tsconfig.json'),
                path.join(targetDir, 'tsconfig.json')
            );
            await fs.mkdir(path.join(targetDir, 'src'), { recursive: true });
            await fs.mkdir(path.join(targetDir, 'dist'), { recursive: true });
            await fs.mkdir(path.join(targetDir, 'types'), { recursive: true });
            
            // Copy express.d.ts
            await fs.cp(
                path.join(templateDir, 'types', 'express.d.ts'),
                path.join(targetDir, 'types', 'express.d.ts')
            );
        } catch (err) {
            console.error(chalk.red('Error setting up TypeScript configuration:', err));
            process.exit(1);
        }
    }

    // Write database configuration
    let dbConfig = '';

    // Database configuration
    switch (databaseChoice) {
        case 'MongoDB':
            dbConfig = `import mongoose from 'mongoose';

mongoose.connect('${uri || `mongodb://localhost:27017/${projectName}`}');

mongoose.set('strictQuery', true);

export const database = 'mongodb';`;
            break;
        case 'PostgreSQL':
            dbConfig = `import { Pool } from 'pg';

const pool = new Pool({
  connectionString: '${uri || `postgres://postgres@localhost:5432/${projectName}`}'
});

await pool.query(
  'CREATE TABLE IF NOT EXISTS users (\\n' +
  '    id SERIAL PRIMARY KEY,\\n' +
  '    username VARCHAR(255) UNIQUE NOT NULL,\\n' +
  '    email VARCHAR(255) UNIQUE NOT NULL,\\n' +
  '    password VARCHAR(255) NOT NULL,\\n' +
  '    created_at TIMESTAMP DEFAULT NOW()\\n' +
  ')'
);

export const database = 'postgresql';`;
            break;
        case 'MySQL':
            dbConfig = `import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  uri: '${uri || `mysql://root@localhost:3306/${projectName}`}'
});

await pool.query(
  'CREATE TABLE IF NOT EXISTS users (\\n' +
  '    id INT AUTO_INCREMENT PRIMARY KEY,\\n' +
  '    username VARCHAR(255) UNIQUE NOT NULL,\\n' +
  '    email VARCHAR(255) UNIQUE NOT NULL,\\n' +
  '    password VARCHAR(255) NOT NULL,\\n' +
  '    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\\n' +
  ')'
);

export const database = 'mysql';`;
            break;
        case 'SQLite':
            dbConfig = `import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: '${uri || './database.sqlite'}',
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
);

export const database = 'sqlite';`;
            break;
    }

    await fs.writeFile(path.join(baseDir, 'config', `database${fileExt}`), dbConfig);

    // Copy additional structure (routes, middleware)
    const structure = [
        { 
            files: ['auth'],
            dir: 'routes'
        },
        { 
            files: ['auth'],
            dir: 'middleware'
        }
    ];

    for (const { files, dir } of structure) {
        for (const file of files) {
            const sourceFile = `${file}.${languageChoice === 'TypeScript' ? 'ts' : 'js'}`;
            const targetFile = `${file}${fileExt}`;
            const sourcePath = path.join(templateDir, dir, sourceFile);
            // Use only the dir once in the target path
            const targetPath = path.join(baseDir, dir, targetFile);

            try {
                // console.log(chalk.blue(`Attempting to copy ${sourceFile} to ${targetFile}`));
                // console.log(chalk.blue(`Source path: ${sourcePath}`));
                // console.log(chalk.blue(`Target path: ${targetPath}`));

                // First check if source file exists
                try {
                    await fs.access(sourcePath);
                    // console.log(chalk.green(`Source file exists: ${sourcePath}`));
                } catch (err) {
                    // console.error(chalk.red(`Source file not found: ${sourcePath}`));
                    continue;
                }

                // Check if target file exists
                const targetExists = await fs.stat(targetPath).catch(() => false);
                
                if (targetExists) {
                    if (forceOverwrite) {
                        await fs.copyFile(sourcePath, targetPath);
                        console.log(chalk.green(`Forcefully copied ${sourceFile} to ${targetFile}`));
                    } else {
                        const { overwrite } = await inquirer.prompt([
                            {
                                type: 'confirm',
                                name: 'overwrite',
                                message: chalk.yellow(`File ${targetFile} already exists. Overwrite?`),
                                prefix: '⚠️',
                                default: false,
                            },
                        ]);
                        if (!overwrite) {
                            console.log(chalk.blue(`Skipping ${targetFile}`));
                            continue;
                        }
                        await fs.copyFile(sourcePath, targetPath);
                        console.log(chalk.green(`Copied ${sourceFile} to ${targetFile} after confirmation`));
                    }
                } else {
                    await fs.copyFile(sourcePath, targetPath);
                    // console.log(chalk.green(`Copied ${sourceFile} to ${targetFile}`));
                }
            } catch (err) {
                console.error(chalk.red(`Error handling ${sourceFile}:`));
                console.error(chalk.red(err.message));
                if (err.code) {
                    console.error(chalk.red(`Error code: ${err.code}`));
                }
            }
        }
    }

    // Copy .env.example to .env
    const envExamplePath = path.join(templateDir, '.env.example');
    const envTargetPath = path.join(targetDir, '.env');
    try {
        await fs.access(envExamplePath);
        const envExists = await fs.stat(envTargetPath).catch(() => false);
        
        if (envExists) {
            if (forceOverwrite) {
                await fs.copyFile(envExamplePath, envTargetPath);
                console.log(chalk.green('Environment file (.env) created from template'));
            } else {
                const { overwrite } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'overwrite',
                        message: chalk.yellow('File .env already exists. Overwrite?'),
                        prefix: '⚠️',
                        default: false,
                    },
                ]);
                if (overwrite) {
                    await fs.copyFile(envExamplePath, envTargetPath);
                    console.log(chalk.green('Environment file (.env) created from template'));
                } else {
                    console.log(chalk.blue('Skipping .env file'));
                }
            }
        } else {
            await fs.copyFile(envExamplePath, envTargetPath);
            console.log(chalk.green('Environment file (.env) created from template'));
        }
    } catch (err) {
        console.log(chalk.yellow('⚠️  .env.example template not found - skipping .env creation'));
    }

    // Copy .gitignore
    const gitignorePath = path.join(templateDir, '.gitignore');
    const gitignoreTargetPath = path.join(targetDir, '.gitignore');
    try {
        await fs.access(gitignorePath);
        const gitignoreExists = await fs.stat(gitignoreTargetPath).catch(() => false);
        
        if (gitignoreExists) {
            if (forceOverwrite) {
                await fs.copyFile(gitignorePath, gitignoreTargetPath);
                console.log(chalk.green('.gitignore file created'));
            } else {
                const { overwrite } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'overwrite',
                        message: chalk.yellow('File .gitignore already exists. Overwrite?'),
                        prefix: '⚠️',
                        default: false,
                    },
                ]);
                if (overwrite) {
                    await fs.copyFile(gitignorePath, gitignoreTargetPath);
                    console.log(chalk.green('.gitignore file created'));
                } else {
                    console.log(chalk.blue('Skipping .gitignore file'));
                }
            }
        } else {
            await fs.copyFile(gitignorePath, gitignoreTargetPath);
            console.log(chalk.green('.gitignore file created'));
        }
    } catch (err) {
        console.log(chalk.yellow('⚠️  .gitignore template not found - skipping .gitignore creation'));
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

    console.log(chalk.green(`🎉 Backend structure generated for ${projectName} with ${databaseChoice} configuration in ${targetDir}!`));
}

program.action(async (options) => {
    const answers = await promptInputs(options);
    const projectName = options.project || answers.project || 'my-app';
    const database = options.database || answers.database;
    const language = options.language || answers.language || 'JavaScript';

    await generateBackendStructure(projectName, database, language, options.force, options.uri);
});

program.parse(process.argv);