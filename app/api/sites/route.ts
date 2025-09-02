import { NextRequest, NextResponse } from 'next/server';

// Mock sites data
const MOCK_SITES = [
  {
    id: 1,
    name: 'Main Office',
    address: '123 Business St, Suite 100',
    city: 'Tech City',
    state: 'CA',
    zip_code: '90210',
    country: 'USA',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Data Center A',
    address: '456 Server Blvd',
    city: 'Server City',
    state: 'TX',
    zip_code: '75001',
    country: 'USA',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 3,
    name: 'Remote Office',
    address: '789 Work Ave',
    city: 'Remote Town',
    state: 'NY',
    zip_code: '10001',
    country: 'USA',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
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

    // Filter sites based on search query
    let filteredSites = MOCK_SITES;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSites = MOCK_SITES.filter(site => 
        site.name.toLowerCase().includes(searchLower) ||
        site.address.toLowerCase().includes(searchLower) ||
        site.city.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const total = filteredSites.length;
    const total_pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedSites = filteredSites.slice(offset, offset + limit);

    const response = {
      data: paginatedSites,
      pagination: {
        page,
        limit,
        total,
        total_pages,
        has_next: page < total_pages,
        has_prev: page > 1,
      }
    };

    console.log('Mock sites API request:', { page, limit, search, total, total_pages });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Mock sites API error:', error);
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

    const siteData = await request.json();
    
    const newSite = {
      id: Math.max(...MOCK_SITES.map(s => s.id)) + 1,
      ...siteData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Mock site creation:', newSite);

    return NextResponse.json(newSite, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Mock site creation error:', error);
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
