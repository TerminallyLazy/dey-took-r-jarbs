import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "salary" TEXT,
    "salaryMin" REAL,
    "salaryMax" REAL,
    "description" TEXT NOT NULL,
    "summary" TEXT,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'indeed',
    "postedDate" DATETIME,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicantCount" TEXT,
    "jobType" TEXT,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "confidenceScore" REAL,
    "skills" TEXT,
    "isNew" BOOLEAN NOT NULL DEFAULT true,
    "isHidden" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'interested',
    "appliedDate" DATETIME,
    "notes" TEXT,
    "resumeUsed" TEXT,
    "followUpDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "CoverLetter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'professional',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoverLetter_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Note_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ScrapeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "jobsFound" INTEGER NOT NULL DEFAULT 0,
    "newJobs" INTEGER NOT NULL DEFAULT 0,
    "duplicates" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

CREATE TABLE IF NOT EXISTS "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "skills" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "education" TEXT,
    "resumeText" TEXT,
    "preferences" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "SearchConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "Job_externalId_key" ON "Job"("externalId");
CREATE INDEX IF NOT EXISTS "Job_company_idx" ON "Job"("company");
CREATE INDEX IF NOT EXISTS "Job_postedDate_idx" ON "Job"("postedDate");
CREATE INDEX IF NOT EXISTS "Job_confidenceScore_idx" ON "Job"("confidenceScore");
CREATE INDEX IF NOT EXISTS "Job_isNew_idx" ON "Job"("isNew");
CREATE UNIQUE INDEX IF NOT EXISTS "Application_jobId_key" ON "Application"("jobId");
CREATE INDEX IF NOT EXISTS "Application_status_idx" ON "Application"("status");
CREATE INDEX IF NOT EXISTS "CoverLetter_jobId_idx" ON "CoverLetter"("jobId");
CREATE INDEX IF NOT EXISTS "Note_jobId_idx" ON "Note"("jobId");
`;

export async function POST(request: NextRequest) {
  try {
    // Protect with cron secret
    const { secret } = await request.json();
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
    if (!url) {
      return NextResponse.json(
        { error: "No database URL configured" },
        { status: 500 }
      );
    }

    const client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Execute each statement separately (libSQL doesn't support multi-statement)
    const statements = SCHEMA_SQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const results = [];
    for (const stmt of statements) {
      await client.execute(stmt);
      results.push(`OK: ${stmt.substring(0, 60)}...`);
    }

    return NextResponse.json({
      success: true,
      message: "Database schema created successfully",
      tablesCreated: results.length,
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      {
        error: "Setup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
