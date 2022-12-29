const {
  showWarning,
  showError,
  showMultipleProgress,
} = require("cybersaksham-npm-logs");
const validateProjectName = require("validate-npm-package-name");
const { checkNodeVersion } = require("./versions");
const path = require("path");
const fs = require("fs-extra");
const chalk = require("chalk");

// Code Imports
const structure = require("./code/structure.json");
const { aboutQuestions } = require("./code/questions");

module.exports.createApp = async (name, version) => {
  // if (!checkNodeVersion()) {
  //   showWarning({
  //     warnings: [
  //       `You are using Node ${process.version} so the project will be bootstrapped with an old unsupported version of tools.`,
  //       `Please update to Node 14 or higher for a better, fully supported experience.`,
  //     ],
  //     summary: ["Falling to react scripts version react-scripts@0.9.x"],
  //   });
  //   // Fall back to latest supported react-scripts on Node 4
  //   version = "react-scripts@0.9.x";
  // }

  // const root = path.resolve(name);
  // const appName = path.basename(root);
  // checkAppName(appName);

  // // Checking directory
  // fs.ensureDirSync(name);
  // isSafeToCreateProjectIn(root, name);

  // // Start creating the project
  // console.log();
  // console.log(`Creating a new Portfolio project in ${chalk.green(root)}.`);
  // console.log();

  // await downloadFiles(root);
  await addData();
};

const checkAppName = (appName) => {
  const validationResult = validateProjectName(appName);
  if (!validationResult.validForNewPackages) {
    // Show Errors
    let errors = [
      `Cannot create a project named ${chalk.green(
        `"${appName}"`
      )} because of npm naming restrictions:`,
    ];
    let validationErrors = [
      ...(validationResult.errors || []),
      ...(validationResult.warnings || []),
    ];
    if (validationErrors.length > 0) {
      errors.push("Found errors are:");
      validationErrors.forEach((err) => {
        errors.push(chalk.red(`  *${err}`));
      });
    }
    showError({
      code: 400,
      errors,
      summary: ["Please choose a different project name."],
    });

    process.exit(1);
  }

  // TODO: fetch dependencies from package.json file to be added
  const dependencies = ["react", "react-dom", "react-scripts"].sort();
  if (dependencies.includes(appName)) {
    let errors = [
      `Cannot create a project named ${chalk.green(
        `"${appName}"`
      )} because a dependency with the same name exists.`,
      `Due to the way npm works, the following names are not allowed:`,
    ];
    dependencies.map((dep) => {
      errors.push(chalk.cyan(`  ${dep}`));
    });
    showError({
      code: 400,
      errors,
      summary: ["Please choose a different project name."],
    });
    process.exit(1);
  }
};

// If project only contains files generated by GH, it’s safe.
// Also, if project contains remnant error logs from a previous
// installation, lets remove them now.
// We also special case IJ-based products .idea because it integrates with CRA:
// https://github.com/facebook/create-react-app/pull/368#issuecomment-243446094
const isSafeToCreateProjectIn = (root, name) => {
  const validFiles = [
    ".DS_Store",
    ".git",
    ".gitattributes",
    ".gitignore",
    ".gitlab-ci.yml",
    ".hg",
    ".hgcheck",
    ".hgignore",
    ".idea",
    ".npmignore",
    ".travis.yml",
    "docs",
    "LICENSE",
    "README.md",
    "mkdocs.yml",
    "Thumbs.db",
  ];
  // These files should be allowed to remain on a failed install, but then
  // silently removed during the next create.
  const errorLogFilePatterns = [
    "npm-debug.log",
    "yarn-error.log",
    "yarn-debug.log",
  ];
  const isErrorLog = (file) => {
    return errorLogFilePatterns.some((pattern) => file.startsWith(pattern));
  };

  const conflicts = fs
    .readdirSync(root)
    .filter((file) => !validFiles.includes(file))
    // IntelliJ IDEA creates module files before CRA is launched
    .filter((file) => !/\.iml$/.test(file))
    // Don't treat log files from previous installation as conflicts
    .filter((file) => !isErrorLog(file));

  if (conflicts.length > 0) {
    let errors = [
      `The directory ${chalk.green(name)} contains files that could conflict:`,
      "",
    ];
    for (const file of conflicts) {
      try {
        const stats = fs.lstatSync(path.join(root, file));
        if (stats.isDirectory()) {
          errors.push(`  ${chalk.blue(`${file}/`)}`);
        } else {
          errors.push(`  ${chalk.green(`${file}/`)}`);
        }
      } catch (e) {
        // Ignore
      }
    }

    showError({
      code: 400,
      errors,
      summary: [
        "Either try using a new directory name, or remove the files listed above.",
      ],
    });
    process.exit(1);
  }

  // Remove any log files from a previous installation.
  fs.readdirSync(root).forEach((file) => {
    if (isErrorLog(file)) {
      fs.removeSync(path.join(root, file));
    }
  });
};

// Download files from the github repository
// https://github.com/cybersaksham/Portfolio-Generator/tree/master/Required%20Code
const downloadFiles = async (root) => {
  structure.folders.forEach((dir) => {
    fs.ensureDirSync(path.join(root, dir));
  });

  const fileList = [];
  structure.files.forEach(({ name, source }) => {
    fileList.push({
      source,
      destination: path.join(root, name),
    });
  });

  await showMultipleProgress(fileList);
};

// Add Data to files
// Ask data from user and add to files
const addData = async () => {
  const aboutData = await aboutQuestions();
  console.log(aboutData);
};
