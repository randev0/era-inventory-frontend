import { NextRequest, NextResponse } from 'next/server';

// Mock items data
const MOCK_ITEMS = [
  {
    id: 1,
    asset_tag: 'LAP001',
    name: 'Dell Latitude 7420',
    manufacturer: 'Dell',
    model: 'Latitude 7420',
    device_type: 'Laptop',
    site: 'Main Office',
    installed_at: '2024-01-15',
    warranty_end: '2027-01-15',
    notes: 'Assigned to John Doe',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 2,
    asset_tag: 'MON002',
    name: 'Dell UltraSharp U2720Q',
    manufacturer: 'Dell',
    model: 'UltraSharp U2720Q',
    device_type: 'Monitor',
    site: 'Main Office',
    installed_at: '2024-02-01',
    warranty_end: '2027-02-01',
    notes: 'Main display for workstation 1',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 3,
    asset_tag: 'SRV003',
    name: 'HPE ProLiant DL380',
    manufacturer: 'HPE',
    model: 'ProLiant DL380',
    device_type: 'Server',
    site: 'Data Center A',
    installed_at: '2023-12-10',
    warranty_end: '2026-12-10',
    notes: 'Critical production server',
    created_at: '2023-12-10T00:00:00Z',
    updated_at: '2023-12-10T00:00:00Z',
  },
  {
    id: 4,
    asset_tag: 'TAB004',
    name: 'iPad Pro 12.9"',
    manufacturer: 'Apple',
    model: 'iPad Pro 12.9"',
    device_type: 'Tablet',
    site: 'Remote Office',
    installed_at: '2024-03-20',
    warranty_end: '2025-03-20',
    notes: 'Needs screen repair',
    created_at: '2024-03-20T00:00:00Z',
    updated_at: '2024-11-15T00:00:00Z',
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

    // Filter items based on search query
    let filteredItems = MOCK_ITEMS;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = MOCK_ITEMS.filter(item => 
        item.asset_tag.toLowerCase().includes(searchLower) ||
        item.name.toLowerCase().includes(searchLower) ||
        item.manufacturer?.toLowerCase().includes(searchLower) ||
        item.model?.toLowerCase().includes(searchLower) ||
        item.device_type?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const total = filteredItems.length;
    const total_pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedItems = filteredItems.slice(offset, offset + limit);

    const response = {
      data: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        total_pages,
        has_next: page < total_pages,
        has_prev: page > 1,
      }
    };

    console.log('Mock items API request:', { page, limit, search, total, total_pages });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Mock items API error:', error);
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

    const itemData = await request.json();
    
    const newItem = {
      id: Math.max(...MOCK_ITEMS.map(i => i.id)) + 1,
      ...itemData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Mock item creation:', newItem);

    return NextResponse.json(newItem, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Mock item creation error:', error);
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
