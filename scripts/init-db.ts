import { initializeDatabase } from "../lib/db"

// Run the database initialization
async function main() {
  try {
    console.log("Initializing PostgreSQL database...")

    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL environment variable is not set")
      process.exit(1)
    }

    console.log("Database URL:", process.env.DATABASE_URL.replace(/:[^:@]*@/, ":****@"))

    // Initialize the database
    await initializeDatabase()
    console.log("Database initialization complete!")

    // Exit successfully
    process.exit(0)
  } catch (error) {
    console.error("Error initializing database:", error)
    process.exit(1)
  }
}

main()
