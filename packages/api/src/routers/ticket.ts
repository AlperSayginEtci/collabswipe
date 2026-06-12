import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const ticketRouter = createTRPCRouter({
  // Kullanıcının kendi destek taleplerini çekmesi
  getMyTickets: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.ticket.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { updatedAt: "desc" },
    });
  }),

  // Yeni bir destek talebi oluşturma
  createTicket: protectedProcedure
    .input(z.object({ subject: z.string(), category: z.string(), message: z.string(), mediaFiles: z.array(z.string()).optional() }))
    .mutation(async ({ ctx, input }) => {
      console.log("createTicket called! Payload size:", JSON.stringify(input).length, "bytes. Media files count:", input.mediaFiles?.length);
      const ticket = await ctx.prisma.ticket.create({
        data: {
          userId: ctx.session.user.id,
          subject: input.subject,
          category: input.category,
          status: "OPEN",
          messages: {
            create: {
              senderId: ctx.session.user.id,
              content: input.message,
              isAdmin: false,
            }
          }
        },
        include: {
          messages: true
        }
      });

      if (input.mediaFiles && input.mediaFiles.length > 0) {
        try {
          const fs = await import('fs/promises');
          const path = await import('path');
          
          const uploadPromises = input.mediaFiles.map(async (base64Str, index) => {
            const uniqueName = `ticket_${ticket.id}_${Date.now()}_${index}.jpg`;
            const uploadDir = path.join(process.cwd(), '..', 'server', 'public', 'uploads');
            await fs.mkdir(uploadDir, { recursive: true });
            
            const filePath = path.join(uploadDir, uniqueName);
            const fileBuffer = Buffer.from(base64Str, "base64");
            await fs.writeFile(filePath, fileBuffer);
            
            return `http://localhost:3001/uploads/${uniqueName}`;
          });

          const urls = await Promise.all(uploadPromises);
          
          await ctx.prisma.ticketMessage.update({
            where: { id: ticket.messages[0].id },
            data: { attachmentUrls: urls }
          });
        } catch (error: any) {
          console.error("Dropbox Upload Error in createTicket:", error?.error || error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Medya yüklenirken bir hata oluştu" });
        }
      }

      return ticket;
    }),

  // Bir talebin detaylarını ve mesajlarını getirme
  getTicketById: protectedProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.ticket.findUnique({
        where: { id: input.ticketId },
        include: {
          messages: {
            include: { sender: { select: { name: true, surname: true, image: true } } },
            orderBy: { createdAt: "asc" }
          },
          user: { select: { name: true, surname: true, email: true, image: true } }
        }
      });
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
      
      // Sadece ticket sahibi veya admin görebilir
      if (ticket.userId !== ctx.session.user.id && ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ticket;
    }),

  // Bilete mesaj ekleme (Kullanıcı veya Admin)
  addMessage: protectedProcedure
    .input(z.object({ ticketId: z.string(), content: z.string(), mediaFiles: z.array(z.string()).optional() }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.ticket.findUnique({ where: { id: input.ticketId } });
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });

      const isAdmin = ctx.session.user.role === "admin";
      if (!isAdmin && ticket.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const message = await ctx.prisma.ticketMessage.create({
        data: {
          ticketId: input.ticketId,
          senderId: ctx.session.user.id,
          content: input.content,
          isAdmin: isAdmin,
        }
      });

      if (input.mediaFiles && input.mediaFiles.length > 0) {
        try {
          const fs = await import('fs/promises');
          const path = await import('path');
          
          const uploadPromises = input.mediaFiles.map(async (base64Str, index) => {
            const uniqueName = `ticket_msg_${message.id}_${Date.now()}_${index}.jpg`;
            const uploadDir = path.join(process.cwd(), '..', 'server', 'public', 'uploads');
            await fs.mkdir(uploadDir, { recursive: true });
            
            const filePath = path.join(uploadDir, uniqueName);
            const fileBuffer = Buffer.from(base64Str, "base64");
            await fs.writeFile(filePath, fileBuffer);
            
            return `http://localhost:3001/uploads/${uniqueName}`;
          });

          const urls = await Promise.all(uploadPromises);
          
          await ctx.prisma.ticketMessage.update({
            where: { id: message.id },
            data: { attachmentUrls: urls }
          });
        } catch (error: any) {
          console.error("Dropbox Upload Error in addMessage:", error?.error || error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Medya yüklenirken bir hata oluştu" });
        }
      }

      // Ticket'ı tekrar açık duruma getir ve güncellenme tarihini ayarla
      await ctx.prisma.ticket.update({
        where: { id: input.ticketId },
        data: { 
          status: isAdmin ? "OPEN" : "OPEN", // İleride bekliyor v.s eklenebilir
          updatedAt: new Date()
        }
      });

      // Eğer admin cevap yazdıysa, kullanıcıya bildirim at
      if (isAdmin) {
        await ctx.prisma.notification.create({
          data: {
            userId: ticket.userId,
            title: 'Destek Talebinize Cevap Geldi',
            message: `"${ticket.subject}" başlıklı destek talebinize yeni bir cevap yazıldı.`,
            link: `/support?ticketId=${ticket.id}`
          }
        });
      }

      return message;
    }),

  // (Admin) Tüm biletleri listeleme
  getAllTickets: adminProcedure.query(({ ctx }) => {
    return ctx.prisma.ticket.findMany({
      include: {
        user: { select: { name: true, surname: true, email: true, image: true } }
      },
      orderBy: { updatedAt: "desc" }
    });
  }),

  // (Admin) Bileti kapatma
  closeTicket: adminProcedure
    .input(z.object({ ticketId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.ticket.update({
        where: { id: input.ticketId },
        data: { status: "CLOSED" }
      });
    }),
});
