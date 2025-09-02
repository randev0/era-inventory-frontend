import { NextRequest, NextResponse } from 'next/server';

// Mock users data
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
  {
    id: 6,
    email: 'jane.smith@clientb.com',
    first_name: 'Jane',
    last_name: 'Smith',
    org_id: 3,
    roles: ['project_admin'],
    is_active: false,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    last_login_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
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

    const token = authHeader.substring(7);
    const payload = parseJWTPayload(token);
    
    if (!payload || !payload.sub) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('q') || '';

    // Filter users based on search query
    let filteredUsers = MOCK_USERS;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = MOCK_USERS.filter(user => 
        user.email.toLowerCase().includes(searchLower) ||
        user.first_name?.toLowerCase().includes(searchLower) ||
        user.last_name?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const total = filteredUsers.length;
    const total_pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    const response = {
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        total_pages,
        has_next: page < total_pages,
        has_prev: page > 1,
      }
    };

    console.log('Mock users API request:', { page, limit, search, total, total_pages });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Mock users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const userData = await request.json();
    
    // Create new user (mock implementation)
    const newUser = {
      id: Math.max(...MOCK_USERS.map(u => u.id)) + 1,
      ...userData,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: null,
    };

    console.log('Mock user creation:', newUser);

    return NextResponse.json(newUser, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Mock user creation error:', error);
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
