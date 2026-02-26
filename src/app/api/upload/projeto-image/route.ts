import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "Arquivo não fornecido" }, { status: 400 });
  }

  const container = getContainer();
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Upload para blob storage (Vercel Blob ou local)
  const url = await container.blobStorage.upload(
    buffer,
    `projetos/${Date.now()}-${file.name}`,
    file.type
  );

  return NextResponse.json({ url }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL não fornecida" }, { status: 400 });
    }

    const container = getContainer();
    const deleted = await container.blobStorage.delete(url);

    if (deleted) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Arquivo não encontrado ou erro ao deletar" }, { status: 404 });
    }
  } catch (error) {
    console.error("Erro ao deletar imagem:", error);
    return NextResponse.json({ error: "Erro interno ao deletar imagem" }, { status: 500 });
  }
}