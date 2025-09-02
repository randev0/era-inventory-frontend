import { NextRequest, NextResponse } from 'next/server';

// Mock organizations data
const MOCK_ORGANIZATIONS = [
  {
    id: 1,
    name: 'Main Tenant Corp',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Client A Corporation',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 3,
    name: 'Client B Industries',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
  {
    id: 4,
    name: 'Tech Startup Inc',
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
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

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('q') || '';

    // Filter organizations based on search query
    let filteredOrgs = MOCK_ORGANIZATIONS;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOrgs = MOCK_ORGANIZATIONS.filter(org => 
        org.name.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const total = filteredOrgs.length;
    const total_pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedOrgs = filteredOrgs.slice(offset, offset + limit);

    const response = {
      data: paginatedOrgs,
      pagination: {
        page,
        limit,
        total,
        total_pages,
        has_next: page < total_pages,
        has_prev: page > 1,
      }
    };

    console.log('Mock organizations API request:', { page, limit, search, total, total_pages });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Mock organizations API error:', error);
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

    const orgData = await request.json();
    
    const newOrg = {
      id: Math.max(...MOCK_ORGANIZATIONS.map(o => o.id)) + 1,
      ...orgData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Mock organization creation:', newOrg);

    return NextResponse.json(newOrg, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Mock organization creation error:', error);
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
