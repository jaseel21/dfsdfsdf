import { NextResponse } from 'next/server';
import Admin from '@/models/Admin';
import dbConnect from '@/lib/db';
import { getToken } from 'next-auth/jwt';

// Helper: Check if user is Super Admin
async function isSuperAdmin(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log('TOKEN:', token); // Debug log
  return token && token.role === 'Super Admin';
}

// GET: List all admins
export async function GET(req) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await dbConnect();
  const admins = await Admin.find({}, '-__v').lean();
  return NextResponse.json(admins);
}

// POST: Create new admin
export async function POST(req) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await dbConnect();
  const { name, phone, email, role, permissions } = await req.json();
  if (!name || !phone || !email || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const exists = await Admin.findOne({ phone });
  if (exists) {
    return NextResponse.json({ error: 'Admin already exists' }, { status: 409 });
  }
  const admin = await Admin.create({ name, phone, email, role, permissions });
  return NextResponse.json(admin, { status: 201 });
}

// PUT: Update admin (by id in body)
export async function PUT(req) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await dbConnect();
  const { id, name, phone, email, role, permissions } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing admin id' }, { status: 400 });
  }
  const admin = await Admin.findByIdAndUpdate(
    id,
    { name, phone, email, role, permissions },
    { new: true }
  );
  if (!admin) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  }
  return NextResponse.json(admin);
}

// DELETE: Delete admin (by id in body)
export async function DELETE(req) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await dbConnect();
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing admin id' }, { status: 400 });
  }
  const admin = await Admin.findByIdAndDelete(id);
  if (!admin) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}