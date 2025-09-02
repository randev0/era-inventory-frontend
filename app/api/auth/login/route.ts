import { NextRequest, NextResponse } from 'next/server';

// Mock user data - in a real backend this would come from a database
const MOCK_USERS = [
  {
    id: 1,
    email: 'superadmin@maintenant.com',
    password: 'Password123!',
    first_name: 'Super',
    last_name: 'Admin',
    org_id: 1,
    roles: ['org_admin'],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    email: 'admin@clienta.com',
    password: 'Password123!',
    first_name: 'Client',
    last_name: 'Admin',
    org_id: 2,
    roles: ['org_admin'],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    email: 'manager@clienta.com',
    password: 'Password123!',
    first_name: 'Project',
    last_name: 'Manager',
    org_id: 2,
    roles: ['project_admin'],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 4,
    email: 'viewer@clienta.com',
    password: 'Password123!',
    first_name: 'Data',
    last_name: 'Viewer',
    org_id: 2,
    roles: ['viewer'],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// Generate a mock JWT token (this is just for demo - in production use proper JWT library)
function generateMockJWT(user: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: user.id.toString(),
    org_id: user.org_id,
    roles: user.roles,
    iss: 'era-inventory',
    aud: 'era-inventory-frontend',
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
    iat: Math.floor(Date.now() / 1000),
  };

  // Base64 encode (this is NOT secure - use proper JWT library in production)
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = 'mock-signature'; // In production, this would be a proper HMAC signature

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('Mock login attempt:', { email, password: '***' });

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = MOCK_USERS.find(u => u.email === email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password (in production, use proper password hashing)
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateMockJWT(user);

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    const response = {
      token,
      user: userWithoutPassword
    };

    console.log('Mock login successful:', { email, user: userWithoutPassword });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Mock login error:', error);
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
