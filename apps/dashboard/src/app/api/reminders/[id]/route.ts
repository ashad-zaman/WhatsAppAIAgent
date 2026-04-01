import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.text !== undefined) updateData.title = body.text;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.scheduledAt !== undefined) updateData.scheduledAt = new Date(body.scheduledAt);
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.repeatType !== undefined) updateData.repeatType = body.repeatType;
    if (body.recurring !== undefined) updateData.repeatType = body.recurring ? 'DAILY' : 'NONE';
    if (body.status !== undefined) updateData.status = body.status;
    if (body.completed !== undefined) updateData.status = body.completed ? 'COMPLETED' : 'PENDING';
    if (body.metadata !== undefined) updateData.metadata = body.metadata;

    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedReminder);
  } catch (error) {
    console.error('Failed to update reminder:', error);
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    await prisma.reminder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete reminder:', error);
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
  }
}
