BackTool
A CLI tool to generate backend structures for Node.js applications.
Installation
npm install -g backtool

Usage
Run interactively:
backtool

Run non-interactively:
backtool --project my-app --database MongoDB

Options

-p, --project <name>: Specify project name
-d, --database <type>: Specify database (MongoDB, MySQL, PostgreSQL, SQLite)
-v, --version: Output the version number
-h, --help: Display help for command

Features

Generates a complete backend structure with models, controllers, routes, and middleware.
Supports MongoDB, PostgreSQL, MySQL, and SQLite.
Interactive prompts with visual styling for a better user experience.
Automatic package installation with progress feedback.

