import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params in Next.js 15+
    const { id } = await params;

    // Validate id
    if (!id || typeof id !== "string" || id.trim() === "") {
      return NextResponse.json(
        { error: "Invalid entry ID" },
        { status: 400 }
      );
    }

    // Get the entry to verify ownership
    const entryRef = adminDb.collection("entries").doc(id);
    const entrySnap = await entryRef.get();

    if (!entrySnap.exists) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const entryData = entrySnap.data();
    if (entryData?.uid !== decoded.uid) {
      return NextResponse.json(
        { error: "Not authorized to delete this entry" },
        { status: 403 }
      );
    }

    // Delete the entry
    await entryRef.delete();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete entry" },
      { status: 500 }
    );
  }
}
