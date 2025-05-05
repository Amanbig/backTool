![portfolio-website](https://socialify.git.ci/Amanbig/backTool/image?font=Source+Code+Pro&language=1&name=1&owner=1&pattern=Brick+Wall&theme=Dark)

# BackTool

A CLI tool to generate backend structures for Node.js applications with support for multiple databases and a visually appealing user interface.

## Overview

BackTool simplifies the process of setting up a Node.js backend by generating a complete project structure, including a server entry point, models, database configuration, controllers, routes, middleware, and a customized `package.json`. It supports MongoDB, PostgreSQL, MySQL, and SQLite, allowing developers to quickly scaffold a backend tailored to their preferred database.

## Features

- **Database Support**: Generates configurations and models for MongoDB, PostgreSQL, MySQL, and SQLite.
- **Interactive Prompts**: Uses `inquirer` for styled, user-friendly prompts with custom prefixes and validation.
- **Visual Feedback**: Includes an ASCII art banner (`figlet`), colored output (`chalk`), and progress spinners (`ora`).
- **Non-Interactive Mode**: Supports command-line arguments for automation (e.g., `backtool --project my-app --database MongoDB`).
- **Complete Backend Structure**: Creates `server.js`, `package.json`, and directories for `models`, `config`, `controllers`, `routes`, and `middleware`.
- **Customized package.json**: Generates a `package.json` with the project name, scripts (`start`, `dev`), and dependencies.
- **Automatic Package Installation**: Installs required dependencies (e.g., `express`, `mongoose`, `pg`, `mysql2`, `sqlite3`) and `nodemon` as a dev dependency.
- **File Overwrite Protection**: Prompts users before overwriting existing files (e.g., `server.js`, `package.json`, model files).
- **Extensible**: Easily add new databases or structure components by updating the template folder.

## Installation

Install BackTool globally to use it from any directory:

```bash
npm install -g backtool
```

Alternatively, clone the repository and link it locally:

```bash
git clone https://github.com/Amanbig/backtool.git
cd backtool
npm install
npm link
```

## Usage

### Interactive Mode
Run BackTool without arguments to use interactive prompts:

```bash
backtool
```

or directly using:

```bash
npx backtool@latest
```

This will display an ASCII banner and prompt for:
- Project name (e.g., `my-app`)
- Database choice (MongoDB, MySQL, PostgreSQL, or SQLite)

### Non-Interactive Mode
Specify options directly to skip prompts:

```bash
backtool --project my-app --database MongoDB
```

### Options
- `-p, --project <name>`: Specify the project name (default: `my-app`).
- `-d, --database <type>`: Specify the database (MongoDB, MySQL, PostgreSQL, SQLite).
- `-v, --version`: Display the version number.
- `-h, --help`: Show help information.

## Generated Structure

Running BackTool creates the following directory structure in the current working directory:

```
my-app/
├── server.js
├── package.json
├── config/
│   └── database.js
├── models/
│   └── user.<database>.js
├── controllers/
│   └── userController.js
├── routes/
│   └── userRoutes.js
├── middleware/
│   └── auth.js
├── node_modules/
└── .env
```

- **server.js**: Entry point for the Node.js application, setting up the Express server and routes.
- **package.json**: Includes the project name, scripts (`start: node server.js`, `dev: nodemon server.js`), and dependencies.
- **config/database.js**: Database connection and table initialization (e.g., `users` table for SQL databases).
- **models/user.<database>.js**: Model file for the selected database (e.g., `user.mongodb.js`, `user.sqlite.js`).
- **controllers/**: Logic for handling requests (e.g., user creation, authentication).
- **routes/**: API route definitions.
- **middleware/**: Custom middleware (e.g., authentication).

The `users` table/model includes fields: `id`, `username`, `email`, `password`, and `created_at`.

## Running the Application

After generating the project, navigate to the project directory and run:

```bash
npm start
```

For development with auto-restart on file changes:

```bash
npm run dev
```

## Supported Databases

- **MongoDB**: Uses `mongoose` for schema-based modeling.
- **PostgreSQL**: Uses `pg` with a connection pool and SQL queries.
- **MySQL**: Uses `mysql2` with a promise-based connection pool.
- **SQLite**: Uses `sqlite3` and `sqlite` for lightweight, file-based storage.

## Dependencies

BackTool installs the following dependencies in the generated project:

- **Dependencies**: `express`, `dotenv`, `cors`, and database-specific packages:
  - MongoDB: `mongoose`, `bcryptjs`
  - PostgreSQL: `pg`, `bcryptjs`
  - MySQL: `mysql2`, `bcryptjs`
  - SQLite: `sqlite3`, `bcryptjs`
- **Dev Dependencies**: `nodemon`

## Development

To contribute or modify BackTool:

1. Clone the repository:
   ```bash
   git clone https://github.com/Amanbig/backtool.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update the `backtool_folder` directory with custom templates (e.g., `server.js`, models).
4. Test locally:
   ```bash
   npm link
   backtool --project test-app --database SQLite
   ```

## License

MIT License

## Contact

For issues or feature requests, open a ticket on the [GitHub repository](https://github.com/Amanbig/backtool).
