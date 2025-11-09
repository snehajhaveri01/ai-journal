import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";

    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1].trim();
    if (!token) {
      return NextResponse.json({ error: "Empty token" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);

    // Get query parameters
    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "json"; // json, markdown, csv
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Query entries
    let query = adminDb
      .collection("entries")
      .where("uid", "==", decoded.uid)
      .orderBy("createdAt", "desc");

    // Apply date filters if provided
    if (startDate) {
      query = query.where("createdAt", ">=", new Date(startDate));
    }
    if (endDate) {
      query = query.where("createdAt", "<=", new Date(endDate));
    }

    const snapshot = await query.get();

    const entries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text || "",
        summary: data.summary || "",
        mood: data.mood || "neutral",
        moodScore: data.moodScore || 0,
        topics: data.topics || [],
        emotions: data.emotions || {},
        categories: data.categories || [],
        entities: data.entities || { people: [], places: [], events: [] },
        sentiment: data.sentiment || { primary: "neutral" },
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      };
    });

    // Format based on requested type
    if (format === "json") {
      return NextResponse.json({
        exportDate: new Date().toISOString(),
        totalEntries: entries.length,
        entries,
      });
    }

    if (format === "markdown") {
      const markdown = generateMarkdown(entries);
      return new NextResponse(markdown, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="journal-export-${new Date().toISOString().split("T")[0]}.md"`,
        },
      });
    }

    if (format === "csv") {
      const csv = generateCSV(entries);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="journal-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to export entries" },
      { status: 500 }
    );
  }
}

function generateMarkdown(entries: any[]): string {
  let md = `# Journal Export\n\n`;
  md += `**Exported:** ${new Date().toLocaleString()}\n`;
  md += `**Total Entries:** ${entries.length}\n\n`;
  md += `---\n\n`;

  entries.forEach((entry) => {
    const date = new Date(entry.createdAt);
    md += `## ${date.toLocaleDateString()} - ${date.toLocaleTimeString()}\n\n`;

    if (entry.categories && entry.categories.length > 0) {
      md += `**Categories:** ${entry.categories.join(", ")}\n\n`;
    }

    md += `${entry.text}\n\n`;

    if (entry.summary) {
      md += `> **Summary:** ${entry.summary}\n\n`;
    }

    md += `**Mood:** ${entry.mood} (${entry.moodScore}%)\n`;

    if (entry.sentiment?.primary) {
      md += `**Sentiment:** ${entry.sentiment.primary}`;
      if (entry.sentiment.secondary) {
        md += ` + ${entry.sentiment.secondary}`;
      }
      md += `\n`;
    }

    if (entry.topics && entry.topics.length > 0) {
      md += `**Topics:** ${entry.topics.join(", ")}\n`;
    }

    if (entry.entities) {
      if (entry.entities.people?.length > 0) {
        md += `**People Mentioned:** ${entry.entities.people.join(", ")}\n`;
      }
      if (entry.entities.places?.length > 0) {
        md += `**Places:** ${entry.entities.places.join(", ")}\n`;
      }
      if (entry.entities.events?.length > 0) {
        md += `**Events:** ${entry.entities.events.join(", ")}\n`;
      }
    }

    md += `\n---\n\n`;
  });

  return md;
}

function generateCSV(entries: any[]): string {
  const headers = [
    "Date",
    "Time",
    "Entry Text",
    "Summary",
    "Mood",
    "Mood Score",
    "Sentiment",
    "Topics",
    "Categories",
    "People",
    "Places",
    "Events",
  ];

  let csv = headers.join(",") + "\n";

  entries.forEach((entry) => {
    const date = new Date(entry.createdAt);
    const row = [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      `"${(entry.text || "").replace(/"/g, '""')}"`,
      `"${(entry.summary || "").replace(/"/g, '""')}"`,
      entry.mood || "",
      entry.moodScore || 0,
      entry.sentiment?.primary || "",
      `"${(entry.topics || []).join("; ")}"`,
      `"${(entry.categories || []).join("; ")}"`,
      `"${(entry.entities?.people || []).join("; ")}"`,
      `"${(entry.entities?.places || []).join("; ")}"`,
      `"${(entry.entities?.events || []).join("; ")}"`,
    ];
    csv += row.join(",") + "\n";
  });

  return csv;
}
