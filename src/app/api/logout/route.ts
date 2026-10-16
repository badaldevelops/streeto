import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
    domain: ".qtoo.in",
  });

  return response;
}
