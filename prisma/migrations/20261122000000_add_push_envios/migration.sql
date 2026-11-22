-- CreateTable
CREATE TABLE "PushEnvio" (
    "chave" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushEnvio_pkey" PRIMARY KEY ("chave")
);
