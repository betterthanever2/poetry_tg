import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  // Get token from cookies
  const cookieHeader = request.headers.get('cookie');
  const token = cookieHeader?.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-do-not-use-in-prod';
    const decoded = jwt.verify(token, secret);
    return NextResponse.json({ authenticated: true, user: decoded });
  } catch (error) {
    return NextResponse.json({ authenticated: false });
  }
}
