import { NextRequest, NextResponse } from 'next/server';

// Mock items data (should be shared with main items route in real app)
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

    const itemId = parseInt(params.id);
    const item = MOCK_ITEMS.find(i => i.id === itemId);
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(item, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Mock item GET error:', error);
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

    const itemId = parseInt(params.id);
    const itemIndex = MOCK_ITEMS.findIndex(i => i.id === itemId);
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    const updateData = await request.json();
    const updatedItem = {
      ...MOCK_ITEMS[itemIndex],
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    console.log('Mock item update:', updatedItem);

    return NextResponse.json(updatedItem, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Mock item PUT error:', error);
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

    const itemId = parseInt(params.id);
    const itemIndex = MOCK_ITEMS.findIndex(i => i.id === itemId);
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    console.log('Mock item deletion:', MOCK_ITEMS[itemIndex]);

    return new NextResponse(null, {
      status: 204,
    });

  } catch (error) {
    console.error('Mock item DELETE error:', error);
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
