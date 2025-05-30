import { Pool, type PoolClient } from "pg";
import { join } from "path";
import fs from "fs";

// Determine if we're in a Vercel environment
const isVercel = process.env.VERCEL === "1";

// Ensure the data directory exists (for local development)
if (!isVercel) {
  const dataDir = join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

// Initialize the database schema if it doesn't exist
export async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log("Creating database schema...");

    // Create teams table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create challenges table
    await client.query(`
      CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        points INTEGER NOT NULL,
        penalty_points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create checkpoints table
    await client.query(`
      CREATE TABLE IF NOT EXISTS checkpoints (
        id TEXT PRIMARY KEY,
        challenge_id TEXT NOT NULL,
        name TEXT NOT NULL,
        points INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
      )
    `);

    // Create solved_challenges table
    await client.query(`
      CREATE TABLE IF NOT EXISTS solved_challenges (
        id SERIAL PRIMARY KEY,
        team_id TEXT NOT NULL,
        challenge_id TEXT NOT NULL,
        solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, challenge_id),
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
      )
    `);

    // Create solved_checkpoints table
    await client.query(`
      CREATE TABLE IF NOT EXISTS solved_checkpoints (
        id SERIAL PRIMARY KEY,
        team_id TEXT NOT NULL,
        checkpoint_id TEXT NOT NULL,
        solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, checkpoint_id),
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id) ON DELETE CASCADE
      )
    `);

    // Create submissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        team_id TEXT NOT NULL,
        challenge_id TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL DEFAULT FALSE,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
      )
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add penalty_points column if it doesn't exist (for existing databases)
    try {
      await client.query(`
        ALTER TABLE challenges 
        ADD COLUMN IF NOT EXISTS penalty_points INTEGER DEFAULT 0
      `);
    } catch (error) {
      // Column might already exist, ignore error
      console.log("penalty_points column already exists or error adding it");
    }

    // Check if we need to seed the database with initial data
    const teamsResult = await client.query(
      "SELECT COUNT(*) as count FROM teams"
    );
    const teamsCount = Number.parseInt(teamsResult.rows[0].count);
    console.log(`Found ${teamsCount} existing teams`);

    if (teamsCount === 0) {
      console.log("Seeding database with initial data...");
      await seedDatabase(client);
      console.log("Database seeding complete");
    } else {
      console.log("Database already contains data, skipping seed");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Seed the database with initial data
async function seedDatabase(client: PoolClient) {
  try {
    // Begin transaction
    await client.query("BEGIN");

    // Insert initial challenges
    const challenges = [
      {
        id: "c1",
        name: "Web Exploitation",
        description: "Find and exploit a web vulnerability",
        type: "non-interactive",
        points: 500,
        penalty_points: 50,
      },
      {
        id: "c2",
        name: "Cryptography",
        description: "Decrypt the hidden message",
        type: "non-interactive",
        points: 750,
        penalty_points: 75,
      },
      {
        id: "c3",
        name: "Reverse Engineering",
        description: "Analyze and understand the binary",
        type: "interactive",
        points: 1000,
        penalty_points: 0, // Interactive challenges don't have penalties
      },
      {
        id: "c4",
        name: "Forensics",
        description: "Recover deleted data",
        type: "non-interactive",
        points: 800,
        penalty_points: 80,
      },
      {
        id: "c5",
        name: "Binary Exploitation",
        description: "Exploit a buffer overflow",
        type: "interactive",
        points: 1200,
        penalty_points: 0, // Interactive challenges don't have penalties
      },
    ];

    // Insert challenges
    for (const challenge of challenges) {
      await client.query(
        "INSERT INTO challenges (id, name, description, type, points, penalty_points) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          challenge.id,
          challenge.name,
          challenge.description,
          challenge.type,
          challenge.points,
          challenge.penalty_points,
        ]
      );

      // Add checkpoints for interactive challenges
      if (challenge.id === "c3") {
        const checkpoints = [
          { id: "c3-1", name: "Identify the file format", points: 100 },
          { id: "c3-2", name: "Decompile the binary", points: 150 },
          { id: "c3-3", name: "Find the main function", points: 200 },
          {
            id: "c3-4",
            name: "Identify the encryption algorithm",
            points: 250,
          },
          { id: "c3-5", name: "Extract the hidden message", points: 300 },
        ];

        for (const checkpoint of checkpoints) {
          await client.query(
            "INSERT INTO checkpoints (id, challenge_id, name, points) VALUES ($1, $2, $3, $4)",
            [checkpoint.id, challenge.id, checkpoint.name, checkpoint.points]
          );
        }
      } else if (challenge.id === "c5") {
        const checkpoints = [
          { id: "c5-1", name: "Identify the vulnerability", points: 150 },
          { id: "c5-2", name: "Craft the payload", points: 200 },
          { id: "c5-3", name: "Bypass ASLR", points: 250 },
          { id: "c5-4", name: "Achieve code execution", points: 300 },
          { id: "c5-5", name: "Escalate privileges", points: 300 },
        ];

        for (const checkpoint of checkpoints) {
          await client.query(
            "INSERT INTO checkpoints (id, challenge_id, name, points) VALUES ($1, $2, $3, $4)",
            [checkpoint.id, challenge.id, checkpoint.name, checkpoint.points]
          );
        }
      }
    }

    // Insert initial teams
    const teams = [
      { id: "1", name: "Team Alpha" },
      { id: "2", name: "Team Omega" },
      { id: "3", name: "Team Phoenix" },
      { id: "4", name: "Team Nexus" },
      { id: "5", name: "Team Quantum" },
    ];

    for (const team of teams) {
      await client.query("INSERT INTO teams (id, name) VALUES ($1, $2)", [
        team.id,
        team.name,
      ]);
    }

    // Insert initial solved challenges
    const solvedChallenges = [
      { team_id: "1", challenge_id: "c1" },
      { team_id: "1", challenge_id: "c2" },
      { team_id: "1", challenge_id: "c3" },
      { team_id: "2", challenge_id: "c1" },
      { team_id: "2", challenge_id: "c2" },
      { team_id: "3", challenge_id: "c1" },
      { team_id: "3", challenge_id: "c4" },
      { team_id: "4", challenge_id: "c2" },
      { team_id: "4", challenge_id: "c5" },
      { team_id: "5", challenge_id: "c3" },
    ];

    for (const solvedChallenge of solvedChallenges) {
      await client.query(
        "INSERT INTO solved_challenges (team_id, challenge_id) VALUES ($1, $2)",
        [solvedChallenge.team_id, solvedChallenge.challenge_id]
      );
    }

    // Insert initial solved checkpoints
    const solvedCheckpoints = [
      { team_id: "1", checkpoint_id: "c3-1" },
      { team_id: "1", checkpoint_id: "c3-2" },
      { team_id: "1", checkpoint_id: "c3-3" },
      { team_id: "4", checkpoint_id: "c5-1" },
      { team_id: "4", checkpoint_id: "c5-2" },
      { team_id: "4", checkpoint_id: "c5-3" },
      { team_id: "4", checkpoint_id: "c5-4" },
      { team_id: "5", checkpoint_id: "c3-1" },
      { team_id: "5", checkpoint_id: "c3-2" },
      { team_id: "5", checkpoint_id: "c3-3" },
      { team_id: "5", checkpoint_id: "c3-4" },
      { team_id: "5", checkpoint_id: "c3-5" },
    ];

    for (const solvedCheckpoint of solvedCheckpoints) {
      await client.query(
        "INSERT INTO solved_checkpoints (team_id, checkpoint_id) VALUES ($1, $2)",
        [solvedCheckpoint.team_id, solvedCheckpoint.checkpoint_id]
      );
    }

    // Insert some sample submissions
    const submissions = [
      {
        team_id: "1",
        challenge_id: "c1",
        is_correct: false,
      },
      {
        team_id: "1",
        challenge_id: "c1",
        is_correct: false,
      },
      {
        team_id: "1",
        challenge_id: "c1",
        is_correct: true,
      },
      {
        team_id: "2",
        challenge_id: "c1",
        is_correct: true,
      },
      {
        team_id: "3",
        challenge_id: "c2",
        is_correct: false,
      },
      {
        team_id: "3",
        challenge_id: "c2",
        is_correct: false,
      },
    ];

    for (const submission of submissions) {
      await client.query(
        "INSERT INTO submissions (team_id, challenge_id, is_correct) VALUES ($1, $2, $3)",
        [submission.team_id, submission.challenge_id, submission.is_correct]
      );
    }

    // Insert default admin user
    const bcrypt = require("bcrypt");
    const adminPasswordHash = await bcrypt.hash("admin123", 10);

    await client.query(
      "INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING",
      ["admin", "admin", "admin@example.com", adminPasswordHash, "admin"]
    );

    // Commit transaction
    await client.query("COMMIT");
  } catch (error) {
    // Rollback on error
    await client.query("ROLLBACK");
    throw error;
  }
}

// Export the pool for use in other modules
export { pool };

// Export a function to ensure the database is initialized
export async function ensureDatabaseInitialized() {
  try {
    const client = await pool.connect();
    try {
      // Try to query the database
      const result = await client.query("SELECT COUNT(*) as count FROM teams");
      return Number.parseInt(result.rows[0].count) > 0;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database error, attempting to reinitialize:", error);
    // If there was an error, try to initialize the database
    await initializeDatabase();
    return false;
  }
}

// Helper function to get a client from the pool
export async function getClient() {
  return await pool.connect();
}
