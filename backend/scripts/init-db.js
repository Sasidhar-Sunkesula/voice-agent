#!/usr/bin/env node

/**
 * Database initialization script
 *
 * This script initializes the database by running Prisma migrations
 * and optionally seeding the database with sample data.
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Check if .env file exists
if (!fs.existsSync(path.join(__dirname, "..", ".env"))) {
  console.log("Creating .env file from .env.example...");
  fs.copyFileSync(
    path.join(__dirname, "..", ".env.example"),
    path.join(__dirname, "..", ".env")
  );
  console.log(
    "Created .env file. Please update it with your database credentials."
  );
}

// Run database migrations
console.log("Running database migrations...");
try {
  execSync("npx prisma migrate dev --name init", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });
  console.log("Database migrations completed successfully.");
} catch (error) {
  console.error("Error running database migrations:", error.message);
  process.exit(1);
}

// Generate Prisma client
console.log("Generating Prisma client...");
try {
  execSync("npx prisma generate", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });
  console.log("Prisma client generated successfully.");
} catch (error) {
  console.error("Error generating Prisma client:", error.message);
  process.exit(1);
}

// Automatically seed the database
console.log("Seeding database with sample data...");
try {
  execSync("node prisma/seed.js", { stdio: "inherit", cwd: path.join(__dirname, "..") });
  console.log("Database seeded successfully.");
} catch (error) {
  console.error("Error seeding database:", error.message);
  process.exit(1);
}

console.log("Database initialization and seeding completed.");

// Exit process
process.exit(0);
