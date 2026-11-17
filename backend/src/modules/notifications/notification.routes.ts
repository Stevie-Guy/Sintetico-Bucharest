import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/app-error";
import { getAuth, requireAuth } from "../../middleware/require-auth";
import { parseInput } from "../../middleware/parse-input";
import { paginationShape } from "../reservations/reservation.schemas";

const querySchema = z.strictObject({
  ...paginationShape, unreadOnly: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});
const idSchema = z.object({ id: z.uuid() });
export const notificationRouter = Router();
notificationRouter.use(requireAuth);

notificationRouter.get("/", async (req, res) => {
  const recipientId = getAuth(res).user.id;
  const { page, pageSize, unreadOnly } = parseInput(querySchema, req.query);
  const [records, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { recipientId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize + 1,
      select: { id: true, type: true, message: true, reservationId: true, readAt: true, createdAt: true,
        reservation: { select: { fieldId: true, status: true } } },
    }),
    prisma.notification.count({ where: { recipientId, readAt: null } }),
  ]);
  res.json({ notifications: records.slice(0, pageSize), unreadCount, page, pageSize, hasMore: records.length > pageSize });
});

notificationRouter.patch("/:id/read", async (req, res) => {
  const { id } = parseInput(idSchema, req.params);
  const recipientId = getAuth(res).user.id;
  const notification = await prisma.notification.findFirst({ where: { id, recipientId }, select: { id: true } });
  if (!notification) throw new AppError(404, "NOTIFICATION_NOT_FOUND", "Notificarea nu există.");
  await prisma.notification.updateMany({ where: { id, recipientId, readAt: null }, data: { readAt: new Date() } });
  res.status(204).end();
});
