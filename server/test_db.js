const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
    const chamados = await prisma.chamado.findMany({ take: 5, orderBy: { criado: "desc" } });
    console.log(chamados.map(c => ({ criado: c.criado, fimDoPrazo: c.fimDoPrazo })));
}
main().finally(() => prisma.$disconnect());
