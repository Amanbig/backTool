#!/usr/bin/env node
import figlet from "figlet";
import inquirer from "inquirer";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateBackendStructure(databaseChoice) {
    const templateDir = path.join(__dirname, "backtool_folder");
    const targetDir = process.cwd();

    try {
        // Copy all template files
        await fs.cp(templateDir, targetDir, { recursive: true });

        // Database-specific configuration
        let dbConfig = "";
        switch (databaseChoice) {
            case "MongoDB":
                dbConfig = `const mongoose = require('mongoose');

                            mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp', {
                                useNewUrlParser: true,
                                useUnifiedTopology: true
                            });`;
                break;
            case "PostgreSQL":
                dbConfig = `const { Pool } = require('pg');

                            const pool = new Pool({
                                user: process.env.PGUSER || 'postgres',
                                host: process.env.PGHOST || 'localhost',
                                database: process.env.PGDATABASE || 'myapp',
                                password: process.env.PGPASSWORD || '',
                                port: process.env.PGPORT || 5432
                            });`;
                break;
            // Add other database configurations
        }
        await fs.writeFile(path.join(targetDir, "config", "database.js"), dbConfig);

        console.log(`Backend structure generated with ${databaseChoice} configuration`);
    } catch (err) {
        console.error("Error generating backend structure:", err);
    }
}

figlet("BackTool", function (err, data) {
    if (err) {
        console.log("Something went wrong...");
        console.dir(err);
        return;
    }
    console.log(data);

    inquirer
        .prompt([
            {
                type: "input",
                name: "projectName",
                message: "What is your project name?",
            },
            {
                type: "list",
                name: "database",
                message: "Which database do you want to use?",
                choices: ["MongoDB", "MySQL", "PostgreSQL", "SQLite"],
            },
        ])
        .then((answers) => {
            generateBackendStructure(answers.database);
        })
        .catch((error) => {
            if (error.isTtyError) {
                // Prompt couldn't be rendered in the current environment
            } else {
                // Something else went wrong
            }
        });
    if (err) {
        console.log("Something went wrong...");
        console.dir(err);
        return;
    }
    console.log(data)
});