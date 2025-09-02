import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest('GET', request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest('POST', request, params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest('PUT', request, params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest('DELETE', request, params);
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Org-Override',
      'Access-Control-Max-Age': '86400',
    },
  });
}

async function handleRequest(
  method: string,
  request: NextRequest,
  params: { path: string[] }
) {
  try {
    const path = params.path?.join('/') || '';
    const url = new URL(request.url);
    const backendUrl = `${BACKEND_URL}/${path}${url.search}`;
    
    console.log(`Proxying ${method} request to:`, backendUrl);

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward relevant headers from the original request
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const orgOverride = request.headers.get('X-Org-Override');
    if (orgOverride) {
      headers['X-Org-Override'] = orgOverride;
    }

    // Prepare request body for POST/PUT requests
    let body: string | undefined;
    if (method === 'POST' || method === 'PUT') {
      try {
        body = await request.text();
      } catch (error) {
        console.log('No body to forward');
      }
    }

    // Make the request to the backend
    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
    });

    // Get response data
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    console.log(`Proxied ${method} ${path} - Status: ${response.status}, Data:`, responseData);

    // Return the response with CORS headers
    if (contentType?.includes('application/json')) {
      return NextResponse.json(responseData, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Org-Override',
        },
      });
    } else {
      return new NextResponse(responseData, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Org-Override',
          'Content-Type': contentType || 'text/plain',
        },
      });
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to backend' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Org-Override',
        }
      }
    );
  }
}
