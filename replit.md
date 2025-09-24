# Hospital Management System (HMS)

## Overview

This is a comprehensive Smart Hospital Management System built with modern web technologies. The application provides a complete solution for managing hospital operations including bed management, patient records, appointment scheduling, organ donor registry, doctor profiles, and an AI-powered chatbot assistant. The system features real-time updates, a responsive design, and an intuitive user interface for hospital staff and administrators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui design system for consistent, accessible components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

The frontend follows a component-based architecture with clear separation between layout, pages, and reusable UI components. The application uses a sidebar navigation pattern with dedicated pages for each major feature area.

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript for full-stack type safety
- **Real-time Communication**: WebSocket server for live updates (bed status, alerts, appointments)
- **API Design**: RESTful endpoints with consistent error handling and response formatting
- **Middleware**: Custom logging middleware for API request monitoring

The backend implements a modular route structure with dedicated handlers for each feature domain (beds, appointments, doctors, patients, etc.).

### Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless hosting for scalability
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Management**: Centralized schema definitions in shared directory for consistent types
- **Connection Pooling**: Neon connection pooling for efficient database resource management

The database schema uses PostgreSQL enums for status fields and includes proper relationships between entities (doctors, patients, beds, wards, appointments).

### Authentication and Authorization
- **Current Implementation**: Basic user profiles with role-based access (admin, doctor, staff)
- **Session Management**: Cookie-based sessions with PostgreSQL session store
- **Security**: Environment variable configuration for sensitive credentials

### External Service Integrations
- **AI Assistant**: OpenAI GPT-5 integration for intelligent chatbot functionality
- **Real-time Updates**: WebSocket connections for live dashboard updates
- **Development Tools**: Replit-specific plugins for development environment optimization

The system architecture emphasizes modularity, type safety, and real-time capabilities. The shared TypeScript definitions ensure consistency between frontend and backend, while the component-based frontend design enables easy feature expansion and maintenance.

## External Dependencies

- **Database**: Neon PostgreSQL serverless database with connection pooling
- **AI Services**: OpenAI API for chatbot and symptom analysis features
- **UI Library**: Radix UI primitives for accessible component foundations
- **Development Platform**: Replit with custom plugins for development workflow
- **Real-time Communication**: Native WebSocket implementation for live updates
- **Styling Framework**: Tailwind CSS with custom design tokens
- **Form Validation**: Zod schema validation library
- **Date Handling**: date-fns for consistent date operations across the application