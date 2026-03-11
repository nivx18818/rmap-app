import Fastify from "fastify";

const app = Fastify();

app.get("/health", async () => {
  return { status: "ok" };
});

app.listen({ port: 3001 });
