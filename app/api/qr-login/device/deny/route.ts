import { NextRequest } from "next/server";
import { decide } from "../decide";

export async function POST(request: NextRequest) {
  return decide(request, "deny");
}
