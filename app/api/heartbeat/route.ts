import { NextResponse } from "next/server";

export async function POST() {
  // This is a dummy endpoint to intercept and silence heartbeat POST requests
  // that are likely coming from an external extension, plugin, or tunnel proxy.
  // It returns a 200 OK so the dev server stops spamming 404 errors in the console.
  return NextResponse.json({ status: "alive" }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ status: "alive" }, { status: 200 });
}
