#!/usr/bin/env node
import figlet from "figlet";
import inquirer from "inquirer";

figlet("BackTool", function(err, data) {

    inquirer
        .prompt([
            /* Pass your questions in here */
            {
                type: "list",
                name: "tool",
                message: "Which database do you want to use?",
                choices: ["MongoDB", "MySQL", "PostgreSQL", "SQLite"],
            },
        ])
        .then((answers) => {
            // Use user feedback for... whatever!!
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