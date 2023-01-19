import dayjs from "dayjs";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "./lib/prisma";

export async function AppRoutes(app: FastifyInstance) {
  app.post("/habits", async (request, response) => {
    const createHabitBody = z.object({
      title: z.string(),
      weekDays: z.array(z.number().min(0).max(6)),
    });

    const { title, weekDays } = createHabitBody.parse(request.body);

    // startOf -> zera as horas e segundos
    // toDate -> Retorna Date do javascript
    const today = dayjs().startOf("day").toDate();

    await prisma.habit.create({
      data: {
        title,
        created_at: today,
        weekDays: {
          create: weekDays.map((weekDay) => {
            return {
              week_day: weekDay,
            };
          }),
        },
      },
    });
  });

  app.get("/day", async (request, response) => {
    const getDayParams = z.object({
      date: z.coerce.date(),
    });

    // localhost:3333/day?date=yyyy-MM-dd
    const { date } = getDayParams.parse(request.query);
    const weekDay = dayjs(date).get("day");

    console.log(date);
    console.log(weekDay);

    const possibleHabits = await prisma.habit.findMany({
      where: {
        created_at: {
          lte: date,
        },
        weekDays: {
          some: {
            week_day: weekDay,
          },
        },
      },
    });

    return {
      possibleHabits,
    };
  });
}
