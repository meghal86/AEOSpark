import { NextResponse } from "next/server";
import { z } from "zod";

import { inngest } from "@/inngest/client";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({
  orderId: z.string().uuid(),
});

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export async function POST(request: Request) {
  const user = await getUser();

  if (!user?.email) {
    return NextResponse.json(
      { success: false, error: "Sign in to re-measure this audit." },
      { status: 401 },
    );
  }

  let payload: z.infer<typeof requestSchema>;
  try {
    payload = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { success: false, error: "A valid order is required." },
      { status: 400 },
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: payload.orderId },
  });

  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found." },
      { status: 404 },
    );
  }

  const ownsOrder =
    order.userId === user.id ||
    (!order.userId && order.email.toLowerCase() === user.email.toLowerCase());

  if (!ownsOrder) {
    return NextResponse.json(
      { success: false, error: "This audit does not belong to your account." },
      { status: 403 },
    );
  }

  if (order.status !== "delivered") {
    return NextResponse.json(
      { success: false, error: "Re-measurement is available after the audit is delivered." },
      { status: 409 },
    );
  }

  const now = new Date();
  const windowEnds =
    order.measurementWindowEndsAt ??
    addDays(order.deliveredAt ?? order.createdAt, 90);

  if (windowEnds < now) {
    return NextResponse.json(
      { success: false, error: "The 90-day measurement window has ended." },
      { status: 409 },
    );
  }

  const totalRuns = await prisma.scoreHistory.count({
    where: { orderId: order.id },
  });

  if (totalRuns >= 4) {
    return NextResponse.json(
      { success: false, error: "All three monthly re-measurements have already been used." },
      { status: 409 },
    );
  }

  const existingThisMonth = await prisma.scoreHistory.findFirst({
    where: {
      orderId: order.id,
      createdAt: { gte: monthStart(now) },
      runNumber: { gt: 1 },
    },
  });

  if (existingThisMonth) {
    return NextResponse.json(
      { success: false, error: "This audit has already been re-measured this month." },
      { status: 409 },
    );
  }

  if (!order.userId) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        userId: user.id,
        measurementWindowEndsAt: windowEnds,
      },
    });
  }

  await inngest.send({
    name: "remeasure/requested",
    data: {
      orderId: order.id,
      userId: user.id,
    },
  });

  return NextResponse.json({ success: true });
}
