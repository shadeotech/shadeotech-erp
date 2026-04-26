import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Note from '@/lib/models/Note';
import { verifyAuth } from '@/lib/auth';

function toApi(n: any) {
  return {
    id: n._id.toString(),
    _id: n._id.toString(),
    content: n.content,
    noteType: n.noteType,
    type: n.noteType.toLowerCase(),
    customerId: n.customerId,
    createdById: n.createdById,
    direction: n.direction ?? null,
    outcome: n.outcome ?? null,
    subject: n.subject ?? null,
    loggedAt: n.loggedAt ?? null,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    timestamp: n.loggedAt ?? n.createdAt,
  }
}

export async function GET(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }
    await connectDB();
    const notes = await Note.find({ customerId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ notes: notes.map(toApi) }, { status: 200 });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { content, noteType, customerId, direction, outcome, subject, loggedAt } = body;
    if (!content || !customerId) {
      return NextResponse.json({ error: 'content and customerId are required' }, { status: 400 });
    }
    const validTypes = ['NOTE', 'CALL', 'TEXT', 'EMAIL'];
    const type = validTypes.includes(noteType) ? noteType : 'NOTE';
    await connectDB();
    const note = new Note({
      content: String(content).trim(),
      noteType: type,
      customerId: String(customerId),
      createdById: authPayload.userId,
      direction: direction || undefined,
      outcome: outcome || undefined,
      subject: subject || undefined,
      loggedAt: loggedAt ? new Date(loggedAt) : undefined,
    });
    await note.save();
    const created = note.toObject();
    return NextResponse.json({ success: true, note: toApi(created) }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
