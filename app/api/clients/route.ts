import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { listClients, saveClient } from '@/lib/sheets';
import { Client } from '@/types/invoice';

export async function GET() {
  try {
    const clients = await listClients();
    return NextResponse.json(clients);
  } catch (err) {
    console.error('GET /api/clients:', err);
    return NextResponse.json({ error: 'Failed to load clients' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client: Client = {
      id: uuidv4(),
      name: body.name ?? '',
      company: body.company ?? '',
      npwp: body.npwp ?? '',
      email: body.email ?? '',
      phone: body.phone ?? '',
      createdAt: new Date().toISOString(),
    };
    await saveClient(client);
    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    console.error('POST /api/clients:', err);
    return NextResponse.json({ error: 'Failed to save client' }, { status: 500 });
  }
}
