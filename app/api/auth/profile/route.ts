import { NextRequest, NextResponse } from 'next/server';

// Mock user data - in a real backend this would come from a database and JWT verification
const MOCK_USERS = [
  {
    id: 1,
    email: 'superadmin@maintenant.com',
    first_name: 'Super',
    last_name: 'Admin',
    org_id: 1,
    roles: ['org_admin'],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_login_at: new Date().toISOString(),
  },
  {
    id: 2,
    email: 'admin@clienta.com',
    first_name: 'Client',
    last_name: 'Admin',
    org_id: 2,
    roles: ['org_admin'],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_login_at: new Date().toISOString(),
  },
  {
    id: 3,
    email: 'manager@clienta.com',
    first_name: 'Project',
    last_name: 'Manager',
    org_id: 2,
    roles: ['project_admin'],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_login_at: new Date().toISOString(),
  },
  {
    id: 4,
    email: 'viewer@clienta.com',
    first_name: 'Data',
    last_name: 'Viewer',
    org_id: 2,
    roles: ['viewer'],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_login_at: new Date().toISOString(),
  },
];

function parseJWTPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return payload;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = parseJWTPayload(token);
    
    if (!payload || !payload.sub) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Find user by ID from JWT payload
    const userId = parseInt(payload.sub);
    const user = MOCK_USERS.find(u => u.id === userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Mock profile request successful for user:', user.email);

    return NextResponse.json(user, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Mock profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
