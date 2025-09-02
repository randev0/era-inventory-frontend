import { NextRequest, NextResponse } from 'next/server';

// Mock users data (should be shared with main users route in real app)
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
  {
    id: 5,
    email: 'john.doe@clienta.com',
    first_name: 'John',
    last_name: 'Doe',
    org_id: 2,
    roles: ['viewer'],
    is_active: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    last_login_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const userId = parseInt(params.id);
    const user = MOCK_USERS.find(u => u.id === userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Mock user GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const userId = parseInt(params.id);
    const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const updateData = await request.json();
    const updatedUser = {
      ...MOCK_USERS[userIndex],
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    console.log('Mock user update:', updatedUser);

    return NextResponse.json(updatedUser, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Mock user PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const userId = parseInt(params.id);
    const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Mock user deletion:', MOCK_USERS[userIndex]);

    return new NextResponse(null, {
      status: 204,
    });

  } catch (error) {
    console.error('Mock user DELETE error:', error);
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
