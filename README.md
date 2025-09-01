# Era Inventory Frontend

A modern IT inventory management system built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Multi-tenant Architecture**: Support for main organization and client tenants
- **Role-based Access Control**: Granular permissions for different user roles
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Real-time Data**: TanStack Query for efficient server state management
- **Type Safety**: Full TypeScript implementation

## Tech Stack

- **Next.js 14** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **TanStack Query** for server state management
- **Axios** for API communication
- **React Hook Form + Zod** for forms and validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8080`

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd era-inventory-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Test Accounts

Use these seed accounts to test the application:

- **Main Tenant Super Admin**: `superadmin@maintenant.com` / `Password123!`
- **Client Org Admin**: `admin@clienta.com` / `Password123!`
- **Project Manager**: `manager@clienta.com` / `Password123!`
- **Viewer**: `viewer@clienta.com` / `Password123!`

## Multi-tenant Support

- **Main Tenant** (org_id=1): Can manage all organizations and switch between them
- **Client Tenants**: Restricted to their own organization's data
- **Org Switcher**: Available for main tenant users to view/manage client organizations

## Role-based Permissions

- **org_admin**: Full access to organization management, users, and all inventory
- **project_admin**: Can create/edit items, limited administrative access
- **viewer**: Read-only access to inventory and basic information

## License

MIT License - see [LICENSE](LICENSE) file for details.