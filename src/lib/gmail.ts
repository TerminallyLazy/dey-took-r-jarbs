import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface JobNotification {
  title: string;
  company: string;
  location: string;
  salary: string | null;
  url: string;
  confidenceScore: number | null;
}

export async function sendNewJobsNotification(jobs: JobNotification[]): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log("Gmail not configured, skipping notification");
    return;
  }

  if (jobs.length === 0) return;

  const jobRows = jobs
    .map(
      (job) => `
    <tr style="border-bottom: 1px solid #1e293b;">
      <td style="padding: 12px 16px;">
        <a href="${job.url}" style="color: #22d3ee; text-decoration: none; font-weight: 600;">${job.title}</a>
        <div style="color: #94a3b8; font-size: 13px; margin-top: 2px;">${job.company}</div>
      </td>
      <td style="padding: 12px 16px; color: #cbd5e1;">${job.location}</td>
      <td style="padding: 12px 16px; color: #10b981; font-weight: 600;">${job.salary || "N/A"}</td>
      <td style="padding: 12px 16px; text-align: center;">
        <span style="
          display: inline-block;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          background: ${job.confidenceScore && job.confidenceScore >= 70 ? "#064e3b" : job.confidenceScore && job.confidenceScore >= 40 ? "#78350f" : "#1e293b"};
          color: ${job.confidenceScore && job.confidenceScore >= 70 ? "#6ee7b7" : job.confidenceScore && job.confidenceScore >= 40 ? "#fcd34d" : "#94a3b8"};
        ">${job.confidenceScore ? `${job.confidenceScore}%` : "—"}</span>
      </td>
    </tr>`
    )
    .join("");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px; max-width: 720px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #f8fafc; margin: 0;">
          New Jobs Found
        </h1>
        <p style="color: #64748b; margin-top: 8px; font-size: 14px;">
          ${jobs.length} new position${jobs.length !== 1 ? "s" : ""} matched your search criteria
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #334155;">
            <th style="padding: 12px 16px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Position</th>
            <th style="padding: 12px 16px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Location</th>
            <th style="padding: 12px 16px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Salary</th>
            <th style="padding: 12px 16px; text-align: center; color: #94a3b8; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Match</th>
          </tr>
        </thead>
        <tbody>
          ${jobRows}
        </tbody>
      </table>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}" style="
          display: inline-block;
          padding: 12px 32px;
          background: linear-gradient(135deg, #0891b2, #06b6d4);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
        ">View All Jobs</a>
      </div>

      <p style="color: #475569; font-size: 12px; text-align: center; margin-top: 24px;">
        Dey Took R Jarbs — Automated Job Tracker
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Job Tracker" <${process.env.GMAIL_USER}>`,
    to: process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER,
    subject: `${jobs.length} New Job${jobs.length !== 1 ? "s" : ""} Found`,
    html,
  });
}
